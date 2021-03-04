#![no_std]
#![no_main]

// Pull in the panic handler from panic-halt
extern crate panic_halt;

use arduino_uno::prelude::*;

#[arduino_uno::entry]
fn main() -> ! {
  let peripherals = arduino_uno::Peripherals::take().unwrap();

  let mut pins = arduino_uno::Pins::new(
      peripherals.PORTB,
      peripherals.PORTC,
      peripherals.PORTD,
  );

  let mut led = pins.d13.into_output(&mut pins.ddr);

  loop {
    led.toggle().void_unwrap();
    arduino_uno::delay_ms(1000);
  }
}
