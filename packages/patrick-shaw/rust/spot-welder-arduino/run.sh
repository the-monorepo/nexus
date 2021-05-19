#!/usr/bin/env bash
cargo build && avr-objcopy -O ihex ./target/avr-atmega328p/debug/spot-welder-arduino.elf ./release.hex
arduino-cli upload --input-file ./release.hex -p $(find /dev -maxdepth 1 -name "cu.usbserial*" ) --fqbn arduino:avr:uno
