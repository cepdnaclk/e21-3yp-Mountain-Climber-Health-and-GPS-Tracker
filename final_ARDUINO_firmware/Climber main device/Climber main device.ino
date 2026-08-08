#include <WiFi.h>
#include <WebServer.h>
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <SSD1306Ascii.h>
#include <SSD1306AsciiWire.h>
#include <TinyGPSPlus.h>
#include <math.h>

// ==========================================================
// SIMPLE + STABLE MAIN CLIMBER ESP32 CODE
// For: ESP32 + SX1278 LoRa + NEO-6M + OLED + 3 buttons
// ==========================================================

// ---------- IDs / Wi-Fi ----------
#define ID "CLIMBER01"
const char* AP_SSID = "CLIMBER_01";
const char* AP_PASS = "12345678";

// ---------- Basecamp default GPS ----------
float baseLat = 7.253061;
float baseLon = 80.592154;
uint32_t baseSeq = 1;

// ---------- Pins ----------
#define GPS_RX 16
#define GPS_TX 17

#define BTN_SOS   32
#define BTN_CLEAR 33
#define BTN_OK    25

#define OLED_SDA 21
#define OLED_SCL 22
#define OLED_ADDR 0x3C

#define LORA_SCK  18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS   5
#define LORA_RST  14
#define LORA_DIO0 26
#define LORA_BAND 433E6

// ---------- Optional battery ADC ----------
#define USE_BAT_ADC 1
#define BAT_ADC_PIN 34

// ---------- Timing ----------
const uint32_t TEL_MS        = 3000;   // normal telemetry
const uint32_t SOS_TEL_MS    = 1000;   // SOS telemetry
const uint32_t OLED_MS       = 800;
const uint32_t BTN_MS        = 120;
const uint32_t NEO_TIMEOUT   = 10000;
const uint32_t PHONE_TIMEOUT = 18000;
const uint32_t ARM_TIMEOUT   = 10000;

// ---------- GPS filtering ----------
const int   MIN_SAT = 5;
const float MAX_HDOP = 3.0;
const float MIN_MOVE_M = 12.0;
const float MAX_JUMP_M = 80.0;

// ---------- Objects ----------
WebServer server(80);
HardwareSerial gpsSerial(2);
TinyGPSPlus gps;
SSD1306AsciiWire oled;

// ---------- State ----------
bool loraOK = false;
bool oledOK = false;

float lat = 0, lon = 0, alt = 0;
float lastLat = 0, lastLon = 0, lastAlt = 0;
bool hasLast = false;

String gpsSrc = "NO_GPS";
int sats = 0;
float hdop = 99.9;
String gpsFilter = "WAIT";

bool armOK = false;
bool sensorOK = false;
// 0 = armband/sensor unavailable, 1 = measuring, 2 = connected but no finger
int armSensorStatus = 0;
int bpm = 0;
int bat = 87;
int abat = 0;
int sos = 0;

int rssi = 0;
float snr = 0;

uint32_t seq = 0;
uint32_t msgSeq = 0;
uint32_t baseMsgSeq = 0;

uint32_t lastNeoMs = 0;
uint32_t lastPhoneMs = 0;
uint32_t lastGpsMs = 0;
uint32_t lastArmMs = 0;
uint32_t lastTelMs = 0;
uint32_t lastOledMs = 0;
uint32_t lastBtnMs = 0;

String lastBaseMsg = "";
String lastSentMsg = "";

// ---------- Mesh duplicate protection ----------
// The same packet may arrive directly and again through a repeater.
const uint8_t RX_CACHE_SIZE = 24;
const uint32_t RX_CACHE_MS = 120000UL;
struct RxSeen { uint32_t hash; uint32_t at; bool used; };
RxSeen rxSeen[RX_CACHE_SIZE];
uint8_t rxSeenNext = 0;

uint32_t packetHash(const String& text) {
  uint32_t h = 2166136261UL;
  for (size_t i = 0; i < text.length(); i++) {
    h ^= (uint8_t)text[i];
    h *= 16777619UL;
  }
  return h;
}

