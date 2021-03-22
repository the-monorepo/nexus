#![no_std]
#![no_main]
#![feature(abi_avr_interrupt)]
use arduino_uno::{
    hal::port::portb::{PB2, PB5},
    pwm::{self, Timer1Pwm},
};
use arduino_uno::{
    hal::port::{
        mode::{Output, Pwm},
        portd::PD3,
    },
    prelude::*,
    pwm::Timer2Pwm,
};
use avr_device::interrupt::Mutex;
use core::{cell::{RefCell}, ops::{DerefMut}};
use panic_halt as _;

struct PulseData {
    first_pulse_duration: u16,
    pulse_gap_duration: u16,
    second_pulse_duration: u16,
}

enum RedundentReadStatus<R> {
  Success(R),
  Corrupt,
}
impl PulseData {
    fn read<F>(mut read_byte: F) -> RedundentReadStatus<PulseData>
    where
        F: FnMut() -> u8,
    {
      if let (
        RedundentReadStatus::Success(first_pulse_duration),
        RedundentReadStatus::Success(pulse_gap_duration),
        RedundentReadStatus::Success(second_pulse_duration)
      ) = (redundent_read_u16(&mut read_byte), redundent_read_u16(&mut read_byte), redundent_read_u16(&mut read_byte)) {
        RedundentReadStatus::Success(PulseData {
          first_pulse_duration,
          pulse_gap_duration,
          second_pulse_duration,
        })
      } else {
        RedundentReadStatus::Corrupt
      }
    }
}

struct PulseMilliThresholds {
    start_millis: u16,
    current_millis: u16,
    first_pulse_end_threshold: u16,
    second_pulse_start_threshold: u16,
}

impl From<PulseData> for PulseMilliThresholds {
    fn from(data: PulseData) -> Self {
        let second_pulse_start_threshold = data.second_pulse_duration;
        let first_pulse_end_threshold = second_pulse_start_threshold + data.pulse_gap_duration;
        let start_millis = first_pulse_end_threshold + data.first_pulse_duration;
        let current_millis = start_millis;

        PulseMilliThresholds {
            start_millis,
            second_pulse_start_threshold,
            first_pulse_end_threshold,
            current_millis,
        }
    }
}

struct SpotWelderIO {
    low_sound: PD3<Pwm<Timer2Pwm>>,
    high_sound: PB2<Pwm<Timer1Pwm>>,
    spot_welder: PB5<Output>,
}

impl SpotWelderIO {
    fn initialise(
        mut low_sound: PD3<Pwm<Timer2Pwm>>,
        mut high_sound: PB2<Pwm<Timer1Pwm>>,
        mut spot_welder: PB5<Output>,
    ) -> Self {
        low_sound.set_duty(127);
        high_sound.set_duty(127);
        low_sound.disable();
        high_sound.disable();
        spot_welder.set_low().void_unwrap();

        SpotWelderIO {
            low_sound,
            high_sound,
            spot_welder,
        }
    }

    fn first_pulse_on(&mut self) {
        self.spot_welder.set_high().void_unwrap();
        self.low_sound.enable();
    }

    fn first_pulse_off(&mut self) {
        self.spot_welder.set_low().void_unwrap();
        self.low_sound.disable();
    }

    fn second_pulse_on(&mut self) {
        self.spot_welder.set_high().void_unwrap();
        self.high_sound.enable();
    }

    fn second_pulse_off(&mut self) {
        self.spot_welder.set_low().void_unwrap();
        self.high_sound.disable();
    }
}

struct SpotWeldInterruptData {
    spot_welder_io_cell: RefCell<Option<SpotWelderIO>>,
    pulse_millis_thresholds_cell: RefCell<Option<PulseMilliThresholds>>,
}
static SPOT_WELDER_MUTEX: Mutex<SpotWeldInterruptData> = Mutex::new(SpotWeldInterruptData {
    spot_welder_io_cell: RefCell::new(None),
    pulse_millis_thresholds_cell: RefCell::new(None),
});

