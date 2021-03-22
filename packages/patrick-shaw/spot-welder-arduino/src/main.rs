#![no_std]
#![no_main]
#![feature(abi_avr_interrupt)]
mod pulse_data;
use arduino_uno::{
    hal::port::portb::{PB2, PB5},
    pac::TC0,
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
use pulse_data::{PulseMilliThresholds, PulseData, RedundentReadStatus};
use core::{cell::RefCell, ops::DerefMut};
use panic_halt as _;

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

struct SpotWelderManager {
    spot_welder_io: Option<SpotWelderIO>,
    pulse_millis_thresholds: Option<PulseMilliThresholds>,
}

impl SpotWelderManager {
    const fn new() -> Self {
        SpotWelderManager {
            spot_welder_io: None,
            pulse_millis_thresholds: None,
        }
    }

    fn initialize(&mut self, ref tc0: TC0, spot_welder_io: SpotWelderIO) {
        const TIMER_COUNTS: u32 = 250;

        tc0.tccr0a.write(|w| w.wgm0().ctc());
        tc0.ocr0a.write(|w| unsafe { w.bits(TIMER_COUNTS as u8) });
        tc0.tccr0b.write(|w| w.cs0().prescale_64());
        tc0.timsk0.write(|w| w.ocie0a().set_bit());

        self.spot_welder_io = Some(spot_welder_io);

        unsafe { avr_device::interrupt::enable() };
    }

    fn execute(&mut self, pulse_data: PulseData) {
        let thresholds = PulseMilliThresholds::from(pulse_data);
        self.pulse_millis_thresholds = Some(thresholds);
    }

    fn interrupt(&mut self) {
        if let Some(ref mut threshold_data) = self.pulse_millis_thresholds {
            if let Some(ref mut spot_welder_io) = self.spot_welder_io {
                let current_millis = threshold_data.current_millis;

                threshold_data.current_millis -= 1;
                if current_millis == threshold_data.start_millis {
                    spot_welder_io.first_pulse_on();
                } else if current_millis == threshold_data.first_pulse_end_threshold {
                    spot_welder_io.first_pulse_off();
                } else if current_millis == threshold_data.second_pulse_start_threshold {
                    spot_welder_io.second_pulse_on();
                } else if current_millis == 1 {
                    spot_welder_io.second_pulse_off();
                }
            }
        }
    }
}

static SPOT_WELDER_MANAGER_MUTEX: Mutex<RefCell<SpotWelderManager>> =
    Mutex::new(RefCell::new(SpotWelderManager::new()));

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

    let tc0 = peripherals.TC0;
    avr_device::interrupt::free(move |cs| {
        SPOT_WELDER_MANAGER_MUTEX
            .borrow(cs)
            .borrow_mut()
            .deref_mut()
            .initialize(tc0, spot_welder_io);
    });

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
        avr_device::interrupt::free(|cs| {
            SPOT_WELDER_MANAGER_MUTEX
                .borrow(cs)
                .borrow_mut()
                .deref_mut()
                .execute(pulse_data);
        });

        serial.write_byte(0);
    }
}

#[avr_device::interrupt(atmega328p)]
fn TIMER0_COMPA() {
    avr_device::interrupt::free(|cs| {
        SPOT_WELDER_MANAGER_MUTEX
            .borrow(cs)
            .borrow_mut()
            .deref_mut()
            .interrupt();
    });
}