bool duplicateRx(const String& packet) {
  uint32_t now = millis();
  uint32_t h = packetHash(packet);
  for (uint8_t i = 0; i < RX_CACHE_SIZE; i++) {
    if (!rxSeen[i].used) continue;
    if ((uint32_t)(now - rxSeen[i].at) > RX_CACHE_MS) {
      rxSeen[i].used = false;
      continue;
    }
    if (rxSeen[i].hash == h) return true;
  }
  rxSeen[rxSeenNext] = {h, now, true};
  rxSeenNext = (rxSeenNext + 1) % RX_CACHE_SIZE;
  return false;
}

// ==========================================================
// Small helpers
// ==========================================================
String getVal(const String& p, const String& k) {
  String key = k + ":";
  int s = p.indexOf(key);
  if (s < 0) return "";
  s += key.length();
  int e = p.indexOf(",", s);
  if (e < 0) e = p.length();
  return p.substring(s, e);
}

String getTextField(const String& p) {
  int s = p.indexOf("TEXT:");
  if (s < 0) s = p.indexOf("TXT:");
  if (s < 0) return "";

  // TEXT is always placed at end by the basecamp code.
  // This avoids parsing failure if other fields shift around.
  int colon = p.indexOf(":", s);
  if (colon < 0) return "";

  String t = p.substring(colon + 1);
  t.trim();

  if (t.length() > 160) t = t.substring(0, 160);
  return t;
}

String getJsonVal(const String& body, const String& key) {
  String k = "\"" + key + "\"";
  int p = body.indexOf(k);
  if (p < 0) return "";
  int c = body.indexOf(":", p);
  if (c < 0) return "";
  int s = c + 1;
  while (s < body.length() && body[s] == ' ') s++;

  if (s < body.length() && body[s] == '"') {
    int e = body.indexOf("\"", s + 1);
    if (e < 0) return "";
    return body.substring(s + 1, e);
  }

  int e = body.indexOf(",", s);
  if (e < 0) e = body.indexOf("}", s);
  if (e < 0) e = body.length();
  String v = body.substring(s, e);
  v.trim();
  return v;
}

String esc(String s) {
  s.replace("\\", "\\\\");
  s.replace("\"", "\\\"");
  s.replace("\n", " ");
  s.replace("\r", " ");
  return s;
}

double distM(double la1, double lo1, double la2, double lo2) {
  if ((la1 == 0 && lo1 == 0) || (la2 == 0 && lo2 == 0)) return 0;
  const double R = 6371000.0;
  double p1 = la1 * DEG_TO_RAD;
  double p2 = la2 * DEG_TO_RAD;
  double dp = (la2 - la1) * DEG_TO_RAD;
  double dl = (lo2 - lo1) * DEG_TO_RAD;
  double a = sin(dp/2)*sin(dp/2) + cos(p1)*cos(p2)*sin(dl/2)*sin(dl/2);
  return R * 2 * atan2(sqrt(a), sqrt(1-a));
}

double bearingDeg(double la1, double lo1, double la2, double lo2) {
  if ((la1 == 0 && lo1 == 0) || (la2 == 0 && lo2 == 0)) return 0;
  double p1 = la1 * DEG_TO_RAD;
  double p2 = la2 * DEG_TO_RAD;
  double dl = (lo2 - lo1) * DEG_TO_RAD;
  double y = sin(dl) * cos(p2);
  double x = cos(p1)*sin(p2) - sin(p1)*cos(p2)*cos(dl);
  double b = atan2(y, x) * RAD_TO_DEG;
  if (b < 0) b += 360;
  return b;
}

String dirText(double b) {
  if (b < 22.5 || b >= 337.5) return "N";
  if (b < 67.5) return "NE";
  if (b < 112.5) return "E";
  if (b < 157.5) return "SE";
  if (b < 202.5) return "S";
  if (b < 247.5) return "SW";
  if (b < 292.5) return "W";
  return "NW";
}

bool neoRecent() {
  return lastNeoMs > 0 && millis() - lastNeoMs < NEO_TIMEOUT;
}

