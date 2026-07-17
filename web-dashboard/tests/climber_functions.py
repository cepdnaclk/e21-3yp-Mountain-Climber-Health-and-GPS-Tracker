"""
climber_functions.py

Hardware-free reference implementations of four critical functions used in
the Mountain Climber IoT Safety Tracking System (Group 23).

Each function below mirrors the real logic that already exists in the
project source files:

  1. haversine_m          <- app_15_.py   (Basecamp Dashboard, Python/Flask)
  2. is_duplicate_packet  <- app_15_.py   (Basecamp Dashboard, Python/Flask)
  3. build_alerts         <- app_15_.py   (Basecamp Dashboard, Python/Flask)
  4. accept_point         <- c3.ino       (Climber Main Node, ESP32 firmware,
                                            original function: acceptPoint())

They are pulled out into this standalone module with no serial port, LoRa
radio, or GPS module involved, so a normal Python test runner (pytest) can
exercise every equivalence class, boundary, and error case without needing
the physical hardware. This is the same "extract the business logic" trick
used for #4 since Arduino code can't run inside GitHub Actions directly.

While writing the boundary tests for these functions we found a couple of
gaps in the original code (see the "Bug/gap found" notes in each docstring
below and in the Week 6 report), so this module also has small fixes that
should be ported back into app_15_.py / c3.ino.
"""

import math


# ---------------------------------------------------------------------------
# 1. haversine_m - great-circle distance between two GPS points
#    Real use: climber distance-from-base, alert thresholds, path drawing
# ---------------------------------------------------------------------------
def haversine_m(lat1, lon1, lat2, lon2):
    """Return the distance in meters between (lat1, lon1) and (lat2, lon2).

    Gap found during testing: the original app_15_.py version silently
    accepted None/non-numeric input and would crash with a raw TypeError
    deep inside math.radians(). We now raise a clear ValueError instead.
    """
    for name, v in (("lat1", lat1), ("lon1", lon1), ("lat2", lat2), ("lon2", lon2)):
        if v is None:
            raise ValueError(f"{name} must not be None")
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise ValueError(f"{name} must be a number, got {type(v).__name__}")

    # (0, 0) is used across the project as the "no fix yet" sentinel value.
    if lat1 == 0 and lon1 == 0:
        return 0.0
    if lat2 == 0 and lon2 == 0:
        return 0.0

    r = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)

    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2

    # Floating point rounding can push 'a' fractionally outside [0, 1] for
    # points that are exact or near-exact antipodes (opposite sides of the
    # globe), which then makes math.sqrt(1 - a) raise ValueError: math
    # domain error. Clamp to the valid range before taking the square root.
    a = min(1.0, max(0.0, a))

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return r * c


# ---------------------------------------------------------------------------
# 2. is_duplicate_packet - LoRa message-id de-duplication
#    Real use: prevents the same SOS/MSG packet (sent twice via repeater)
#    from being logged/chatted twice
# ---------------------------------------------------------------------------
def _extract(packet, key):
    marker = key + ":"
    if marker not in packet:
        return ""
    s = packet.find(marker) + len(marker)
    e = packet.find(",", s)
    if e == -1:
        e = len(packet)
    return packet[s:e]


def is_duplicate_packet(packet, seen_ids, max_cache=300):
    """Return (is_duplicate: bool, updated_seen_ids: set).

    seen_ids is passed in and a new set is returned rather than mutated in
    place, which makes this version easier to unit test than the original
    module-level `seen_message_ids` global in app_15_.py.

    Gap found during testing: the original function does `if mid not in
    packet: return False`, which means a packet with no MID field is never
    treated as a duplicate. That is correct behaviour on purpose (unclear
    duplicate protection is impossible without an id), so this is
    documented here as an accepted limitation rather than "fixed".
    """
    if packet is None or not isinstance(packet, str):
        raise TypeError("packet must be a string")
    if seen_ids is None or not isinstance(seen_ids, set):
        raise TypeError("seen_ids must be a set")

    mid = _extract(packet, "MID")

    if not mid:
        return False, seen_ids

    if mid in seen_ids:
        return True, seen_ids

    new_seen = set(seen_ids)
    new_seen.add(mid)

    if len(new_seen) > max_cache:
        new_seen = set()

    return False, new_seen


