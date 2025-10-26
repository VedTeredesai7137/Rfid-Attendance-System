#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <time.h>

// -------------------- Wi-Fi Configuration --------------------
const char* ssid = "Ved_S24_FE";
const char* password = "vedteredesai098";

// Server URLs
const char* devServerUrl = "http://10.63.73.123:3000";
const char* prodServerUrl = "https://rfid-attendance-system-flax.vercel.app";
const bool USE_PRODUCTION = true;
const char* baseUrl = USE_PRODUCTION ? prodServerUrl : devServerUrl;

const char* apiKey = "supersecret123";

// -------------------- RC522 Pin Mapping for ESP32 --------------------
#define SS_PIN   21
#define RST_PIN  22
#define SCK_PIN  18
#define MOSI_PIN 23
#define MISO_PIN 19
#define LED_PIN  2

// ✅ Create MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

// -------------------- Global Variables --------------------
unsigned long lastActiveClassFetch = 0;
const unsigned long activeClassFetchInterval = 5000;

unsigned long lastWiFiCheck = 0;
const unsigned long wifiCheckInterval = 10000;

unsigned long lastRC522Check = 0;
const unsigned long rc522CheckInterval = 15000;

unsigned long lastTeacherFetch = 0;
const unsigned long teacherFetchInterval = 10000;

String lastUid = "";
unsigned long lastSentAt = 0;
const unsigned long dedupeMs = 2500;

String currentSubject = "";
String currentTimeSlot = "";
String currentDate = "";
String currentTeacherId = "";
String currentTeacherName = "";
bool hasActiveClass = false;

// -------------------- Function Declarations --------------------
void connectWiFi();
void initializeNTP();
String getCurrentTimestamp();
void fetchCurrentTeacher();
void fetchActiveClass();
void sendAttendance(String uid);
void checkWiFiConnection();
void checkRC522Health();
void haltCard();
String formatUID();
String getCurrentDate();

// -------------------- SETUP --------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n==========================================");
  Serial.println("   ESP32 + RC522 Attendance System");
  Serial.println("   🔄 MULTI-TEACHER SUPPORT ENABLED");
  Serial.println(USE_PRODUCTION ? "   🔒 PRODUCTION MODE (HTTPS)" : "   🧪 DEVELOPMENT MODE (HTTP)");
  Serial.println("==========================================");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN);
  mfrc522.PCD_Init();
  delay(100);

  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("❌ RC522 initialization failed - check wiring!");
    while (true);
  } else {
    Serial.println("✅ RC522 initialized (Version: 0x" + String(version, HEX) + ")");
  }

  connectWiFi();
  initializeNTP();
  fetchCurrentTeacher();

  Serial.println("📋 Ready! Scan RFID card...");
}

// -------------------- LOOP --------------------
void loop() {
  unsigned long now = millis();

  if (now - lastWiFiCheck >= wifiCheckInterval) {
    lastWiFiCheck = now;
    checkWiFiConnection();
  }

  if (now - lastRC522Check >= rc522CheckInterval) {
    lastRC522Check = now;
    checkRC522Health();
  }

  if (now - lastTeacherFetch >= teacherFetchInterval) {
    lastTeacherFetch = now;
    fetchCurrentTeacher();
  }

  if (now - lastActiveClassFetch >= activeClassFetchInterval) {
    lastActiveClassFetch = now;
    if (currentTeacherId != "") {
      fetchActiveClass();
    }
  }

  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial())
    return;

  String uidStr = formatUID();
  Serial.println("\n🎉 Card detected: " + uidStr);

  if (uidStr == lastUid && (millis() - lastSentAt) < dedupeMs) {
    Serial.println("⏳ Duplicate scan ignored");
    haltCard();
    delay(200);
    return;
  }

  sendAttendance(uidStr);
  haltCard();
  delay(200);
}

// -------------------- HELPER FUNCTIONS --------------------
void connectWiFi() {
  Serial.print("📶 Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempt = 0;
  while (WiFi.status() != WL_CONNECTED && attempt < 20) {
    delay(500);
    Serial.print(".");
    attempt++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to Wi-Fi");
    Serial.println("🌐 IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ Wi-Fi connection failed");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Reconnecting Wi-Fi...");
    WiFi.reconnect();
  }
}

void initializeNTP() {
  configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("⏱️ NTP initialized");
}

String getCurrentTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown";
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buffer);
}

String getCurrentDate() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "unknown";
  char buffer[11];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
  return String(buffer);
}

void checkRC522Health() {
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (version == 0x00 || version == 0xFF)
    Serial.println("⚠️ RC522 not responding");
}