bool phoneRecent() {
  return lastPhoneMs > 0 && millis() - lastPhoneMs < PHONE_TIMEOUT;
}

bool gpsFix() {
  if (gpsSrc == "NEO6M") return neoRecent();
  if (gpsSrc == "PHONE") return phoneRecent();
  return false;
}

String gpsStatus() {
  if (gpsSrc == "NEO6M" && neoRecent()) return "NEO6M";
  if (gpsSrc == "PHONE" && phoneRecent()) return "PHONE";
  if (hasLast) return "NO_FIX_LAST_KNOWN";
  return "NO_GPS";
}

uint32_t lastAgeSec() {
  if (!hasLast || lastGpsMs == 0) return 0;
  return (millis() - lastGpsMs) / 1000;
}

uint32_t gpsAgeSec() {
  if (gpsSrc == "NEO6M" && lastNeoMs > 0) return (millis() - lastNeoMs) / 1000;
  if (gpsSrc == "PHONE" && lastPhoneMs > 0) return (millis() - lastPhoneMs) / 1000;
  return 0;
}

float showLat() {
  return (!gpsFix() && hasLast) ? lastLat : lat;
}

float showLon() {
  return (!gpsFix() && hasLast) ? lastLon : lon;
}

double baseDistance() {
  return distM(baseLat, baseLon, showLat(), showLon());
}

double baseBearing() {
  return bearingDeg(baseLat, baseLon, showLat(), showLon());
}

int readBattery() {
#if USE_BAT_ADC
  int raw = analogRead(BAT_ADC_PIN);
  float v = (raw / 4095.0) * 3.3 * 2.0;
  int p = (int)((v - 3.0) * 100.0 / 1.2);
  if (p < 0) p = 0;
  if (p > 100) p = 100;
  return p;
#else
  return bat;
#endif
}

// ==========================================================
// GPS update with simple jitter filter
// ==========================================================
bool acceptPoint(float nla, float nlo, const String& src) {
  if (nla == 0 || nlo == 0) return false;

  if (src == "NEO6M") {
    if (sats < MIN_SAT) {
      gpsFilter = "LOW_SATS";
      return false;
    }
    if (hdop > MAX_HDOP) {
      gpsFilter = "BAD_HDOP";
      return false;
    }
  }

  if (!hasLast || lat == 0 || lon == 0) {
    gpsFilter = "OK";
    return true;
  }

  double d = distM(lat, lon, nla, nlo);

  if (src == "NEO6M") {
    if (d < MIN_MOVE_M) {
      gpsFilter = "JITTER";
      return false;
    }
    if (d > MAX_JUMP_M && millis() - lastGpsMs < 15000) {
      gpsFilter = "JUMP";
      return false;
    }
  } else {
    if (d < 2.0) return false;
  }

  gpsFilter = "OK";
  return true;
}

void setPos(float nla, float nlo, float nalt, String src) {
  if (!acceptPoint(nla, nlo, src)) return;

  lat = nla;
  lon = nlo;
  alt = nalt;

  lastLat = nla;
  lastLon = nlo;
  lastAlt = nalt;
  hasLast = true;

  gpsSrc = src;
  lastGpsMs = millis();
  if (src == "NEO6M") lastNeoMs = millis();
  if (src == "PHONE") lastPhoneMs = millis();
}

void readGPS() {
  while (gpsSerial.available()) gps.encode(gpsSerial.read());

  if (gps.satellites.isValid()) sats = gps.satellites.value();
  if (gps.hdop.isValid()) hdop = gps.hdop.hdop();

  if (!gps.location.isValid() || gps.location.age() > 5000) {
    gpsFilter = "NO_FIX";
    return;
  }

  float a = alt;
  if (gps.altitude.isValid()) a = gps.altitude.meters();
  setPos(gps.location.lat(), gps.location.lng(), a, "NEO6M");
}