# ---------------------------------------------------------------------------
# 3. build_alerts - turns raw climber state into dashboard alerts
#    Real use: drives the "Active Alerts" panel (SOS / offline / GPS lost /
#    low battery) shown to the basecamp operator
# ---------------------------------------------------------------------------
def build_alerts(climbers):
    """climbers: list of dicts, each with keys:
        id, online (bool), seconds_since (int), sos (0/1),
        gps_fix (0/1), has_last_known (0/1), last_known_age_s (int),
        battery (0-100), armband_battery (0-100), ble (0/1)

    Gap found during testing: the original build_alerts() in app_15_.py
    does `bat = int(c.get("battery", 0) or 0)`, which means a battery
    reading of exactly 0 is treated as "no reading" (falsy) rather than as
    a critically low battery, so no low-battery alert is ever raised for a
    fully dead device. This reference version fixes that by checking
    `bat is not None` instead of relying on truthiness.
    """
    if climbers is None or not isinstance(climbers, list):
        raise TypeError("climbers must be a list")

    alerts = []

    for c in climbers:
        if not isinstance(c, dict):
            raise TypeError("each climber entry must be a dict")

        cid = c.get("id", "UNKNOWN")

        if c.get("sos", 0) == 1:
            alerts.append({"level": "CRITICAL", "id": cid, "text": "SOS active"})

        if not c.get("online", False):
            alerts.append({"level": "WARNING", "id": cid, "text": "Climber offline"})

        if c.get("gps_fix", 0) != 1:
            if c.get("has_last_known", 0) == 1:
                alerts.append({"level": "WARNING", "id": cid, "text": "GPS lost - last known shown"})
            else:
                alerts.append({"level": "CRITICAL", "id": cid, "text": "No GPS found"})

        bat = c.get("battery", None)
        if bat is not None and 0 <= bat < 20:
            alerts.append({"level": "WARNING", "id": cid, "text": "Main battery low"})

        abat = c.get("armband_battery", None)
        ble = c.get("ble", 0)
        if ble == 1 and abat is not None and 0 <= abat < 20:
            alerts.append({"level": "WARNING", "id": cid, "text": "Armband battery low"})

    return alerts


# ---------------------------------------------------------------------------
# 4. accept_point - GPS jitter / accuracy filter (climber main node)
#    Mirrors: bool acceptPoint(float nla, float nlo, const String& src) in c3.ino
#    Real use: decides whether a new raw GPS fix is trustworthy enough to
#    become the climber's reported location (rejects low-satellite fixes,
#    bad HDOP, GPS jitter, and impossible jumps)
# ---------------------------------------------------------------------------
MIN_SAT = 5
MAX_HDOP = 3.0
MIN_MOVE_M = 12.0
MAX_JUMP_M = 80.0
JUMP_GUARD_MS = 15000


def accept_point(new_lat, new_lon, src, state):
    """state: dict with keys
        has_last (bool), lat (float), lon (float),
        sats (int), hdop (float), ms_since_last_fix (int, ms since setPos()
        last accepted a point for this source)

    Returns (accepted: bool, reason: str).

    Gap found during testing: the original acceptPoint() takes `sats` and
    `hdop` from module-level globals, so a caller can't pass a satellite
    count for a specific check. This reference version takes them from
    `state` explicitly, which is what actually let us test the boundary of
    MIN_SAT (4 vs 5 vs 6 satellites) in isolation.
    """
    if src not in ("NEO6M", "PHONE"):
        raise ValueError("src must be 'NEO6M' or 'PHONE'")
    if new_lat is None or new_lon is None:
        raise ValueError("new_lat and new_lon must not be None")

    if new_lat == 0 or new_lon == 0:
        return False, "ZERO_COORD"

    if src == "NEO6M":
        if state.get("sats", 0) < MIN_SAT:
            return False, "LOW_SATS"
        if state.get("hdop", 99.9) > MAX_HDOP:
            return False, "BAD_HDOP"

    if not state.get("has_last", False) or state.get("lat", 0) == 0 or state.get("lon", 0) == 0:
        return True, "OK"

    d = _haversine_for_filter(state["lat"], state["lon"], new_lat, new_lon)

    if src == "NEO6M":
        if d < MIN_MOVE_M:
            return False, "JITTER"
        if d > MAX_JUMP_M and state.get("ms_since_last_fix", 999999) < JUMP_GUARD_MS:
            return False, "JUMP"
    else:
        if d < 2.0:
            return False, "JITTER"

    return True, "OK"


def _haversine_for_filter(lat1, lon1, lat2, lon2):
    if (lat1 == 0 and lon1 == 0) or (lat2 == 0 and lon2 == 0):
        return 0.0
    r = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
