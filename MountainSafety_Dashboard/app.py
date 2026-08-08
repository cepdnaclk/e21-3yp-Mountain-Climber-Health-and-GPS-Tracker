from flask import Flask, render_template_string, request, jsonify, Response
import serial
import serial.tools.list_ports
import threading
import time
import math
import json
import sqlite3
import re
import os
import webbrowser

# ===================== CONFIG =====================
APP_NAME = "MountainSafety Basecamp Dashboard"
APP_VERSION = "1.0.0"
DASHBOARD_URL = "http://127.0.0.1:5000"

def auto_select_port():
    env_port = os.environ.get("MCS_SERIAL_PORT", "").strip()
    if env_port:
        return env_port

    ports = serial.tools.list_ports.comports()
    for p in ports:
        desc = p.description.upper()
        name = p.device.upper()
        if any(x in desc for x in ["CP210", "CH340", "USB", "UART"]) or any(x in name for x in ["USB", "UART", "COM"]):
            return p.device
    if ports:
        return ports[0].device
    return "COM3"

SERIAL_PORT = auto_select_port()
BAUD_RATE = 115200

BASE_NAME = "BASE CAMP"
base_lat = 7.253061
base_lon = 80.592154
base_alt = 0.0
base_source = "DEFAULT"
base_updated_at = int(time.time())
base_location_seq = 1

ONLINE_TIMEOUT_S = 25
NO_PACKET_WARNING_S = 12
MAP_MIN_RADIUS_M = 250.0
PATH_MIN_MOVE_M = 15.0

app = Flask(__name__)

ser = None
serial_status = "Serial not connected"
serial_lock = threading.Lock()

seen_message_ids = set()
pending_commands = []