void updateTimeouts() {
  if (gpsSrc == "NEO6M" && !neoRecent()) gpsSrc = "NO_GPS";
  if (gpsSrc == "PHONE" && !phoneRecent()) gpsSrc = "NO_GPS";

  if (lastArmMs > 0 && millis() - lastArmMs > ARM_TIMEOUT) {
    armOK = false;
    sensorOK = false;
    armSensorStatus = 0;
    bpm = 0;
    abat = 0;
  }
}

// ==========================================================
// LoRa
// ==========================================================
void startLoRa() {
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  loraOK = LoRa.begin(LORA_BAND);

  if (loraOK) {
    LoRa.setSpreadingFactor(8);      // reliable + still responsive
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.setTxPower(17);
    LoRa.receive();
  }
}

void sendLoRa(String p, bool repeat = false) {
  if (!loraOK) return;
  if (p.length() > 230) p = p.substring(0, 230);

  int n = repeat ? 2 : 1;
  for (int i = 0; i < n; i++) {
    LoRa.idle();
    LoRa.beginPacket();
    LoRa.print(p);
    LoRa.endPacket();
    delay(repeat ? 45 : 5);
  }
  LoRa.receive();
}

String mid() {
  msgSeq++;
  return String(ID) + "-" + String(msgSeq);
}

String common() {
  bat = readBattery();
  return ",LAT:" + String(lat, 6) +
         ",LON:" + String(lon, 6) +
         ",ALT:" + String(alt, 1) +
         ",GPS:" + gpsStatus() +
         ",SAT:" + String(sats) +
         ",HDOP:" + String(hdop, 1) +
         ",GREJ:" + gpsFilter +
         ",FIX:" + String(gpsFix() ? 1 : 0) +
         ",GAGE:" + String(gpsAgeSec()) +
         ",LK:" + String(hasLast ? 1 : 0) +
         ",LKAGE:" + String(lastAgeSec()) +
         ",LKLAT:" + String(lastLat, 6) +
         ",LKLON:" + String(lastLon, 6) +
         ",BPM:" + String(bpm) +
         ",BAT:" + String(bat) +
         ",ABAT:" + String(abat) +
         ",SOS:" + String(sos) +
         ",BLE:" + String(armOK ? 1 : 0) +
         ",SEN:" + String(sensorOK ? 1 : 0) +
         ",ARMSTAT:" + String(armSensorStatus);
}

void sendTelemetry() {
  seq++;
  bat = readBattery();

  // Keep essential health and safety fields before optional diagnostics.
  // This packet remains below the 230-byte limit, so armband data is not cut off.
  String p = "TYPE:DATA,ID:" + String(ID) +
             ",FROM:" + String(ID) +
             ",TO:BASE" +
             ",SEQ:" + String(seq) +
             ",MID:" + String(ID) + "-D-" + String(seq) +
             ",HOP:0" +
             ",LAT:" + String(showLat(), 6) +
             ",LON:" + String(showLon(), 6) +
             ",ALT:" + String(alt, 1) +
             ",BPM:" + String(bpm) +
             ",BAT:" + String(bat) +
             ",ABAT:" + String(abat) +
             ",BLE:" + String(armOK ? 1 : 0) +
             ",SEN:" + String(sensorOK ? 1 : 0) +
             ",ARMSTAT:" + String(armSensorStatus) +
             ",SOS:" + String(sos) +
             ",GPS:" + gpsStatus() +
             ",FIX:" + String(gpsFix() ? 1 : 0) +
             ",SAT:" + String(sats) +
             ",HDOP:" + String(hdop, 1) +
             ",BSEQ:" + String(baseMsgSeq);

  sendLoRa(p, false);
}

void sendEvent(String type, String text) {
  if (text.length() > 120) text = text.substring(0, 120);
  text.replace(",", " ");

  String eventMid = mid();
  String p = "TYPE:" + type +
             ",ID:" + String(ID) +
             ",FROM:" + String(ID) +
             ",TO:BASE" +
             ",MID:" + eventMid +
             ",HOP:0" +
             ",TEXT:" + text +
             ",SOS:" + String(sos);
  sendLoRa(p, true);
}

