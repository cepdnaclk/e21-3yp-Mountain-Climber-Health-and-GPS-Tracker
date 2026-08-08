#include <SPI.h>

#include <LoRa.h>



// ===================== BASECAMP ESP32 LoRa <-> USB BRIDGE =====================

// Serial commands from app.py:

//   MSG|CLIMBER01|hello

//   CLEAR|CLIMBER01

//   BASE|7.253061|80.592154

//

// Serial JSON output to app.py:

//   {"type":"lora_rx","id":"CLIMBER01","packet":"...","rssi":-70,"snr":8.5}



#define DEFAULT_CLIMBER_ID "CLIMBER01"



// SX1278 / Ra-02 LoRa pins

#define LORA_SCK   18

#define LORA_MISO  19

#define LORA_MOSI  23

#define LORA_SS    5

#define LORA_RST   14

#define LORA_DIO0  26

#define LORA_BAND 433E6



String serialInput = "";

unsigned long baseSeq = 1;

unsigned long txSeq = 1;

unsigned long lastLoRaTxMs = 0;

// The same LoRa frame may arrive directly and through one or more repeaters.
const uint8_t RX_CACHE_SIZE = 48;
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
  // Dedup by MID rather than the full packet text: a repeater now increments
  // the HOP field before retransmitting, so a direct copy and a repeated copy
  // of the exact same packet are no longer byte-identical. MID is unaffected
  // by hop-count changes, so it remains a stable identity for the same event.
  String mid = extractValue(packet, "MID");
  String key = mid.length() ? mid : packet;
  uint32_t now = millis();
  uint32_t h = packetHash(key);
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



void printJsonSafe(String text) {

  for (int i = 0; i < text.length(); i++) {

    char c = text[i];



    if (c == '\"') Serial.print("\\\"");

    else if (c == '\\') Serial.print("\\\\");

    else if (c == '\n') Serial.print("\\n");

    else if (c == '\r') Serial.print("\\r");

    else Serial.print(c);

  }

}



String extractValue(String packet, String key) {

  int s = packet.indexOf(key + ":");

  if (s < 0) return "";



  s += key.length() + 1;



  int e = packet.indexOf(",", s);

  if (e < 0) e = packet.length();



  return packet.substring(s, e);

}



void printTxJson(String target, String packet) {

  Serial.print("{\"type\":\"lora_tx\",\"to\":\"");

  printJsonSafe(target);

  Serial.print("\",\"packet\":\"");

  printJsonSafe(packet);

  Serial.println("\"}");

}



void printError(String msg) {

  Serial.print("{\"type\":\"error\",\"message\":\"");

  printJsonSafe(msg);

  Serial.println("\"}");

}



void sendLoRaPriority(String packet) {

  if (packet.length() > 235) packet = packet.substring(0, 235);



  // Reliable short command send. Dashboard deduplicates replies where needed.

  for (int i = 0; i < 2; i++) {

    LoRa.idle();

    LoRa.beginPacket();

    LoRa.print(packet);

    LoRa.endPacket();

    lastLoRaTxMs = millis();

    delay(45);

  }



  LoRa.receive();

}



void sendMessageToClimber(String target, String message) {

  target.trim();

  message.trim();



  if (target.length() == 0) target = DEFAULT_CLIMBER_ID;

  if (message.length() == 0) return;

  if (message.length() > 120) message = message.substring(0, 120);

  message.replace(",", " ");



  txSeq++;



  // TEXT is kept at the END. Main climber reads everything after TEXT:.

  String packet = "TYPE:MSG,ID:BASE,FROM:BASE,TO:" + target +

                  ",SEQ:" + String(txSeq) +

                  ",MID:BASE-" + String(txSeq) +

                  ",TEXT:" + message;



  sendLoRaPriority(packet);

  printTxJson(target, packet);

}





