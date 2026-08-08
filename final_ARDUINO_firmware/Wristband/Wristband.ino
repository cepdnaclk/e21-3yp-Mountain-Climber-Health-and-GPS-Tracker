#include <Wire.h>

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include "MAX30105.h"
#include "heartRate.h"

// ==========================================================
// ESP32-H2 CLIMBER ARMBAND
//
// MAX30102 VIN -> 3V3
// MAX30102 GND -> GND
// MAX30102 SDA -> GPIO5
// MAX30102 SCL -> GPIO4
//
// Battery divider:
// Battery+ -> 100k -> GPIO1 -> 100k -> GND
// ==========================================================

#define BLE_DEVICE_NAME "CLIMBER_ARMBAND"

#define SDA_PIN 5
#define SCL_PIN 4
#define BAT_ADC_PIN 1

#define SERVICE_UUID \
  "6c1d0001-7f4a-4b2d-9c21-5a7d3e110001"

#define DATA_CHARACTERISTIC_UUID \
  "6c1d0002-7f4a-4b2d-9c21-5a7d3e110001"

// ==========================================================
// SETTINGS
// ==========================================================

const float BATTERY_DIVIDER_RATIO = 2.0f;

// No-finger IR was about 350.
// Finger IR was above about 8000.
const uint32_t FINGER_THRESHOLD = 3000;

// Only clear BPM after finger is really removed.
const uint32_t FINGER_LOST_TIMEOUT_MS = 2000;

const uint32_t BLE_UPDATE_INTERVAL_MS = 1000;
const uint32_t DEBUG_INTERVAL_MS = 100;

// ==========================================================
// BLE OBJECTS
// ==========================================================

BLEServer* bleServer = nullptr;
BLECharacteristic* dataCharacteristic = nullptr;

bool phoneConnected = false;
bool previousPhoneConnected = false;

// ==========================================================
// SENSOR OBJECTS
// ==========================================================

MAX30105 particleSensor;

bool sensorFound = false;

// 0 = sensor missing
// 1 = finger detected / measuring
// 2 = sensor found but no finger
int sensorStatus = 0;

uint32_t currentIR = 0;
int bpmValue = 0;

// Heart-rate averaging
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE] = {0};

byte ratePosition = 0;
byte validRateCount = 0;

uint32_t lastBeatMs = 0;
uint32_t lastFingerMs = 0;

// ==========================================================
// BATTERY
// ==========================================================

float batteryVoltage = 0.0f;
int batteryPercent = 0;

// ==========================================================
// TIMERS
// ==========================================================

uint32_t lastBleUpdateMs = 0;
uint32_t lastDebugMs = 0;

// ==========================================================
// BLE CALLBACKS
// ==========================================================

class ArmbandServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer* server) override
  {
    phoneConnected = true;

    Serial.println("Phone connected");
  }

  void onDisconnect(BLEServer* server) override
  {
    phoneConnected = false;

    Serial.println("Phone disconnected");
  }
};

// ==========================================================
// BATTERY FUNCTIONS
// ==========================================================

int batteryVoltageToPercent(float voltage)
{
  if (voltage >= 4.20f) return 100;
  if (voltage >= 4.10f) return 90;
  if (voltage >= 4.00f) return 80;
  if (voltage >= 3.90f) return 70;
  if (voltage >= 3.80f) return 60;
  if (voltage >= 3.70f) return 50;
  if (voltage >= 3.60f) return 35;
  if (voltage >= 3.50f) return 25;
  if (voltage >= 3.40f) return 15;
  if (voltage >= 3.30f) return 8;

  return 0;
}

float readBatteryVoltage()
{
  const byte sampleCount = 12;

  uint32_t totalMilliVolts = 0;

  for (byte i = 0; i < sampleCount; i++)
  {
    totalMilliVolts +=
      analogReadMilliVolts(BAT_ADC_PIN);

    delayMicroseconds(500);
  }

  float adcVoltage =
    (totalMilliVolts / (float)sampleCount) /
    1000.0f;

  return adcVoltage * BATTERY_DIVIDER_RATIO;
}

void updateBattery()
{
  batteryVoltage =
    readBatteryVoltage();

  batteryPercent =
    batteryVoltageToPercent(
      batteryVoltage
    );
}

// ==========================================================
// HEART RATE RESET
// ==========================================================

