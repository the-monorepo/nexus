#!/usr/bin/env bash
avrdude -p atmega328p -c arduino -P /dev/cu.usbserial-14210 -b 115200 -D -U flash:w:"target/avr-atmega328p/debug/particle-sensor-arduino.elf":e
