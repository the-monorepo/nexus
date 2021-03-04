#!/usr/bin/env bash
avrdude -p m328p -c arduino -P /dev/cu.usbserial-14110 -b 57600 -U flash:w:"target/avr-atmega328p/debug/particle-sensor-arduino.elf":e