void haltCard() {
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

String formatUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// -------------------- FETCH CURRENT TEACHER --------------------
void fetchCurrentTeacher() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Wi-Fi disconnected, skipping teacher fetch");
    return;
  }

  HTTPClient http;
  String url = String(baseUrl) + "/api/currentTeacher";
  Serial.println("👨‍🏫 Fetching current teacher: " + url);

  http.begin(url);
  http.addHeader("x-api-key", apiKey);

  int code = http.GET();
  if (code == 200) {
    String res = http.getString();
    Serial.println("📥 Response: " + res);

    // Check if response is empty or not JSON
    if (res.length() == 0 || res.indexOf("{") == -1) {
      Serial.println("❌ Invalid response format");
      currentTeacherId = "";
      currentTeacherName = "";
      http.end();
      return;
    }

    DynamicJsonDocument doc(1024);
    DeserializationError err = deserializeJson(doc, res);

    if (err) {
      Serial.println("❌ JSON error: " + String(err.c_str()));
      currentTeacherId = "";
      currentTeacherName = "";
      http.end();
      return;
    }

    // Check if the response contains the expected fields
    if (!doc.containsKey("teacherId") || !doc.containsKey("teacherName")) {
      Serial.println("❌ Missing required teacher fields in response");
      currentTeacherId = "";
      currentTeacherName = "";
      http.end();
      return;
    }

    currentTeacherId = doc["teacherId"].as<String>();
    currentTeacherName = doc["teacherName"].as<String>();

    if (currentTeacherId != "") {
      Serial.println("✅ Found teacher: " + currentTeacherId + " / " + doc["teacherEmail"].as<String>());
      
      // Fetch active class for this teacher
      fetchActiveClass();
    } else {
      Serial.println("⚠️ No active teacher found");
      hasActiveClass = false;
    }
  } else if (code == 404) {
    Serial.println("ℹ️ No active teacher found (404)");
    currentTeacherId = "";
    currentTeacherName = "";
    hasActiveClass = false;
  } else {
    Serial.println("❌ HTTP Error: " + String(code));
    currentTeacherId = "";
    currentTeacherName = "";
    hasActiveClass = false;
  }
  http.end();
}

// -------------------- FETCH ACTIVE CLASS --------------------
void fetchActiveClass() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Wi-Fi disconnected, skipping fetch");
    return;
  }

  if (currentTeacherId == "") {
    Serial.println("⚠️ No active teacher - skipping class fetch");
    hasActiveClass = false;
    return;
  }

  String today = getCurrentDate();
  
  HTTPClient http;
  String url = String(baseUrl) + "/api/activeClass?teacherId=" + currentTeacherId + "&date=" + today;
  Serial.println("📡 Fetching active class for teacherId+date: " + url);

  http.begin(url);
  http.addHeader("x-api-key", apiKey);

  int code = http.GET();
  if (code == 200) {
    String res = http.getString();
    Serial.println("📥 Response: " + res);

    // Check if response is empty or not JSON
    if (res.length() == 0 || res.indexOf("{") == -1) {
      Serial.println("❌ Invalid response format");
      hasActiveClass = false;
      http.end();
      return;
    }

    DynamicJsonDocument doc(2048);
    DeserializationError err = deserializeJson(doc, res);

    if (err) {
      Serial.println("❌ JSON error: " + String(err.c_str()));
      hasActiveClass = false;
      http.end();
      return;
    }

    // Check if the response contains the expected fields
    if (!doc.containsKey("subject") || !doc.containsKey("timeSlot") || !doc.containsKey("date")) {
      Serial.println("❌ Missing required fields in response");
      hasActiveClass = false;
      http.end();
      return;
    }

    currentSubject = doc["subject"].as<String>();
    currentTimeSlot = doc["timeSlot"].as<String>();
    currentDate = doc["date"].as<String>();

    hasActiveClass = (currentSubject != "" && currentDate != "");
    if (hasActiveClass) {
      Serial.println("✅ Active class loaded: " + currentSubject + " " + currentTimeSlot);
    } else {
      Serial.println("⚠️ No active class for today");
    }
  } else if (code == 404) {
    Serial.println("ℹ️ No active session found (404)");
    hasActiveClass = false;
  } else {
    Serial.println("❌ HTTP Error: " + String(code));
    hasActiveClass = false;
  }
  http.end();
}

// -------------------- SEND ATTENDANCE --------------------
void sendAttendance(String uid) {
  if (!hasActiveClass) {
    Serial.println("⚠️ No active class - skipping attendance");
    return;
  }

  if (currentTeacherId == "") {
    Serial.println("⚠️ No active teacher - skipping attendance");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Wi-Fi disconnected");
    return;
  }

  HTTPClient http;
  String url = String(baseUrl) + "/api/attendance/mark";
  Serial.println("📤 Posting attendance: " + url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  DynamicJsonDocument doc(512);
  doc["cardId"] = uid;
  doc["teacherId"] = currentTeacherId;
  doc["subject"] = currentSubject;
  doc["timeSlot"] = currentTimeSlot;
  doc["date"] = currentDate;
  doc["timestamp"] = getCurrentTimestamp();

  String payload;
  serializeJson(doc, payload);
  Serial.println("📦 Payload: " + payload);

  int code = http.POST(payload);
  if (code == 200 || code == 201) {
    String res = http.getString();
    Serial.println("✅ Response: " + res);
    
    // Blink LED to indicate success
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
  } else if (code == 404) {
    Serial.println("⚠️ API endpoint not found (404)");
  } else {
    Serial.println("❌ HTTP Error: " + String(code));
    Serial.println("   Response: " + http.getString());
  }
  http.end();
  lastUid = uid;
  lastSentAt = millis();
}