# ===================== DB SETUP =====================
DB_PATH = 'climbers.db'

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS climbers
                 (id TEXT PRIMARY KEY, lat REAL, lon REAL, alt REAL, gps TEXT, gps_fix INTEGER,
                  gps_age_s INTEGER, gps_satellites INTEGER, gps_hdop REAL, gps_reject TEXT,
                  has_last_known INTEGER, last_known_lat REAL, last_known_lon REAL, last_known_age_s INTEGER,
                  bpm INTEGER, battery INTEGER, armband_battery INTEGER, sos INTEGER, ble INTEGER, sen INTEGER,
                  rssi INTEGER, snr REAL, last_seen INTEGER, last_packet TEXT, last_message TEXT, last_reply TEXT,
                  base_seq_seen INTEGER, distance_m REAL, bearing_deg REAL, direction TEXT, move_bearing REAL,
                  move_direction TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS path_points
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, climber_id TEXT, lat REAL, lon REAL, time TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, text TEXT, time TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS event_log
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, level TEXT, source TEXT, event TEXT, details TEXT)''')
    
    try:
        c.execute("ALTER TABLE climbers ADD COLUMN display_name TEXT")
    except sqlite3.OperationalError:
        pass 

    try:
        c.execute("ALTER TABLE climbers ADD COLUMN hop_count INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    try:
        c.execute("ALTER TABLE climbers ADD COLUMN via_repeater INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
        
    conn.commit()
    conn.close()

init_db()

# ===================== HELPERS =====================
def now_time():
    return time.strftime("%H:%M:%S")

def add_event(level, source, event, details=""):
    conn = get_db()
    conn.execute("INSERT INTO event_log (time, level, source, event, details) VALUES (?, ?, ?, ?, ?)",
                 (now_time(), str(level or "INFO"), str(source or "SYSTEM"), str(event or ""), str(details or "")))
    conn.execute("DELETE FROM event_log WHERE id NOT IN (SELECT id FROM event_log ORDER BY id DESC LIMIT 1000)")
    conn.commit()
    conn.close()

def get_events(limit=120):
    conn = get_db()
    rows = conn.execute("SELECT * FROM event_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows][::-1]

def clear_events():
    conn = get_db()
    conn.execute("DELETE FROM event_log")
    conn.commit()
    conn.close()

def extract(packet, key):
    packet = str(packet or "")
    match = re.search(r'(?:^|,)' + re.escape(key) + r':([^,]*)', packet)
    if match:
        return match.group(1)
    return ""

def packet_text(packet):
    packet = str(packet or "")
    for marker in ["TEXT:", "MSG:", "TXT:"]:
        if marker in packet:
            txt = packet.split(marker, 1)[1].strip()
            for cut in [",LAT:", ",LON:", ",ALT:", ",GPS:", ",FIX:", ",LK:", ",BAT:", ",SOS:", ",BLE:", ",SEN:"]:
                if cut in txt:
                    txt = txt.split(cut, 1)[0].strip()
            if len(txt) >= 2 and txt[0] == '"' and txt[-1] == '"':
                txt = txt[1:-1].strip()
            return txt[:160] if txt else ""
    if "TYPE:SOS_CLEAR" in packet: return "SOS cleared"
    if "TYPE:SOS" in packet: return "SOS EMERGENCY"
    return ""

def get_messages(limit=50):
    conn = get_db()
    rows = conn.execute("SELECT * FROM messages ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows][::-1]

def add_chat(sender, text):
    text = str(text or "").strip()
    if not text: return
    if "TYPE:" in text: text = packet_text(text)
    if not text: return
    
    bad_placeholders = {"message received", "received", "msg received"}
    if text.strip().lower() in bad_placeholders: return
    
    conn = get_db()
    last = conn.execute("SELECT sender, text FROM messages ORDER BY id DESC LIMIT 1").fetchone()
    if last and last["sender"] == sender and last["text"] == text:
        conn.close()
        return

    conn.execute("INSERT INTO messages (sender, text, time) VALUES (?, ?, ?)", (sender, text[:160], now_time()))
    conn.execute("DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY id DESC LIMIT 200)")
    conn.commit()
    conn.close()
    
    add_event("MESSAGE", sender, "Chat", text[:160])

def to_float(v, default=0.0):
    try: return float(v)
    except: return default

def to_int(v, default=0):
    try: return int(v)
    except: return default

def to_int_or_none(v, default=None):
    try: return int(v)
    except: return default

def haversine_m(lat1, lon1, lat2, lon2):
    if lat1 == 0 and lon1 == 0: return 0.0
    if lat2 == 0 and lon2 == 0: return 0.0
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    a = max(0.0, min(1.0, a))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

def bearing_deg(lat1, lon1, lat2, lon2):
    if lat1 == 0 and lon1 == 0: return 0.0
    if lat2 == 0 and lon2 == 0: return 0.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(y, x)) + 360) % 360

def direction_text(deg):
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return dirs[round(deg / 45) % 8]

def is_duplicate_packet(packet):
    mid = extract(packet, "MID")
    if not mid: return False
    if mid in seen_message_ids: return True
    seen_message_ids.add(mid)
    if len(seen_message_ids) > 300: seen_message_ids.clear()
    return False

def get_all_climbers():
    conn = get_db()
    rows = conn.execute("SELECT * FROM climbers").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_climber(cid):
    conn = get_db()
    row = conn.execute("SELECT * FROM climbers WHERE id=?", (cid,)).fetchone()
    
    if not row:
        c = {
            "id": cid, "display_name": f"Climber ({cid})", "lat": 0.0, "lon": 0.0, "alt": 0.0, "gps": "NO_GPS", "gps_fix": 0,
            "gps_age_s": 0, "gps_satellites": 0, "gps_hdop": 99.9, "gps_reject": "waiting",
            "has_last_known": 0, "last_known_lat": 0.0, "last_known_lon": 0.0, "last_known_age_s": 0,
            "bpm": 0, "battery": None, "armband_battery": None, "sos": 0, "ble": 0, "sen": 0,
            "rssi": 0, "snr": 0.0, "last_seen": 0, "last_packet": "No packet yet",
            "last_message": "No message yet", "last_reply": "No reply sent yet",
            "base_seq_seen": 0, "distance_m": 0.0, "bearing_deg": 0.0, "direction": "N",
            "move_bearing": 0.0, "move_direction": "N", "hop_count": 0, "via_repeater": 0
        }
        cols = ", ".join(c.keys())
        places = ", ".join(["?"] * len(c))
        conn.execute(f"INSERT INTO climbers ({cols}) VALUES ({places})", tuple(c.values()))
        conn.commit()
    else:
        c = dict(row)
    
    path_rows = conn.execute("SELECT lat, lon, time FROM path_points WHERE climber_id=? ORDER BY id ASC", (cid,)).fetchall()
    c["path"] = [dict(r) for r in path_rows]
    conn.close()
    return c

def find_climber(cid):
    """Read-only lookup. Returns the climber dict if it already exists, or None.
    Never creates a new row - use this for any code path acting on a target
    supplied by an outgoing message/action rather than real incoming telemetry."""
    conn = get_db()
    row = conn.execute("SELECT * FROM climbers WHERE id=?", (cid,)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_climber(cid):
    conn = get_db()
    conn.execute("DELETE FROM climbers WHERE id=?", (cid,))
    conn.execute("DELETE FROM path_points WHERE climber_id=?", (cid,))
    conn.commit()
    conn.close()

def save_climber(c):
    conn = get_db()
    d = dict(c)
    if "path" in d: del d["path"]
    
    cols = []
    vals = []
    for k, v in d.items():
        if k != "id":
            cols.append(f"{k}=?")
            vals.append(v)
    vals.append(d["id"])
    
    conn.execute(f"UPDATE climbers SET {', '.join(cols)} WHERE id=?", tuple(vals))
    conn.commit()
    conn.close()

def add_path_point(c):
    lat, lon = c["lat"], c["lon"]
    if lat == 0 or lon == 0: return

    if c.get("path"):
        last = c["path"][-1]
        moved = haversine_m(last["lat"], last["lon"], lat, lon)
        if moved < PATH_MIN_MOVE_M: return
        if moved > 120 and c.get("gps_age_s", 0) < 10: return
        
        c["move_bearing"] = bearing_deg(last["lat"], last["lon"], lat, lon)
        c["move_direction"] = direction_text(c["move_bearing"])

    pt = {"lat": lat, "lon": lon, "time": now_time()}
    if "path" not in c: c["path"] = []
    c["path"].append(pt)
    
    if len(c["path"]) > 80:
        c["path"] = c["path"][-80:]
        
    conn = get_db()
    conn.execute("INSERT INTO path_points (climber_id, lat, lon, time) VALUES (?, ?, ?, ?)", (c["id"], lat, lon, pt["time"]))
    conn.execute("DELETE FROM path_points WHERE id NOT IN (SELECT id FROM path_points WHERE climber_id=? ORDER BY id DESC LIMIT 80)", (c["id"],))
    conn.commit()
    conn.close()

def update_distance(c):
    lat, lon = c["lat"], c["lon"]
    if c["gps_fix"] != 1 and c["has_last_known"] == 1:
        lat, lon = c["last_known_lat"], c["last_known_lon"]
    c["distance_m"] = haversine_m(base_lat, base_lon, lat, lon)
    c["bearing_deg"] = bearing_deg(base_lat, base_lon, lat, lon)
    c["direction"] = direction_text(c["bearing_deg"])

def normalize_gps_state(c):
    if c["gps"] in ["NEO6M", "PHONE"]: c["gps_fix"] = 1
    else: c["gps_fix"] = 0
    if c["gps"] == "NO_FIX_LAST_KNOWN": c["has_last_known"] = 1
    if c["gps"] == "NO_GPS": c["gps_fix"] = 0

def update_climber_from_packet(cid, packet, rssi, snr):
    c = get_climber(cid)
    c["last_packet"] = packet
    c["rssi"] = rssi
    c["snr"] = snr
    c["last_seen"] = int(time.time())

    gps = extract(packet, "GPS")
    if gps: c["gps"] = gps

    c["gps_fix"] = to_int(extract(packet, "FIX"), c["gps_fix"])
    c["gps_age_s"] = to_int(extract(packet, "GAGE"), c["gps_age_s"])
    c["gps_satellites"] = to_int(extract(packet, "SAT"), c["gps_satellites"])
    c["gps_hdop"] = to_float(extract(packet, "HDOP"), c["gps_hdop"])
    
    grej = extract(packet, "GREJ")
    if grej: c["gps_reject"] = grej

    c["has_last_known"] = to_int(extract(packet, "LK"), c["has_last_known"])
    c["last_known_age_s"] = to_int(extract(packet, "LKAGE"), c["last_known_age_s"])
    c["last_known_lat"] = to_float(extract(packet, "LKLAT"), c["last_known_lat"])
    c["last_known_lon"] = to_float(extract(packet, "LKLON"), c["last_known_lon"])

    normalize_gps_state(c)

    old_lat, old_lon = c["lat"], c["lon"]
    new_lat = to_float(extract(packet, "LAT"), c["lat"])
    new_lon = to_float(extract(packet, "LON"), c["lon"])
    new_alt = to_float(extract(packet, "ALT"), c["alt"])

    if new_lat != 0 and new_lon != 0:
        c["lat"], c["lon"], c["alt"] = new_lat, new_lon, new_alt

    c["bpm"] = to_int(extract(packet, "BPM"), c["bpm"])
    
    bat = to_int_or_none(extract(packet, "BAT"), c["battery"])
    if bat is not None: c["battery"] = bat
        
    abat = to_int_or_none(extract(packet, "ABAT"), c["armband_battery"])
    if abat is not None: c["armband_battery"] = abat
        
    c["sos"] = to_int(extract(packet, "SOS"), c["sos"])
    c["ble"] = to_int(extract(packet, "BLE"), c["ble"])
    c["sen"] = to_int(extract(packet, "SEN"), c["sen"])

    bseq = extract(packet, "BSEQ")
    if bseq: c["base_seq_seen"] = to_int(bseq, c["base_seq_seen"])

    hop_raw = extract(packet, "HOP")
    if hop_raw != "":
        c["hop_count"] = to_int(hop_raw, c.get("hop_count", 0))
        c["via_repeater"] = 1 if c["hop_count"] > 0 else 0

    update_distance(c)

    if old_lat != c["lat"] or old_lon != c["lon"]:
        add_path_point(c)

    if "TYPE:SOS_CLEAR" in packet:
        if not is_duplicate_packet(packet):
            c["sos"] = 0
            c["last_message"] = "SOS cleared by climber"
            add_event("INFO", cid, "SOS cleared", "Cleared by climber")
            add_chat(cid, c["last_message"])
    elif "TYPE:SOS" in packet:
        if not is_duplicate_packet(packet):
            c["sos"] = 1
            c["last_message"] = "SOS EMERGENCY"
            add_event("CRITICAL", cid, "SOS EMERGENCY", "SOS received from climber")
            add_chat(cid, "SOS EMERGENCY")
    elif "TYPE:MSG" in packet:
        if not is_duplicate_packet(packet):
            msg = packet_text(packet)
            if msg:
                c["last_message"] = msg
                add_chat(cid, msg)
    else:
        if c["gps_fix"] == 1: c["last_message"] = "Live GPS updated"
        elif c["has_last_known"] == 1: c["last_message"] = "No GPS fix - showing last known"
        else: c["last_message"] = "No GPS found"
        
    save_climber(c)

# ===================== SERIAL =====================
def open_browser_later():
    time.sleep(2)
    try:
        webbrowser.open(DASHBOARD_URL)
    except Exception as e:
        print("Could not open browser automatically:", e)

def connect_serial_loop():
    global ser, serial_status, SERIAL_PORT

    while True:
        try:
            if ser is not None and ser.is_open:
                time.sleep(0.2)
                continue

            if SERIAL_PORT:
                ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.15)
                time.sleep(0.5)
                serial_status = f"Connected on {SERIAL_PORT}"
                print(serial_status)
            else:
                serial_status = "No serial port selected"
                time.sleep(1)

        except Exception as e:
            serial_status = f"Serial failed: {e}"
            print(serial_status)
            time.sleep(0.5)

def send_serial_line(line):
    global ser
    if ser is None or not ser.is_open: return False
    try:
        with serial_lock:
            ser.write((line + "\n").encode("utf-8"))
            ser.flush()
        return True
    except Exception as e:
        print("Serial write failed:", e)
        try:
            if ser: ser.close()
        except: pass
        ser = None
        return False

def queue_or_send(line, display="", target="ALL"):
    ok = send_serial_line(line)
    if not ok:
        pending_commands.append({"line": line, "display": display, "target": target})
    return ok

def retry_pending_loop():
    while True:
        try:
            if pending_commands:
                item = pending_commands[0]
                if send_serial_line(item["line"]):
                    pending_commands.pop(0)
            time.sleep(0.5)
        except:
            time.sleep(0.5)

def serial_reader_loop():
    global ser, serial_status
    while True:
        try:
            if ser is None or not ser.is_open:
                time.sleep(0.2)
                continue
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line or not line.startswith("{"): continue
            
            try: data = json.loads(line)
            except: continue

            t = data.get("type", "")
            if t in ["system", "error"]:
                serial_status = data.get("message", serial_status)
            elif t == "lora_rx":
                packet = data.get("packet", "")
                cid = data.get("id") or extract(packet, "ID") or extract(packet, "FROM") or "CLIMBER01"
                update_climber_from_packet(cid, packet, data.get("rssi", 0), data.get("snr", 0.0))
            elif t == "lora_tx":
                target = data.get("to", "CLIMBER01")
                packet = data.get("packet", "")
                if "TYPE:BASE" in packet:
                    add_chat("BASE CAMP", "Base GPS sent to climber nodes")
                elif find_climber(target) is None:
                    pass  # unknown target - do not create a phantom climber
                elif "TYPE:SOS_CLEAR" in packet:
                    c = get_climber(target)
                    c["sos"] = 0
                    save_climber(c)
                    add_chat("BASE CAMP", "SOS clear sent")
                else:
                    msg = packet_text(packet)
                    c = get_climber(target)
                    c["last_reply"] = msg
                    save_climber(c)
                    add_chat("BASE CAMP", msg)
        except Exception as e:
            print("Serial reader error:", e)
            try:
                if ser: ser.close()
            except: pass
            ser = None
            time.sleep(0.2)

def send_base_location_to_lora():
    return queue_or_send(f"BASE|{base_lat:.6f}|{base_lon:.6f}", "base GPS update", "ALL")

def build_alerts(arr):
    alerts = []
    for c in arr:
        cid = c.get("id", "UNKNOWN")
        display_name = c.get("display_name") or cid
        online = c.get("online", False)
        
        if c.get("sos", 0) == 1:
            alerts.append({"level": "CRITICAL", "id": cid, "text": f"{display_name} - SOS active", "details": f"Requested emergency help"})
        if not online:
            alerts.append({"level": "WARNING", "id": cid, "text": f"{display_name} - Offline", "details": f"No packet for {c.get('seconds_since', 0)}s"})
        
        if c.get("gps_fix", 0) != 1:
            if c.get("has_last_known", 0) == 1:
                alerts.append({"level": "WARNING", "id": cid, "text": f"{display_name} - GPS lost", "details": f"Last known age {c.get('last_known_age_s', 0)}s"})
            else:
                alerts.append({"level": "CRITICAL", "id": cid, "text": f"{display_name} - No GPS", "details": "No current or previous valid location"})

        bat = c.get("battery")
        if bat is not None and bat > 0 and bat < 20:
            alerts.append({"level": "WARNING", "id": cid, "text": f"{display_name} - Main battery low", "details": f"{bat}%"})

        abat = c.get("armband_battery")
        ble = c.get("ble", 0)
        if ble == 1 and abat is not None and abat > 0 and abat < 20:
            alerts.append({"level": "WARNING", "id": cid, "text": f"{display_name} - Armband battery low", "details": f"{abat}%"})
            
    return alerts

# ===================== ROUTES =====================
@app.route("/")
def index():
    return render_template_string(HTML)

@app.route("/api/ports")
def api_ports():
    ports = [p.device for p in serial.tools.list_ports.comports()]
    return jsonify({"ports": ports, "current": SERIAL_PORT})

@app.route("/api/connect", methods=["POST"])
def api_connect():
    global SERIAL_PORT, ser
    data = request.get_json(silent=True) or {}
    port = data.get("port")
    if port:
        SERIAL_PORT = port
        try:
            if ser: ser.close()
        except: pass
        ser = None
        return jsonify({"status": "ok"})
    return jsonify({"error": "invalid port"}), 400

@app.route("/api/status")
def api_status():
    now = int(time.time())
    arr = []
    
    climbers = get_all_climbers()
    for c in climbers:
        c = get_climber(c["id"])  # fetch with path
        update_distance(c)
        sec = now - c["last_seen"] if c["last_seen"] else 0
        online = c["last_seen"] > 0 and sec < ONLINE_TIMEOUT_S
        arr.append({**c, "online": online, "seconds_since": sec})

    if not arr:
        c = get_climber("CLIMBER01")
        update_distance(c)
        arr.append({**c, "online": False, "seconds_since": 0})

    alerts = build_alerts(arr)

    return jsonify({
        "serial_status": serial_status,
        "basecamp": {
            "name": BASE_NAME, "lat": base_lat, "lon": base_lon, "alt": base_alt,
            "source": base_source, "updated_at": base_updated_at, "seq": base_location_seq,
        },
        "map_min_radius_m": MAP_MIN_RADIUS_M,
        "path_min_move_m": PATH_MIN_MOVE_M,
        "online_timeout_s": ONLINE_TIMEOUT_S,
        "total_count": len(arr),
        "active_count": len([x for x in arr if x["online"]]),
        "sos_count": len([x for x in arr if x["sos"] == 1]),
        "alert_count": len(alerts),
        "pending_reply_count": len(pending_commands),
        "climbers": arr,
        "alerts": alerts,
        "messages": get_messages(),
        "event_log": get_events(),
    })

@app.route("/api/export-log")
def api_export_log():
    lines = ["time,level,source,event,details"]
    for row in get_events(limit=1000):
        vals = [
            str(row.get("time", "")).replace('"', '""'),
            str(row.get("level", "")).replace('"', '""'),
            str(row.get("source", "")).replace('"', '""'),
            str(row.get("event", "")).replace('"', '""'),
            str(row.get("details", "")).replace('"', '""'),
        ]
        lines.append(",".join([f'"{v}"' for v in vals]))
    
    return Response("\\n".join(lines) + "\\n", mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=basecamp_session_log.csv"})

@app.route("/api/clear-log", methods=["POST"])
def api_clear_log():
    clear_events()
    add_event("INFO", "BASE CAMP", "Session log cleared", "")
    return jsonify({"status": "cleared"})

@app.route("/api/base-location", methods=["POST"])
def api_base_location():
    global base_lat, base_lon, base_alt, base_source, base_updated_at, base_location_seq
    data = request.get_json(silent=True) or {}
    lat, lon, alt = to_float(data.get("lat"), 0.0), to_float(data.get("lon"), 0.0), to_float(data.get("alt"), 0.0)
    
    if lat == 0 or lon == 0: return jsonify({"error": "invalid_location"}), 400
    
    base_lat, base_lon, base_alt = lat, lon, alt
    base_source = str(data.get("source", "MANUAL"))
    base_updated_at = int(time.time())
    base_location_seq += 1

    ok = send_base_location_to_lora()
    add_event("INFO", "BASE CAMP", "Base GPS updated", f"{base_lat:.6f}, {base_lon:.6f}")
    add_chat("BASE CAMP", f"Base GPS set to {base_lat:.6f}, {base_lon:.6f}")
    
    return jsonify({"status": "sent" if ok else "queued"})

@app.route("/api/send-base", methods=["POST"])
def api_send_base():
    ok = send_base_location_to_lora()
    return jsonify({"status": "sent" if ok else "queued"})

@app.route("/api/send", methods=["POST"])
def api_send():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "CLIMBER01").strip()
    msg = data.get("message", "").strip()[:120].replace(",", " ")
    
    if not msg: return jsonify({"error": "empty"}), 400
    if find_climber(target) is None: return jsonify({"error": "unknown_climber"}), 404
    
    ok = queue_or_send(f"MSG|{target}|{msg}", msg, target)
    if ok:
        c = get_climber(target)
        c["last_reply"] = msg
        save_climber(c)
        add_event("MESSAGE", "BASE CAMP", f"Message sent to {target}", msg)
        return jsonify({"status": "sent"})
    return jsonify({"status": "queued"})

@app.route("/api/clear-sos", methods=["POST"])
def api_clear_sos():
    data = request.get_json(silent=True) or {}
    target = data.get("target", "CLIMBER01").strip()

    if find_climber(target) is None: return jsonify({"error": "unknown_climber"}), 404
    
    c = get_climber(target)
    c["sos"] = 0
    save_climber(c)
    
    add_event("INFO", "BASE CAMP", f"SOS clear sent to {target}", "")
    ok = queue_or_send(f"CLEAR|{target}", "SOS cleared", target)
    return jsonify({"status": "sent" if ok else "queued"})

@app.route("/api/rename", methods=["POST"])
def api_rename():
    data = request.get_json(silent=True) or {}
    cid = data.get("id", "").strip()
    name = data.get("name", "").strip()
    
    if not cid or not name: 
        return jsonify({"error": "invalid"}), 400

    if find_climber(cid) is None:
        return jsonify({"error": "unknown_climber"}), 404
        
    c = get_climber(cid)
    c["display_name"] = name
    save_climber(c)
    
    add_event("INFO", "BASE CAMP", f"Renamed {cid} to {name}", "")
    return jsonify({"status": "ok", "display_name": name})

@app.route("/api/delete-climber", methods=["POST"])
def api_delete_climber():
    data = request.get_json(silent=True) or {}
    cid = data.get("id", "").strip()

    if not cid:
        return jsonify({"error": "invalid"}), 400

    if find_climber(cid) is None:
        return jsonify({"error": "unknown_climber"}), 404

    delete_climber(cid)
    add_event("INFO", "BASE CAMP", f"Removed climber {cid}", "")
    return jsonify({"status": "ok"})

# ===================== HTML UI =====================
HTML = """
<!DOCTYPE html>
<html>
<head>
<title>Base Camp Monitor</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Leaflet CSS & JS for Maps -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<style>
/* DARK THEME STYLES */
body { margin: 0; font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; }
header { background: #020617; color: white; padding: 20px; border-bottom: 1px solid #334155; }
.wrap { max-width: 1250px; margin: auto; padding: 18px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.card, .panel { background: #1e293b; border-radius: 18px; padding: 16px; box-shadow: 0 4px 6px #0008; border: 1px solid #334155; }
.value { font-size: 28px; font-weight: bold; color: #f1f5f9; }
.layout { display: grid; grid-template-columns: 390px 1fr; gap: 16px; margin-top: 16px; }
@media(max-width: 900px) { .layout { grid-template-columns: 1fr; } }
.climber { padding: 12px; border-left: 8px solid #475569; background: #0f172a; border-radius: 14px; margin-bottom: 10px; cursor: pointer; transition: 0.2s; }
.climber:hover { background: #162032; }
.safe { border-left-color: #16a34a; }
.danger { border-left-color: #ef4444; }
.warn { border-left-color: #f97316; }
.nogps { border-left-color: #ef4444; }
.lastknown { border-left-color: #f97316; }
.offline { opacity: 0.72; }
.selected { outline: 2px solid #3b82f6; background: #1e3a8a; }
.row { display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding: 6px 0; gap: 10px; }

/* LEAFLET MAP STYLES */
#map { width: 100%; height: 500px; background: #0f172a; border-radius: 16px; border: 1px solid #334155; z-index: 1; }
.leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); } /* Dark mode map filter */
.leaflet-tooltip { background-color: #1e293b; color: #f8fafc; border: 1px solid #334155; box-shadow: 0 4px 6px #0008; border-radius: 8px;}
.leaflet-tooltip-left::before { border-left-color: #334155; }
.leaflet-tooltip-right::before { border-right-color: #334155; }

.packet { background: #020617; color: #e2e8f0; border-radius: 12px; padding: 12px; white-space: pre-wrap; word-break: break-word; font-family: Consolas, monospace; min-height: 100px; border: 1px solid #334155;}
.chat { height: 230px; overflow-y: auto; background: #0f172a; border-radius: 12px; padding: 10px; border: 1px solid #334155; }
.msg { padding: 10px; border-radius: 12px; margin: 8px 0; }
.msg.base { background: #1e3a8a; color: #e0e7ff; }
.msg.climber { background: #065f46; color: #d1fae5; }
input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: white; margin-top: 10px; box-sizing: border-box; }
input::placeholder { color: #94a3b8; }
button { padding: 12px 16px; border: 0; border-radius: 10px; background: #2563eb; color: white; font-weight: bold; margin-top: 8px; cursor: pointer; transition: 0.2s;}
button:hover { background: #1d4ed8; }
button.danger { background: #dc2626; }
button.danger:hover { background: #b91c1c; }
button.green { background: #16a34a; }
button.green:hover { background: #15803d; }
button.small { padding: 6px 12px; margin: 0 0 0 10px; font-size: 13px; background: #475569; }
button.small:hover { background: #334155; }
.note { color: #94a3b8; font-size: 13px; line-height: 1.4; }
.badge { display: inline-block; color: white; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: bold; }
.badge.ok { background: #16a34a; }
.badge.warn { background: #f97316; }
.badge.bad { background: #ef4444; }
.badge.gray { background: #475569; }
.alertbox { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
.alertitem { border-radius: 12px; padding: 12px; font-weight: bold; }
.alertitem.CRITICAL { background: #7f1d1d; color: #fecaca; border-left: 6px solid #ef4444; }
.alertitem.WARNING { background: #7c2d12; color: #fed7aa; border-left: 6px solid #f97316; }
.alertitem.INFO { background: #1e3a8a; color: #bfdbfe; border-left: 6px solid #3b82f6; }
.logbox { max-height: 260px; overflow-y: auto; background: #0f172a; border-radius: 12px; padding: 10px; margin-top: 10px; border: 1px solid #334155;}
.logrow { display: grid; grid-template-columns: 80px 90px 140px 1fr; gap: 8px; padding: 7px; border-bottom: 1px solid #334155; font-size: 13px; color: #cbd5e1;}
@media(max-width: 700px) { .logrow { grid-template-columns: 1fr; } }
</style>
</head>

<body>
<header>
    <h1>Mountain Climber Base Camp Monitor</h1>
    <div id="serial" style="color: #94a3b8;">Checking...</div>
</header>

<div class="wrap">
    <div class="grid">
        <div class="card"><div>Total</div><div class="value" id="total">0</div></div>
        <div class="card"><div>Active</div><div class="value" id="active">0</div></div>
        <div class="card"><div>SOS</div><div class="value" id="sos">0</div></div>
        <div class="card"><div>Alerts</div><div class="value" id="alertsCount">0</div></div>
        <div class="card"><div>Pending Replies</div><div class="value" id="pending">0</div></div>
    </div>

    <div class="panel" style="margin-top:16px;">
        <h2>Active Alerts</h2>
        <div id="alertsBox" class="alertbox">No active alerts</div>
    </div>

    <div class="layout">
        <div class="panel">
            <h2>Basecamp GPS Setup</h2>
            <p class="note">Default: 7.253061, 80.592154. Enter exact basecamp GPS and send it to the climber by LoRa.</p>
            <div class="row"><span>Source</span><b id="baseSource">DEFAULT</b></div>
            <div class="row"><span>Latitude</span><b id="baseLatText">0</b></div>
            <div class="row"><span>Longitude</span><b id="baseLonText">0</b></div>

            <input id="manualBaseLat" type="number" step="0.000001" placeholder="Latitude e.g. 7.253061">
            <input id="manualBaseLon" type="number" step="0.000001" placeholder="Longitude e.g. 80.592154">

            <button class="green" onclick="setManualBase()">Set Basecamp GPS + Send to Climber</button>
            <button onclick="sendBaseToClimber()">Send Current Base GPS Again</button>
            <p class="note" id="baseInfo"></p>

            <h2>Climbers</h2>
            <div id="list"></div>
        </div>

        <div class="panel">
            <h2>Live GPS Map</h2>
            <div id="map"></div>
            <p class="note" style="margin-top: 10px;" id="mapStatusText">Waiting for valid GPS coordinates...</p>
            
            <div style="background: #0f172a; padding: 12px; border-radius: 12px; margin-top: 10px; border: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="color: #94a3b8;">Selected Climber:</span><br>
                    <b id="selectedText" style="font-size: 18px; color: #f8fafc;">CLIMBER01</b>
                </div>
                <button class="small" onclick="renameClimber()">Rename Climber</button>
                <button class="small danger" onclick="removeClimber()">Remove</button>
            </div>
        </div>
    </div>

    <div class="layout">
        <div class="panel">
            <h2>Latest Packet</h2>
            <div id="packetHuman"></div>
            <div class="packet" id="packet" style="margin-top:10px; font-size:12px; color:#94a3b8;">No packet</div>
        </div>

        <div class="panel">
            <h2>Conversation</h2>
            <div class="chat" id="chat"></div>
            <input id="msg" placeholder="Reply to selected climber..." maxlength="120">
            <button onclick="sendMsg()">Send Message</button>
            <button class="danger" onclick="clearSos()">Clear SOS</button>
        </div>
    </div>

    <div class="panel" style="margin-top:16px;">
        <h2>Session Log</h2>
        <p class="note">Operational log for SOS, messages, GPS setup, and basecamp actions.</p>
        <button onclick="window.location.href='/api/export-log'">Export Session CSV</button>
        <button class="danger" onclick="clearLog()">Clear Log</button>
        <div class="logbox" id="sessionLog">No log entries</div>
    </div>
</div>

<script>
let selected = "CLIMBER01";
let climbers = [];
let basecamp = { name: "BASE CAMP", lat: 0, lon: 0, alt: 0, source: "DEFAULT", seq: 0 };

// Leaflet Map Variables
let map;
let baseMarker;
let climberMarkers = {};
let climberPaths = {};
let isMapInitialized = false;

function initMap() {
    let lat = basecamp.lat || 7.253061;
    let lon = basecamp.lon || 80.592154;
    
    map = L.map('map').setView([lat, lon], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    let baseIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div style='background-color:#3b82f6; width:30px; height:30px; border-radius:50%; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white;'>B</div>",
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    baseMarker = L.marker([lat, lon], {icon: baseIcon}).addTo(map);
    baseMarker.bindTooltip("<b>BASE CAMP</b>", {permanent: true, direction: 'right'});
    
    isMapInitialized = true;
}

function updateMap() {
    if (!isMapInitialized) initMap();

    if (baseMarker && basecamp.lat && basecamp.lon) {
        baseMarker.setLatLng([basecamp.lat, basecamp.lon]);
    }

    const valid = climbers.filter(c => mapLat(c) !== 0 && mapLon(c) !== 0);

    if (valid.length === 0) {
        document.getElementById("mapStatusText").innerHTML = "<span style='color:#ef4444; font-weight:bold;'>NO GPS FOUND - waiting for first climber location</span>";
    } else {
        document.getElementById("mapStatusText").innerHTML = "<b>B</b> = Basecamp, <b>C</b> = Climber. (Green = Current, Orange = Last Known, Blue = Path)";
    }

    valid.forEach(c => {
        let lat = mapLat(c);
        let lon = mapLon(c);
        let isSos = c.sos === 1;
        let isCurrent = c.gps_fix === 1;
        
        let color = isSos ? "#ef4444" : (isCurrent ? "#16a34a" : "#f97316");
        let displayName = c.display_name || c.id;

        let icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:${color}; width:28px; height:28px; border-radius:50%; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; border: 2px solid white;'>C</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        let pathText = (c.hop_count > 0) ? ("Via repeater x" + c.hop_count) : "Direct";
        let tooltipText = `<b>${displayName}</b><br>${formatDistance(c.distance_m)} ${c.direction}<br><span style="font-size:11px; color:${color};">${isCurrent ? c.gps : "Last known"}</span><br><span style="font-size:11px; color:#94a3b8;">${pathText}</span>`;

        if (!climberMarkers[c.id]) {
            climberMarkers[c.id] = L.marker([lat, lon], {icon: icon}).addTo(map);
            climberMarkers[c.id].bindTooltip(tooltipText, {permanent: true, direction: 'right'});
        } else {
            climberMarkers[c.id].setLatLng([lat, lon]);
            climberMarkers[c.id].setIcon(icon);
            climberMarkers[c.id].setTooltipContent(tooltipText);
        }

        if (c.path && c.path.length > 1) {
            let latlngs = c.path.map(pt => [pt.lat, pt.lon]);
            if (!climberPaths[c.id]) {
                climberPaths[c.id] = L.polyline(latlngs, {color: '#3b82f6', weight: 3}).addTo(map);
            } else {
                climberPaths[c.id].setLatLngs(latlngs);
            }
        }
    });
}

function gpsBadge(c) {
    if (c.gps_fix === 1) return '<span class="badge ok">' + c.gps + '</span>';
    if (c.has_last_known === 1) return '<span class="badge warn">NO GPS - LAST KNOWN</span>';
    return '<span class="badge bad">NO GPS FOUND</span>';
}

function onlineBadge(c) {
    if (c.online) return '<span class="badge ok">ONLINE</span>';
    return '<span class="badge gray">OFFLINE</span>';
}

function pathBadge(c) {
    const hops = c.hop_count || 0;
    if (hops > 0) {
        return '<span class="badge warn">VIA REPEATER (' + hops + (hops == 1 ? ' hop' : ' hops') + ')</span>';
    }
    return '<span class="badge ok">DIRECT</span>';
}

function cls(c) {
    let s = "";
    if (!c.online) s += " offline";
    if (c.sos == 1) return s + " danger";
    if (c.gps_fix !== 1 && c.has_last_known === 1) return s + " lastknown";
    if (c.gps_fix !== 1) return s + " nogps";
    if (c.battery !== null && c.battery !== undefined && c.battery < 20) return s + " warn";
    return s + " safe";
}

function esc(t) {
    let d = document.createElement("div");
    d.innerText = t;
    return d.innerHTML;
}

function formatDistance(m) {
    if (!m || m <= 0) return "0 m";
    if (m < 1000) return m.toFixed(1) + " m";
    return (m / 1000).toFixed(2) + " km";
}

function mapLat(c) {
    return c.gps_fix === 1 ? c.lat : (c.has_last_known === 1 ? c.last_known_lat : 0);
}

function mapLon(c) {
    return c.gps_fix === 1 ? c.lon : (c.has_last_known === 1 ? c.last_known_lon : 0);
}

function selectClimber(id) {
    selected = id;
    drawSelected();
    drawList();
    
    // Pan map to climber if they have a valid location
    let c = climbers.find(x => x.id == id);
    if (c && mapLat(c) !== 0 && isMapInitialized) {
        map.panTo([mapLat(c), mapLon(c)]);
    }
}

function pExtract(packet, key) {
    const re = new RegExp("(?:^|,)" + key + ":([^,]*)");
    const m = String(packet || "").match(re);
    return m ? m[1] : "";
}

function humanizePacket(raw) {
    if (!raw || raw === "No packet yet" || raw === "No packet") {
        return '<div class="note">No packet received yet.</div>';
    }

    const type = pExtract(raw, "TYPE") || "UNKNOWN";
    const hop = parseInt(pExtract(raw, "HOP") || "0") || 0;
    const pathHtml = hop > 0
        ? '<span class="badge warn">VIA REPEATER (' + hop + (hop === 1 ? ' hop' : ' hops') + ')</span>'
        : '<span class="badge ok">DIRECT</span>';

    const typeLabels = {
        "DATA": "Telemetry Update",
        "SOS": "SOS Emergency",
        "SOS_CLEAR": "SOS Cleared",
        "MSG": "Text Message"
    };
    const typeLabel = typeLabels[type] || type;
    const typeBadgeClass = (type === "SOS") ? "bad" : (type === "SOS_CLEAR" ? "ok" : "gray");

    let rows = `
        <div class="row"><span>Packet Type</span><b><span class="badge ${typeBadgeClass}">${esc(typeLabel)}</span></b></div>
        <div class="row"><span>Path</span><b>${pathHtml}</b></div>
        <div class="row"><span>From Device</span><b>${esc(pExtract(raw, "ID") || pExtract(raw, "FROM") || "-")}</b></div>
        <div class="row"><span>Message ID</span><b>${esc(pExtract(raw, "MID") || "-")}</b></div>`;

    if (type === "DATA") {
        const lat = pExtract(raw, "LAT"), lon = pExtract(raw, "LON");
        const gps = pExtract(raw, "GPS") || "-";
        const fix = pExtract(raw, "FIX") === "1" ? "Fix" : "No fix";
        const sat = pExtract(raw, "SAT") || "0";
        const hdop = pExtract(raw, "HDOP") || "-";
        const bpm = pExtract(raw, "BPM") || "0";
        const bat = pExtract(raw, "BAT");
        const abat = pExtract(raw, "ABAT");
        const sos = pExtract(raw, "SOS") === "1";
        const ble = pExtract(raw, "BLE") === "1";
        const sen = pExtract(raw, "SEN") === "1";

        rows += `
        <div class="row"><span>Location</span><b>${esc(lat)}, ${esc(lon)}</b></div>
        <div class="row"><span>GPS Source</span><b>${esc(gps)} (${fix}, ${esc(sat)} sats, HDOP ${esc(hdop)})</b></div>
        <div class="row"><span>Heart Rate</span><b>${esc(bpm)} bpm</b></div>
        <div class="row"><span>Main Battery</span><b>${bat !== "" ? esc(bat) + "%" : "-"}</b></div>
        <div class="row"><span>Armband Battery</span><b>${abat !== "" ? esc(abat) + "%" : "-"}</b></div>
        <div class="row"><span>SOS</span><b>${sos ? '<span class="badge bad">ACTIVE</span>' : '<span class="badge ok">Clear</span>'}</b></div>
        <div class="row"><span>Armband Link</span><b>${ble ? "Connected" : "Disconnected"}</b></div>
        <div class="row"><span>Heart Sensor</span><b>${sen ? "OK" : "Missing"}</b></div>`;
    } else {
        const text = pExtract(raw, "TEXT");
        const sos = pExtract(raw, "SOS") === "1";
        if (text) rows += `<div class="row"><span>Message</span><b>${esc(text)}</b></div>`;
        rows += `<div class="row"><span>SOS Flag</span><b>${sos ? '<span class="badge bad">ACTIVE</span>' : '<span class="badge ok">Clear</span>'}</b></div>`;
    }

    return rows;
}

function drawSelected() {
    let c = climbers.find(x => x.id == selected) || climbers[0];
    if (!c) return;
    selected = c.id;
    document.getElementById("selectedText").innerText = c.display_name || c.id;
    document.getElementById("packetHuman").innerHTML = humanizePacket(c.last_packet);
    document.getElementById("packet").innerText = "Raw: " + c.last_packet;
}

async function renameClimber() {
    let c = climbers.find(x => x.id == selected);
    if (!c) return;
    
    let currentName = c.display_name || c.id;
    let newName = prompt(`Enter a new display name for the device [${c.id}]:`, currentName);
    
    if (newName !== null && newName.trim() !== "") {
        const r = await fetch("/api/rename", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({id: selected, name: newName.trim()})
        });
        const res = await r.json();
        if (res.error) { alert("Rename failed: " + res.error); return; }
        update();
    }
}

async function removeClimber() {
    let c = climbers.find(x => x.id == selected);
    if (!c) return;

    if (!confirm(`Remove "${c.display_name || c.id}" (${c.id}) from the dashboard?\n\nThis clears its stored data and path history. If the device is still transmitting, it will reappear on its next packet.`)) return;

    const r = await fetch("/api/delete-climber", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id: c.id})
    });
    const res = await r.json();
    if (res.error) { alert("Remove failed: " + res.error); return; }
    selected = "CLIMBER01";
    update();
}

function drawList() {
    const list = document.getElementById("list");
    list.innerHTML = "";

    climbers.forEach(c => {
        const div = document.createElement("div");
        div.className = "climber " + cls(c) + (c.id == selected ? " selected" : "");
        div.onclick = () => selectClimber(c.id);

        const displayLat = mapLat(c);
        const displayLon = mapLon(c);
        
        let displayName = c.display_name || c.id;

        div.innerHTML = `
            <h3>${displayName} ${onlineBadge(c)}</h3>
            <div class="row"><span>Hardware ID</span><b style="color:#94a3b8;">${c.id}</b></div>
            <div class="row"><span>GPS Status</span><b>${gpsBadge(c)}</b></div>
            <div class="row"><span>GPS Age</span><b>${c.gps_age_s}s</b></div>
            <div class="row"><span>Satellites</span><b>${c.gps_satellites}</b></div>
            <div class="row"><span>HDOP</span><b>${Number(c.gps_hdop).toFixed(1)}</b></div>
            <div class="row"><span>GPS Filter</span><b>${esc(c.gps_reject || "")}</b></div>
            <div class="row"><span>Distance</span><b>${formatDistance(c.distance_m)}</b></div>
            <div class="row"><span>From Base</span><b>${c.direction} (${c.bearing_deg.toFixed(0)}°)</b></div>
            <div class="row"><span>Display Lat</span><b>${displayLat.toFixed(6)}</b></div>
            <div class="row"><span>Display Lon</span><b>${displayLon.toFixed(6)}</b></div>
            <div class="row"><span>Last Known Age</span><b>${c.last_known_age_s}s</b></div>
            <div class="row"><span>Main Battery</span><b>${c.battery}%</b></div>
            <div class="row"><span>Armband Battery</span><b>${c.armband_battery}%</b></div>
            <div class="row"><span>BPM</span><b>${c.bpm}</b></div>
            <div class="row"><span>Armband</span><b>${c.ble ? "OK" : "Disconnected"}</b></div>
            <div class="row"><span>Heart Sensor</span><b>${c.sen ? "OK" : "Missing"}</b></div>
            <div class="row"><span>Path</span><b>${pathBadge(c)}</b></div>
            <div class="row"><span>RSSI</span><b>${c.rssi}</b></div>
            <div class="row"><span>SNR</span><b>${c.snr}</b></div>
            <div class="row"><span>Last Packet</span><b>${c.seconds_since}s ago</b></div>
            <div class="row"><span>Message</span><b>${esc(c.last_message)}</b></div>
        `;

        list.appendChild(div);
    });
}

function drawAlerts(alerts) {
    const box = document.getElementById("alertsBox");
    box.innerHTML = "";

    if (!alerts || alerts.length === 0) {
        box.innerHTML = '<div class="note">No active alerts</div>';
        return;
    }

    alerts.forEach(a => {
        const div = document.createElement("div");
        div.className = "alertitem " + (a.level || "INFO");
        div.innerHTML = `<div>${esc(a.id || "SYSTEM")} • ${esc(a.text || "")}</div>
                         <div style="font-weight:normal;font-size:13px;margin-top:4px;">${esc(a.details || "")}</div>`;
        box.appendChild(div);
    });
}

function drawSessionLog(log) {
    const box = document.getElementById("sessionLog");
    box.innerHTML = "";

    if (!log || log.length === 0) {
        box.innerHTML = '<div class="note">No log entries</div>';
        return;
    }

    log.slice().reverse().forEach(e => {
        const div = document.createElement("div");
        div.className = "logrow";
        div.innerHTML = `<b>${esc(e.time || "")}</b>
                         <span style="color: #94a3b8;">${esc(e.level || "")}</span>
                         <span style="color: #94a3b8;">${esc(e.source || "")}</span>
                         <span>${esc(e.event || "")} ${e.details ? " - " + esc(e.details) : ""}</span>`;
        box.appendChild(div);
    });
}

async function update() {
    try {
        const r = await fetch("/api/status", {cache: "no-store"});
        const d = await r.json();

        climbers = d.climbers;
        basecamp = d.basecamp;

        document.getElementById("serial").innerText = d.serial_status;
        document.getElementById("total").innerText = d.total_count;
        document.getElementById("active").innerText = d.active_count;
        document.getElementById("sos").innerText = d.sos_count;
        document.getElementById("alertsCount").innerText = d.alert_count || 0;
        document.getElementById("pending").innerText = d.pending_reply_count;

        document.getElementById("baseSource").innerText = basecamp.source || "DEFAULT";
        document.getElementById("baseLatText").innerText = basecamp.lat.toFixed(6);
        document.getElementById("baseLonText").innerText = basecamp.lon.toFixed(6);

        if (!document.getElementById("manualBaseLat").value) {
            document.getElementById("manualBaseLat").value = basecamp.lat.toFixed(6);
        }

        if (!document.getElementById("manualBaseLon").value) {
            document.getElementById("manualBaseLon").value = basecamp.lon.toFixed(6);
        }

        document.getElementById("baseInfo").innerText =
            "Basecamp GPS: " + basecamp.lat.toFixed(6) + ", " + basecamp.lon.toFixed(6) +
            " | Source: " + (basecamp.source || "DEFAULT") +
            " | Seq: " + (basecamp.seq || 0);

        drawList();
        updateMap();
        drawSelected();
        drawAlerts(d.alerts || []);
        drawSessionLog(d.event_log || []);

        const chat = document.getElementById("chat");
        chat.innerHTML = "";

        d.messages.forEach(m => {
            const div = document.createElement("div");
            div.className = "msg " + (m.sender == "BASE CAMP" ? "base" : "climber");
            div.innerHTML = `<b>${m.sender} • ${m.time}</b><br>${esc(m.text)}`;
            chat.appendChild(div);
        });

        chat.scrollTop = chat.scrollHeight;

    } catch (e) {
        document.getElementById("serial").innerText = "Dashboard refresh error";
    }
}

async function setManualBase() {
    const lat = parseFloat(document.getElementById("manualBaseLat").value);
    const lon = parseFloat(document.getElementById("manualBaseLon").value);

    if (!lat || !lon) {
        alert("Enter valid latitude and longitude.");
        return;
    }

    await fetch("/api/base-location", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({lat: lat, lon: lon, alt: 0, source: "MANUAL"})
    });

    update();
}

async function sendBaseToClimber() {
    await fetch("/api/send-base", {method: "POST"});
    update();
}

async function sendMsg() {
    const input = document.getElementById("msg");
    const msg = input.value.trim();

    if (!msg) return;

    const r = await fetch("/api/send", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({target: selected, message: msg})
    });
    const res = await r.json();
    if (res.error) { alert("Send failed: " + res.error); return; }

    input.value = "";
    update();
}

async function clearSos() {
    const r = await fetch("/api/clear-sos", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({target: selected})
    });
    const res = await r.json();
    if (res.error) { alert("Clear SOS failed: " + res.error); return; }

    update();
}

async function clearLog() {
    await fetch("/api/clear-log", {method: "POST"});
    update();
}

window.addEventListener("resize", function() {
    if (isMapInitialized) map.invalidateSize();
});

setInterval(update, 750);
update();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    print("=" * 60)
    print(APP_NAME)
    print("Version:", APP_VERSION)
    print("Dashboard:", DASHBOARD_URL)
    print("Serial:", "Auto detect" if SERIAL_PORT == "AUTO" else SERIAL_PORT)
    print("Basecamp GPS:", base_lat, base_lon)
    print("Important: Close Arduino Serial Monitor before running this.")
    print("=" * 60)

    threading.Thread(target=connect_serial_loop, daemon=True).start()
    threading.Thread(target=serial_reader_loop, daemon=True).start()
    threading.Thread(target=retry_pending_loop, daemon=True).start()
    threading.Thread(target=open_browser_later, daemon=True).start()

    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True, use_reloader=False)