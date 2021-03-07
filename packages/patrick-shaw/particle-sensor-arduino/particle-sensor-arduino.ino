#include <PMS.h>
#include <SoftwareSerial.h>

SoftwareSerial pmsSerial(5, 3); // RX, TX

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
  pms.wakeUp();
  delay(30000);

  pms.requestRead();
  if (pms.readUntil(data))
  {
    uint8_t dataToUpload[] = {
      static_cast<uint8_t>(data.PM_SP_UG_1_0 & 0x00FF),
      static_cast<uint8_t>((data.PM_SP_UG_1_0 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_SP_UG_2_5 & 0x00FF),
      static_cast<uint8_t>((data.PM_SP_UG_2_5 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_SP_UG_10_0 & 0x00FF),
      static_cast<uint8_t>((data.PM_SP_UG_10_0 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_AE_UG_1_0 & 0x00FF),
      static_cast<uint8_t>((data.PM_AE_UG_1_0 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_SP_UG_1_0 & 0x00FF),
      static_cast<uint8_t>((data.PM_SP_UG_1_0 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_AE_UG_2_5 & 0x00FF),
      static_cast<uint8_t>((data.PM_AE_UG_2_5 & 0xFF00) >> 8),

      static_cast<uint8_t>(data.PM_AE_UG_10_0 & 0x00FF),
      static_cast<uint8_t>((data.PM_AE_UG_10_0 & 0xFF00) >> 8),
    };

    Serial.write(dataToUpload, 12);
  }
  pms.sleep();
  delay(120000);
}