void sendClearSosToClimber(String target) {

  target.trim();

  if (target.length() == 0) target = DEFAULT_CLIMBER_ID;



  txSeq++;



  String packet = "TYPE:SOS_CLEAR,ID:BASE,FROM:BASE,TO:" + target +

                  ",SEQ:" + String(txSeq) +

                  ",MID:BASE-" + String(txSeq) +

                  ",TEXT:SOS cleared by base camp";



  sendLoRaPriority(packet);

  printTxJson(target, packet);

}



void sendBaseLocation(String lat, String lon) {

  lat.trim();

  lon.trim();



  if (lat.length() == 0 || lon.length() == 0) return;



  baseSeq++;



  String packet = "TYPE:BASE,ID:BASE,FROM:BASE,TO:ALL,SEQ:" + String(baseSeq) +
                  ",MID:BASE-B-" + String(baseSeq) +

                  ",LAT:" + lat +

                  ",LON:" + lon;



  sendLoRaPriority(packet);

  printTxJson("ALL", packet);

}



void handleSerialCommand(String line) {

  line.trim();



  if (line.length() == 0) return;



  if (line.startsWith("MSG|")) {

    int a = line.indexOf('|');

    int b = line.indexOf('|', a + 1);

    if (b < 0) {

      printError("Bad MSG command");

      return;

    }



    String target = line.substring(a + 1, b);

    String message = line.substring(b + 1);

    sendMessageToClimber(target, message);

    return;

  }



  if (line.startsWith("CLEAR|")) {

    int sep = line.indexOf('|');

    if (sep < 0) {

      printError("Bad CLEAR command");

      return;

    }



    String target = line.substring(sep + 1);

    sendClearSosToClimber(target);

    return;

  }



  if (line.startsWith("BASE|")) {

    int a = line.indexOf('|');

    int b = line.indexOf('|', a + 1);

    if (b < 0) {

      printError("Bad BASE command");

      return;

    }



    String lat = line.substring(a + 1, b);

    String lon = line.substring(b + 1);

    sendBaseLocation(lat, lon);

    return;

  }



  // Plain text fallback.

  sendMessageToClimber(DEFAULT_CLIMBER_ID, line);

}



void readSerialCommands() {

  while (Serial.available()) {

    char c = Serial.read();



    if (c == '\n') {

      handleSerialCommand(serialInput);

      serialInput = "";

    } else if (c != '\r') {

      if (serialInput.length() < 240) {

        serialInput += c;

      } else {

        serialInput = "";

        printError("Serial command too long");

      }

    }

  }

}



void readLoRaPackets() {

  int packetSize = LoRa.parsePacket();

  if (!packetSize) return;



  String incoming = "";



  while (LoRa.available()) {

    incoming += (char)LoRa.read();

  }



  int rssi = LoRa.packetRssi();

  float snr = LoRa.packetSnr();

  // Suppress copies received through multiple paths.
  if (duplicateRx(incoming)) return;

  String to = extractValue(incoming, "TO");
  if (to.length() && to != "BASE" && to != "ALL") return;

  String id = extractValue(incoming, "ID");

  if (id.length() == 0) id = extractValue(incoming, "FROM");

  if (id.length() == 0) id = DEFAULT_CLIMBER_ID;



  Serial.print("{\"type\":\"lora_rx\",\"id\":\"");

  printJsonSafe(id);

  Serial.print("\",\"packet\":\"");

  printJsonSafe(incoming);

  Serial.print("\",\"rssi\":");

  Serial.print(rssi);

  Serial.print(",\"snr\":");

  Serial.print(snr, 1);

  Serial.println("}");

}



void setup() {

  Serial.begin(115200);

  delay(800);



  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);

  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);



  if (!LoRa.begin(LORA_BAND)) {

    printError("LoRa failed");

    while (true) delay(1000);

  }



  LoRa.setSpreadingFactor(8);  // balanced fast + reliable

  LoRa.setSignalBandwidth(125E3);

  LoRa.setCodingRate4(5);

  LoRa.setTxPower(17);

  LoRa.receive();



  Serial.println("{\"type\":\"system\",\"message\":\"Base Camp LoRa Ready\"}");

}



void loop() {

  readLoRaPackets();

  readSerialCommands();

  yield();

}