#![no_std]
#![no_main]

use arduino_mega2560::prelude::*;
use arduino_mega2560::{
    hal::port::{
        mode::{Analog, Pwm},
        portb::PB7,
        portf::PF0,
    },
    pwm::Timer0Pwm,
};
use embedded_hal::PwmPin;
use panic_halt as _;

const READING_MAX_VOLTAGE: f64 = 5.0;
const BATTERY_MAX_VOLTAGE: f64 = 3.6;
const UNDERVOLT_FACTOR: f64 = 0.01; // Go slightly under the rating just in case

fn to_charging_duty(
    charge_voltage: f64,
    desired_voltage: f64,
    current_voltage: f64,
    max_amperage: f64,
    max_duty: u8,
) -> u8 {
    if desired_voltage <= current_voltage {
        return 0;
    } else {
        let voltage_delta = charge_voltage - current_voltage;

        let resistance = 1f64;

        let percent_power = charge_voltage * (max_amperage * resistance) / (voltage_delta);

        let duty: u8 = ((max_duty as f64) * percent_power) as u8;

        return duty;
    }
}

fn analog_to_voltage(analog_value: u16, max_analog_value: u16, max_voltage_read: f64) -> f64 {
    return (analog_value as f64 / max_analog_value as f64) * max_voltage_read;
}

fn calculate_charging_duty(voltage_analog_value: u16) -> u8 {
  let current_voltage = analog_to_voltage(voltage_analog_value, 1023, 5.0);

  let lifepo4_max_voltage = 3.6;
  let max_capacity_threshold = 0.99;
  let lifepo4_desired_voltage = lifepo4_max_voltage * max_capacity_threshold;

  let charging_duty = to_charging_duty(
      5.0,
      lifepo4_desired_voltage,
      current_voltage,
      0.15,
      255,
  );

  return charging_duty;
}


//#[cfg(target_arch = "avr")]
#[arduino_mega2560::entry]
fn main() -> ! {
    let dp = arduino_mega2560::Peripherals::take().unwrap();

    let mut pins = arduino_mega2560::Pins::new(
        dp.PORTA, dp.PORTB, dp.PORTC, dp.PORTD, dp.PORTE, dp.PORTF, dp.PORTG, dp.PORTH, dp.PORTJ,
        dp.PORTK, dp.PORTL,
    );

    let mut timer0 =
        arduino_mega2560::pwm::Timer0Pwm::new(dp.TC0, arduino_mega2560::pwm::Prescaler::Prescale64);
    let mut battery_charger_pin = pins.d13.into_output(&mut pins.ddr).into_pwm(&mut timer0);

    let mut adc = arduino_mega2560::adc::Adc::new(dp.ADC, Default::default());
    let mut battery_voltage_pin = pins.a0.into_analog_input(&mut adc);

    loop {
        let voltage_analog_value: u16 =
            nb::block!(adc.read(&mut battery_voltage_pin)).void_unwrap();

        let charging_duty = calculate_charging_duty(voltage_analog_value);

        battery_charger_pin.set_duty(charging_duty);
    }
}

#[cfg(not(target_arch = "avr"))]
fn main() -> ! {
    panic!("This app is only designed to be run on AVR devices!");
}