const TIMER_COUNTS: u32 = 250;

fn read_u16<F>(mut read_byte: F) -> u16
where
    F: FnMut() -> u8,
{
    let small_byte = read_byte() as u16;
    let large_byte = (read_byte() as u16) << 8;
    return large_byte | small_byte;
}

fn redundent_read_u16<F>(mut read_byte: F) -> RedundentReadStatus<u16>
where
    F: FnMut() -> u8,
{
  let value1 = read_u16(&mut read_byte);
  let value2 = read_u16(&mut read_byte);
  if value1 == value2 {
    RedundentReadStatus::Success(value1)
  } else {
    RedundentReadStatus::Corrupt
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

    let low_sound = pins
        .d3
        .into_output(&mut pins.ddr)
        .into_pwm(&mut low_sound_timer);
    let high_sound = pins
        .d10
        .into_output(&mut pins.ddr)
        .into_pwm(&mut high_sound_timer);

    let spot_welder = pins.d13.into_output(&mut pins.ddr);

    let spot_welder_io = SpotWelderIO::initialise(low_sound, high_sound, spot_welder);

    avr_device::interrupt::free(|cs| {
        SPOT_WELDER_MUTEX.borrow(cs).spot_welder_io_cell.replace(Some(spot_welder_io));
    });

    peripherals.TC0.tccr0a.write(|w| w.wgm0().ctc());
    peripherals
        .TC0
        .ocr0a
        .write(|w| unsafe { w.bits(TIMER_COUNTS as u8) });
    peripherals.TC0.tccr0b.write(|w| w.cs0().prescale_64());
    peripherals.TC0.timsk0.write(|w| w.ocie0a().set_bit());

    unsafe { avr_device::interrupt::enable() };

    loop {
        let pulse_data_response = PulseData::read(|| serial.read_byte());
        let pulse_data = match pulse_data_response {
          RedundentReadStatus::Success(pulse_data) => pulse_data,
          _ => {
            serial.write_byte(1);
            continue;
          }
        };

        if pulse_data.first_pulse_duration > 300 {
            serial.write_byte(2);
            continue;
        }

        if pulse_data.pulse_gap_duration > 20000 {
            serial.write_byte(3);
            continue;
        }

        if pulse_data.second_pulse_duration > 300 {
            serial.write_byte(4);
            continue;
        }

        let thresholds = PulseMilliThresholds::from(pulse_data);
        avr_device::interrupt::free(|cs| {
          SPOT_WELDER_MUTEX.borrow(cs)
            .pulse_millis_thresholds_cell
            .replace(Some(thresholds));
        });
        serial.write_byte(0);
    }
}

#[avr_device::interrupt(atmega328p)]
fn TIMER0_COMPA() {
    avr_device::interrupt::free(|cs| {
        let mutex_data = SPOT_WELDER_MUTEX.borrow(cs);

        if let Some(ref mut threshold_data) = mutex_data.pulse_millis_thresholds_cell.borrow_mut().deref_mut() {
            if let Some(ref mut spot_welder_io) = mutex_data.spot_welder_io_cell.borrow_mut().deref_mut() {
                if threshold_data.current_millis > 0 {
                    match threshold_data.current_millis {
                        millis if millis == threshold_data.start_millis => {
                            spot_welder_io.first_pulse_on()
                        }
                        millis if millis == threshold_data.first_pulse_end_threshold => {
                            spot_welder_io.first_pulse_off()
                        }
                        millis if millis == threshold_data.second_pulse_start_threshold => {
                            spot_welder_io.second_pulse_on()
                        }
                        millis if millis == 1 => spot_welder_io.second_pulse_off(),
                        _ => (),
                    };

                    threshold_data.current_millis -= 1;
                }
            }
        }
    });
}
