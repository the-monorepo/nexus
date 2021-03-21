#![no_std]
#![no_main]

use arduino_uno::prelude::*;
use arduino_uno::pwm;
use panic_halt as _;

fn read_u16<F, E>(mut read_byte: F) -> Result<u16, E>
where
    F: FnMut() -> Result<u8, E>,
{
    let small_byte = read_byte()? as u16;
    let large_byte = (read_byte()? as u16) << 8;
    return Ok(large_byte | small_byte);
}

struct U16Pair {
    value1: u16,
    value2: u16,
}

impl U16Pair {
    fn new(value1: u16, value2: u16) -> U16Pair {
        U16Pair { value1, value2 }
    }

    fn read<F, E>(mut read_byte: F) -> Result<U16Pair, E>
    where
        F: FnMut() -> Result<u8, E>,
    {
      Ok(U16Pair::new(
        read_u16(&mut read_byte)?,
          read_u16(&mut read_byte)?,
      ))
    }

    fn is_corrupted(&mut self) -> bool {
        self.value1 != self.value2
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
        9600.into_baudrate(),
    );

    let mut low_sound_timer = pwm::Timer2Pwm::new(peripherals.TC2, pwm::Prescaler::Prescale1024);
    let mut high_sound_timer = pwm::Timer1Pwm::new(peripherals.TC1, pwm::Prescaler::Prescale256);

    let mut low_sound = pins.d3.into_output(&mut pins.ddr).into_pwm(&mut low_sound_timer);
    let mut high_sound = pins.d10.into_output(&mut pins.ddr).into_pwm(&mut high_sound_timer);
    low_sound.set_duty(127);
    high_sound.set_duty(127);
    low_sound.disable();
    high_sound.disable();

    let mut welder = pins.d13.into_output(&mut pins.ddr);
    welder.set_low().void_unwrap();

    //let mut sound = pins.d9.into_output(&mut pins.ddr);
    loop {
        let mut first_pulse_duration = U16Pair::read(|| Ok(serial.read_byte())).void_unwrap();
        let mut pulse_gap_duration = U16Pair::read(|| Ok(serial.read_byte())).void_unwrap();
        let mut second_pulse_duration = U16Pair::read(|| Ok(serial.read_byte())).void_unwrap();

        // Just wanna make sure it doens't turn on if something weird happens (like a freak short or something?) dunno if it's really necessary
        if first_pulse_duration.is_corrupted()
            || pulse_gap_duration.is_corrupted()
            || second_pulse_duration.is_corrupted()
        {
          serial.write_byte(1);
            continue;
        }

        if first_pulse_duration.value1 > 300 {
          serial.write_byte(2);
            continue;
        }

        if pulse_gap_duration.value1 > 20000 {
          serial.write_byte(3);
            continue;
        }

        if second_pulse_duration.value1 > 300 {
          serial.write_byte(4);
            continue;
        }

        low_sound.enable();
        welder.set_high().void_unwrap();
        arduino_uno::delay_ms(first_pulse_duration.value1);

        welder.set_low().void_unwrap();
        low_sound.disable();
        arduino_uno::delay_ms(pulse_gap_duration.value1);

        high_sound.enable();
        welder.set_high().void_unwrap();
        arduino_uno::delay_ms(second_pulse_duration.value1);

        welder.set_low().void_unwrap();
        high_sound.disable();

        serial.write_byte(0);
    }
}