void resetHeartRate()
{
  bpmValue = 0;

  ratePosition = 0;
  validRateCount = 0;

  lastBeatMs = 0;

  for (byte i = 0; i < RATE_SIZE; i++)
  {
    rates[i] = 0;
  }
}

// ==========================================================
// START MAX30102
// ==========================================================

void startMax30102()
{
  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );

  Wire.setClock(400000);

  delay(100);

  sensorFound =
    particleSensor.begin(
      Wire,
      I2C_SPEED_FAST
    );

  if (!sensorFound)
  {
    sensorStatus = 0;

    Serial.println(
      "MAX30102 not found"
    );

    return;
  }

  sensorStatus = 2;

  /*
    Parameters:
    LED brightness
    sample averaging
    LED mode
    sample rate
    pulse width
    ADC range
  */

  particleSensor.setup(
    0x3F,
    1,
    2,
    100,
    411,
    8192
  );

  particleSensor.setPulseAmplitudeRed(
    0x20
  );

  particleSensor.setPulseAmplitudeIR(
    0x3F
  );

  particleSensor.setPulseAmplitudeGreen(
    0
  );

  particleSensor.clearFIFO();

  lastFingerMs = millis();

  Serial.println(
    "MAX30102 found"
  );

  Serial.println(
    "Place fingertip firmly over sensor"
  );

  Serial.println(
    "Keep finger still for 10 seconds"
  );
}

// ==========================================================
// PROCESS HEART RATE
// ==========================================================

// How often to retry detecting the MAX30102 if it wasn't found at boot.
// A brief loose-wire blip during startup used to require a full power cycle
// to recover from, since sensorFound was only ever checked once. This lets
// it self-heal once the wiring is reseated, without needing a manual reboot.
const uint32_t SENSOR_RETRY_MS = 5000;
uint32_t lastSensorRetryMs = 0;

void processHeartRate()
{
  if (!sensorFound)
  {
    sensorStatus = 0;
    bpmValue = 0;

    if (millis() - lastSensorRetryMs >= SENSOR_RETRY_MS)
    {
      lastSensorRetryMs = millis();
      Serial.println("Retrying MAX30102 detection...");
      startMax30102();
    }

    return;
  }

  particleSensor.check();

  while (particleSensor.available())
  {
    uint32_t irValue =
      particleSensor.getFIFOIR();

    currentIR = irValue;

    particleSensor.nextSample();

    if (irValue < FINGER_THRESHOLD)
    {
      continue;
    }

    sensorStatus = 1;
    lastFingerMs = millis();

    bool beatDetected =
      checkForBeat(
        (int32_t)irValue
      );

    if (beatDetected)
    {
      uint32_t now = millis();

      Serial.print(
        "BEAT PEAK | IR: "
      );

      Serial.println(irValue);

      if (lastBeatMs != 0)
      {
        uint32_t intervalMs =
          now - lastBeatMs;

        float instantBpm =
          60000.0f /
          (float)intervalMs;

        Serial.print(
          "Interval: "
        );

        Serial.print(intervalMs);

        Serial.print(
          " ms | Calculated BPM: "
        );

        Serial.println(
          instantBpm,
          1
        );

        /*
          300 ms = 200 BPM
          1500 ms = 40 BPM
        */

        if (
          intervalMs >= 300 &&
          intervalMs <= 1500
        )
        {
          rates[ratePosition] =
            (byte)(
              instantBpm + 0.5f
            );

          ratePosition =
            (ratePosition + 1) %
            RATE_SIZE;

          if (
            validRateCount <
            RATE_SIZE
          )
          {
            validRateCount++;
          }

          uint16_t total = 0;

          for (
            byte i = 0;
            i < validRateCount;
            i++
          )
          {
            total += rates[i];
          }

          bpmValue =
            total /
            validRateCount;

          Serial.print(
            "VALID BPM: "
          );

          Serial.println(
            bpmValue
          );
        }
        else
        {
          Serial.println(
            "Beat interval rejected"
          );
        }
      }

      lastBeatMs = now;
    }
  }

  /*
    Do not reset because of one weak sample.
    Reset only after no valid finger signal for 2 seconds.
  */

  if (
    millis() - lastFingerMs >
    FINGER_LOST_TIMEOUT_MS
  )
  {
    if (sensorStatus != 2)
    {
      Serial.println(
        "Finger removed"
      );
    }

    sensorStatus = 2;

    resetHeartRate();
  }
}

