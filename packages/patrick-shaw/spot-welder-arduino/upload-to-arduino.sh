#!/usr/bin/env bash
cargo build
mkdir release
avr-objcopy -O ihex ./target/avr-atmega328p/debug/spot-welder-arduino.elf ./release/arduino.hex
arduino-cli upload --input-file ./release/arduino.hex -p /dev/cu.usbserial-14310 --fqbn arduino:avr:uno