void readLoRa() {
  if (!loraOK) return;

  int n = LoRa.parsePacket();
  if (!n) return;

  String p = "";
  while (LoRa.available()) p += (char)LoRa.read();

  rssi = LoRa.packetRssi();
  snr = LoRa.packetSnr();

  // Ignore the second copy when one arrives directly and one via repeater.
  if (duplicateRx(p)) return;

  String to = getVal(p, "TO");
  if (to.length() && to != ID && to != "ALL") return;

  if (p.indexOf("TYPE:BASE") >= 0) {
    uint32_t sq = getVal(p, "SEQ").toInt();
    if (sq > 0 && sq <= baseSeq) return;

    float bla = getVal(p, "LAT").toFloat();
    float blo = getVal(p, "LON").toFloat();

    if (bla != 0 && blo != 0) {
      baseLat = bla;
      baseLon = blo;
      baseSeq = sq > 0 ? sq : baseSeq + 1;
      lastBaseMsg = "Base GPS updated";
      baseMsgSeq++;
      drawOLED();
    }
    return;
  }

  if (p.indexOf("TYPE:SOS_CLEAR") >= 0) {
    sos = 0;
    String txt = getTextField(p);
    if (txt.length() == 0) txt = "SOS cleared by base camp";
    lastBaseMsg = txt;
    baseMsgSeq++;
    drawOLED();
    return;
  }

  if (p.indexOf("TYPE:MSG") >= 0) {
    String txt = getTextField(p);
    if (txt.length() == 0) txt = getVal(p, "TEXT");

    if (txt.length() > 0) {
      lastBaseMsg = txt;
      baseMsgSeq++;
      drawOLED();
    }
    return;
  }
}

// ==========================================================
// OLED
// ==========================================================
void startOLED() {
  Wire.begin(OLED_SDA, OLED_SCL);
  delay(100);
  oled.begin(&Adafruit128x64, OLED_ADDR);
  oled.setFont(Adafruit5x7);
  oledOK = true;
}

void drawOLED() {
  if (!oledOK) return;

  double d = baseDistance();
  double b = baseBearing();

  oled.clear();
  oled.setCursor(0, 0);
  oled.print(ID);
  oled.print(sos ? " SOS" : " SAFE");

  oled.setCursor(0, 1);
  oled.print("D:");
  if (d < 1000) {
    oled.print(d, 1);
    oled.print("m ");
  } else {
    oled.print(d / 1000.0, 2);
    oled.print("k ");
  }
  oled.print(dirText(b));

  oled.setCursor(0, 2);
  oled.print("GPS:");
  String gs = gpsStatus();
  if (gs == "NO_FIX_LAST_KNOWN") oled.print("LAST");
  else oled.print(gs);

  oled.setCursor(0, 3);
  oled.print("LORA:");
  oled.print(loraOK ? "OK " : "FAIL");
  oled.print(" R:");
  oled.print(rssi);

  oled.setCursor(0, 4);
  oled.print("ARM:");
  oled.print(armOK ? "OK " : "NO ");
  oled.print("BPM:");
  oled.print(bpm);

  oled.setCursor(0, 5);
  oled.print("BAT:");
  oled.print(bat);
  oled.print("% AB:");
  oled.print(abat);

  oled.setCursor(0, 6);
  oled.print("SAT:");
  oled.print(sats);
  oled.print(" H:");
  oled.print(hdop, 1);

  oled.setCursor(0, 7);
  oled.print("F:");
  oled.print(gpsFilter);
}

// ==========================================================
// HTTP for Flutter
// ==========================================================
void hdr() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Connection", "close");
}

void root() {
  hdr();
  server.send(200, "text/plain", "CLIMBER OK");
}

