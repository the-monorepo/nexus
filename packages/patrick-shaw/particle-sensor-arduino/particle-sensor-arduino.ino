#include "PMS.h"
#include "SoftwareSerial.h"

SoftwareSerial pmsSerial(2, 3); // RX, TX

PMS pms(pmsSerial);
PMS::DATA data;

void setup()
{
  pmsSerial.begin(9600);
  Serial.begin(9600);
  pms.passiveMode();
}

void loop()
{
  Serial.println("Waking up, wait 30 seconds for stable readings...");
  pms.wakeUp();
  delay(30000);

  Serial.println("Send read request...");
  pms.requestRead();

  Serial.println("Reading data...");
  if (pms.readUntil(data))
  {
    Serial.print("PM 1.0 (ug/m3): ");
    Serial.println(data.PM_AE_UG_1_0);

    Serial.print("PM 2.5 (ug/m3): ");
    Serial.println(data.PM_AE_UG_2_5);

    Serial.print("PM 10.0 (ug/m3): ");
    Serial.println(data.PM_AE_UG_10_0);
  }
  else
  {
    Serial.println("No data.");
  }

  Serial.println("Going to sleep for 60 seconds.");
  pms.sleep();
  delay(60000);
}
