#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Kommunikationsvariablen
String        ssid      = "";
String        password  = "";
char*         host      = "lateralus.dlinkddns.com";
const int     httpPort  = 80;
const String  restUrl   = "/rest";
String        devId     = "Balkon";
unsigned long intervallSec = 3600; //1500;

#define ONE_WIRE_BUS 2  // DS18B20 pin
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature DS18B20(&oneWire);

MDNSResponder mdns;
ESP8266WebServer server(80);

void wifiConnect() {
  char _ssid[ssid.length() + 1];
  char _password[password.length() + 1];
  ssid.toCharArray(_ssid, ssid.length() + 1);
  password.toCharArray(_password, password.length() + 1);
  WiFi.mode(WIFI_STA);
  WiFi.begin(_ssid, _password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }  
  setupInput();
}

void setup(void) {  
  wifiConnect();  
}

void setupInput(void) {
  pinMode(1, OUTPUT);
  pinMode(3, OUTPUT);
  digitalWrite(1, LOW);
  digitalWrite(3, LOW);
}

void sendData(String key, String value) {
  WiFiClient client;
  if (!client.connect(host, httpPort)) {
    return;
  }

  String post = "{\"device_id\": \"";
  post += devId;
  post += "\", \"key\": \"";
  post += key;
  post += "\", \"value\": \"";
  post += value;
  post += "\"}";

  // This will send the request to the server
  client.print("POST " + restUrl + "/" + devId + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Connection: close\r\n"+
               "Content-Type: application/json;charset=utf-8\r\n"+
               "Content-Length: "+post.length()+"\r\n"+
               "\r\n"+
               post + "\r\n");
  delay(100);

  // Read all the lines of the reply from server
  while (client.available()) {
    String line = client.readStringUntil('\r');
  }
}

void loop(void) {
  float temp;
  sendData("awake", "1"); 
  for (int i =0; i < 5; i++) {
    digitalWrite(1, LOW);  
    delay(100);
    digitalWrite(1, HIGH);  
    delay(100);
  }
     
  do {
    digitalWrite(3, HIGH);
    DS18B20.requestTemperatures();
    temp = DS18B20.getTempCByIndex(0);
    server.handleClient();    
  } while (temp == 85.0 || temp == (-127.0));
  digitalWrite(3, LOW);

  sendData("sensor_temp_degC", String(temp));
  sendData("awake", "0");  
  
  for (int i =0; i < 10; i++) {
    digitalWrite(1, LOW);  
    delay(50);
    digitalWrite(1, HIGH);  
    delay(50);
  }
  
  ESP.deepSleep(intervallSec * 1000000, WAKE_RF_DEFAULT);
  delay(1000);
}
