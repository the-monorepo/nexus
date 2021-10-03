#![no_std]
#![no_main]

use panic_halt as _;

const READING_MAX_VOLTAGE: f64 = 5.0;
const MAX_ANALOG_VALUE: f64 = 1023.0;
const BATTERY_MAX_VOLTAGE: f64 = 3.6;
const UNDERVOLT_FACTOR: f64 = 0.01; // Go slightly under the rating just in case
const BATTERY_MAX_ANALOG_VALUE: u16 = ((1.0 - UNDERVOLT_FACTOR) * MAX_ANALOG_VALUE * (BATTERY_MAX_VOLTAGE / READING_MAX_VOLTAGE)) as u16;

//#[cfg(target_arch = "avr")]
#[arduino_hal::entry]
fn main() -> ! {
    let dp = arduino_hal::Peripherals::take().unwrap();

    let mut pins = arduino_hal::pins!(dp);

    //let mut serial = arduino_hal::default_serial!(dp, pins, 9600);
    let mut adc = arduino_hal::Adc::new(dp.ADC, Default::default());
    let analog_voltage_reading = pins.a0.into_analog_input(&mut adc);


    loop {
    }
}

#[cfg(not(target_arch = "avr"))]
fn main() -> ! {
  panic!("This app is only designed to be run on AVR devices!");
}
