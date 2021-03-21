#![no_std]
#![no_main]

use arduino_uno::prelude::*;
use panic_halt as _;

fn read_u16<F>(mut read_byte: F) -> u16 where F: FnMut() -> u8
{
    let part1 = read_byte() as u16;
    let part2 = (read_byte() as u16) << 8;
    return part1 | part2;
}

struct U16Pair {
    value1: u16,
    value2: u16,
}

impl U16Pair {
    fn new(value1: u16, value2: u16) -> U16Pair {
      U16Pair { value1, value2 }
    }

    fn read<F>(mut read_byte: F) -> U16Pair where F: FnMut() -> u8 {
      U16Pair::new(read_u16(&mut read_byte), read_u16(&mut read_byte))
    }

    fn is_corrupted(&mut self) -> bool {
      self.value1 == self.value2
    }
}

#[arduino_uno::entry]
fn main() -> ! {
    let peripherals = arduino_uno::Peripherals::take().unwrap();

    let mut pins = arduino_uno::Pins::new(peripherals.PORTB, peripherals.PORTC, peripherals.PORTD);

    let mut serial = arduino_uno::Serial::new(
        peripherals.USART0,
        pins.d0,
        pins.d1.into_output(&mut pins.ddr),
        57600.into_baudrate(),
    );

    let mut led = pins.d13.into_output(&mut pins.ddr);
    led.set_low().void_unwrap();

    //let mut sound = pins.d9.into_output(&mut pins.ddr);
    loop {
      led.set_low();
        let mut first_pulse_duration = U16Pair::read(|| serial.read_byte());
        let mut pulse_gap_duration = U16Pair::read(|| serial.read_byte());
        let mut second_pulse_duration = U16Pair::read(|| serial.read_byte());

        // Just wanna make sure it doens't turn on if something weird happens (like a freak short or something?) dunno if it's really necessary
        if first_pulse_duration.is_corrupted()
            || pulse_gap_duration.is_corrupted()
            || second_pulse_duration.is_corrupted()
        {
          serial.write_byte(1);
          continue;
        }

        led.set_high().void_unwrap();
        arduino_uno::delay_ms(first_pulse_duration.value1);
        led.set_low().void_unwrap();
        arduino_uno::delay_ms(pulse_gap_duration.value1);
        led.set_high().void_unwrap();
        arduino_uno::delay_ms(second_pulse_duration.value1);
        serial.write_byte(0);
    }
}