void status() {
  hdr();

  String s = "{";
  s += "\"id\":\"" + String(ID) + "\",";
  s += "\"lat\":" + String(lat, 6) + ",";
  s += "\"lon\":" + String(lon, 6) + ",";
  s += "\"altitude\":" + String(alt, 1) + ",";
  s += "\"baseLat\":" + String(baseLat, 6) + ",";
  s += "\"baseLon\":" + String(baseLon, 6) + ",";
  s += "\"distanceToBaseM\":" + String(baseDistance(), 1) + ",";
  s += "\"bearingFromBaseDeg\":" + String(baseBearing(), 1) + ",";
  s += "\"directionFromBase\":\"" + dirText(baseBearing()) + "\",";
  s += "\"gpsSource\":\"" + gpsStatus() + "\",";
  s += "\"gpsCurrentFix\":" + String(gpsFix() ? "true" : "false") + ",";
  s += "\"gpsAgeMs\":" + String(gpsAgeSec() * 1000) + ",";
  s += "\"gpsSatellites\":" + String(sats) + ",";
  s += "\"gpsHdop\":" + String(hdop, 1) + ",";
  s += "\"gpsRejectReason\":\"" + gpsFilter + "\",";
  s += "\"hasLastKnownLocation\":" + String(hasLast ? "true" : "false") + ",";
  s += "\"lastKnownAgeMs\":" + String(lastAgeSec() * 1000) + ",";
  s += "\"lastKnownLat\":" + String(lastLat, 6) + ",";
  s += "\"lastKnownLon\":" + String(lastLon, 6) + ",";
  s += "\"bpm\":" + String(bpm) + ",";
  s += "\"battery\":" + String(bat) + ",";
  s += "\"armbandBattery\":" + String(abat) + ",";
  s += "\"sos\":" + String(sos) + ",";
  s += "\"rssi\":" + String(rssi) + ",";
  s += "\"snr\":" + String(snr, 1) + ",";
  s += "\"wifiReady\":true,";
  s += "\"loraReady\":" + String(loraOK ? "true" : "false") + ",";
  s += "\"armbandConnected\":" + String(armOK ? "true" : "false") + ",";
  s += "\"sensorAttached\":" + String(sensorOK ? "true" : "false") + ",";
  s += "\"armbandSensorStatus\":" + String(armSensorStatus) + ",";
  s += "\"baseMsgSeq\":" + String(baseMsgSeq) + ",";
  s += "\"lastBaseMessageSeq\":" + String(baseMsgSeq) + ",";
  s += "\"lastBaseMessage\":\"" + esc(lastBaseMsg) + "\",";
  s += "\"lastSentMessage\":\"" + esc(lastSentMsg) + "\"";
  s += "}";

  server.send(200, "application/json", s);
}

void postGps() {
  hdr();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no_body\"}");
    return;
  }

  // Only accept phone GPS if NEO-6M is not recent.
  if (!neoRecent()) {
    String b = server.arg("plain");
    setPos(getJsonVal(b, "lat").toFloat(),
           getJsonVal(b, "lon").toFloat(),
           getJsonVal(b, "alt").toFloat(),
           "PHONE");
  }

  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void postBpm() {
  hdr();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no_body\"}");
    return;
  }

  String b = server.arg("plain");
  int arm = getJsonVal(b, "arm").toInt();
  int sen = getJsonVal(b, "sensor").toInt();
  String rawStatusText = getJsonVal(b, "sensorStatus");
  int rawStatus = rawStatusText.length() ? rawStatusText.toInt() : -1;
  int nbpm = getJsonVal(b, "bpm").toInt();
  int nb = getJsonVal(b, "abat").toInt();

  armOK = arm == 1;

  if (armOK) {
    lastArmMs = millis();

    // Preserve the status model used by the previous Flutter/armband code:
    // 0 = unavailable, 1 = measuring, 2 = connected but no finger.
    if (rawStatus >= 0 && rawStatus <= 2) {
      armSensorStatus = rawStatus;
    } else {
      armSensorStatus = (sen == 1) ? 1 : 0;
    }

    sensorOK = (armSensorStatus == 1 || armSensorStatus == 2 || sen == 1);

    if (nbpm >= 35 && nbpm <= 220) bpm = nbpm;
    else bpm = 0;

    if (nb >= 0 && nb <= 100) abat = nb;
  } else {
    bpm = 0;
    abat = 0;
    armSensorStatus = 0;
    sensorOK = false;
  }

  server.send(200, "application/json",
              "{\"status\":\"ok\",\"armbandConnected\":" +
              String(armOK ? "true" : "false") +
              ",\"sensorStatus\":" + String(armSensorStatus) +
              ",\"bpm\":" + String(bpm) +
              ",\"abat\":" + String(abat) + "}");
}