// ==========================================================
// BLE PAYLOAD
// ==========================================================

String createBlePayload()
{
  /*
    Example:
    A:1,H:76,S:1,B:80

    A = armband alive
    H = BPM
    S = sensor status
    B = battery percentage
  */

  String payload = "A:1";

  payload += ",H:";
  payload += String(bpmValue);

  payload += ",S:";
  payload += String(sensorStatus);

  payload += ",B:";
  payload += String(batteryPercent);

  return payload;
}

void sendBleData()
{
  updateBattery();

  String payload =
    createBlePayload();

  dataCharacteristic->setValue(
    payload.c_str()
  );

  if (phoneConnected)
  {
    dataCharacteristic->notify();
  }

  Serial.print(
    "BLE data: "
  );

  Serial.print(payload);

  Serial.print(
    " Voltage: "
  );

  Serial.println(
    batteryVoltage,
    2
  );
}

// ==========================================================
// START BLE
// ==========================================================

void startBle()
{
  BLEDevice::init(
    BLE_DEVICE_NAME
  );

  bleServer =
    BLEDevice::createServer();

  bleServer->setCallbacks(
    new ArmbandServerCallbacks()
  );

  BLEService* service =
    bleServer->createService(
      SERVICE_UUID
    );

  dataCharacteristic =
    service->createCharacteristic(
      DATA_CHARACTERISTIC_UUID,

      BLECharacteristic::PROPERTY_READ |
      BLECharacteristic::PROPERTY_NOTIFY
    );

  dataCharacteristic->addDescriptor(
    new BLE2902()
  );

  dataCharacteristic->setValue(
    "A:1,H:0,S:0,B:0"
  );

  service->start();

  BLEAdvertising* advertising =
    BLEDevice::getAdvertising();

  advertising->addServiceUUID(
    SERVICE_UUID
  );

  advertising->setScanResponse(
    true
  );

  advertising->setMinPreferred(
    0x06
  );

  advertising->setMaxPreferred(
    0x12
  );

  advertising->start();

  Serial.println(
    "BLE advertising started"
  );
}

// ==========================================================
// SETUP
// ==========================================================

void setup()
{
  Serial.begin(115200);

  // ESP32-H2 uses native USB-CDC rather than a separate USB-serial chip.
  // After a reset, the USB connection has to re-enumerate on the host PC,
  // which can take noticeably longer than 500ms on Windows. Any prints
  // emitted before that finishes are silently lost - not buffered, just
  // gone - which is why boot messages (including the sensor detection
  // result) sometimes never show up in Serial Monitor even though the
  // board is running fine. This is a fixed delay, not a blocking wait for
  // Serial to connect, so the device still boots normally with no PC
  // attached at all during real field/climbing use.
  delay(3000);

  Serial.println();

  Serial.println(
    "CLIMBER ARMBAND STARTING"
  );

  pinMode(
    BAT_ADC_PIN,
    INPUT
  );

  analogReadResolution(12);

  analogSetPinAttenuation(
    BAT_ADC_PIN,
    ADC_11db
  );

  updateBattery();

  startMax30102();

  startBle();

  sendBleData();
}

// ==========================================================
// LOOP
// ==========================================================

void loop()
{
  processHeartRate();

  if (
    millis() - lastBleUpdateMs >=
    BLE_UPDATE_INTERVAL_MS
  )
  {
    lastBleUpdateMs = millis();

    sendBleData();
  }

  /*
    Fast output for Serial Plotter.
  */

  if (
    millis() - lastDebugMs >=
    DEBUG_INTERVAL_MS
  )
  {
    lastDebugMs = millis();

    Serial.print("IR:");
    Serial.print(currentIR);

    Serial.print(",BPM:");
    Serial.print(bpmValue);

    Serial.print(",S:");
    Serial.println(sensorStatus);
  }

  /*
    Restart advertising after disconnect.
  */

  if (
    !phoneConnected &&
    previousPhoneConnected
  )
  {
    delay(100);

    bleServer->startAdvertising();

    previousPhoneConnected = false;

    Serial.println(
      "Advertising restarted"
    );
  }

  if (
    phoneConnected &&
    !previousPhoneConnected
  )
  {
    previousPhoneConnected = true;
  }

  delay(1);
}