void postMsg() {
  hdr();
  if (!server.hasArg("plain")) {
    server.send(400, "application/json", "{\"error\":\"no_body\"}");
    return;
  }

  String msg = getJsonVal(server.arg("plain"), "message");
  msg.trim();

  if (!msg.length()) {
    server.send(400, "application/json", "{\"error\":\"empty\"}");
    return;
  }

  lastSentMsg = msg;
  server.send(200, "application/json", "{\"status\":\"queued\"}");
  delay(2);
  sendEvent("MSG", msg);
}

void postSos() {
  hdr();
  sos = 1;
  lastSentMsg = "SOS";
  server.send(200, "application/json", "{\"status\":\"sos\"}");
  delay(2);
  sendEvent("SOS", "SOS");
}

void postClear() {
  hdr();
  sos = 0;
  lastSentMsg = "SOS cleared";
  server.send(200, "application/json", "{\"status\":\"clear\"}");
  delay(2);
  sendEvent("SOS_CLEAR", "SOS cleared");
}

void opt() {
  hdr();
  server.send(204);
}

void startServer() {
  server.on("/", HTTP_GET, root);
  server.on("/status", HTTP_GET, status);
  server.on("/gps", HTTP_POST, postGps);
  server.on("/bpm", HTTP_POST, postBpm);
  server.on("/send", HTTP_POST, postMsg);
  server.on("/sos", HTTP_POST, postSos);
  server.on("/clear-sos", HTTP_POST, postClear);

  server.on("/status", HTTP_OPTIONS, opt);
  server.on("/gps", HTTP_OPTIONS, opt);
  server.on("/bpm", HTTP_OPTIONS, opt);
  server.on("/send", HTTP_OPTIONS, opt);
  server.on("/sos", HTTP_OPTIONS, opt);
  server.on("/clear-sos", HTTP_OPTIONS, opt);

  server.onNotFound(root);
  server.begin();
}

// ==========================================================
// Buttons
// ==========================================================
void buttons() {
  if (millis() - lastBtnMs < BTN_MS) return;

  if (digitalRead(BTN_SOS) == LOW) {
    lastBtnMs = millis();
    sos = 1;
    lastSentMsg = "SOS button";
    sendEvent("SOS", "SOS button");
    sendTelemetry();
    drawOLED();
  }

  if (digitalRead(BTN_CLEAR) == LOW) {
    lastBtnMs = millis();
    sos = 0;
    lastSentMsg = "SOS cleared";
    sendEvent("SOS_CLEAR", "SOS cleared");
    sendTelemetry();
    drawOLED();
  }

  if (digitalRead(BTN_OK) == LOW) {
    lastBtnMs = millis();
    lastSentMsg = "I am OK";
    sendEvent("MSG", "I am OK");
    sendTelemetry();
    drawOLED();
  }
}

// ==========================================================
// Setup / loop
// ==========================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BTN_SOS, INPUT_PULLUP);
  pinMode(BTN_CLEAR, INPUT_PULLUP);
  pinMode(BTN_OK, INPUT_PULLUP);

#if USE_BAT_ADC
  analogReadResolution(12);
#endif

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);
  WiFi.softAP(AP_SSID, AP_PASS);

  startServer();
  startOLED();
  startLoRa();

  sendTelemetry();
  drawOLED();
  lastTelMs = millis();
  lastOledMs = millis();
}

void loop() {
  server.handleClient();

  readGPS();
  updateTimeouts();
  buttons();
  readLoRa();

  uint32_t t = millis();
  uint32_t interval = sos ? SOS_TEL_MS : TEL_MS;

  if (t - lastTelMs >= interval) {
    lastTelMs = t;
    sendTelemetry();
  }

  if (t - lastOledMs >= OLED_MS) {
    lastOledMs = t;
    drawOLED();
  }

  yield();
}