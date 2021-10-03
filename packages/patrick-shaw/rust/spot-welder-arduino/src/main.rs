#![no_std]
#![no_main]
#![feature(abi_avr_interrupt)]
mod pulse_data;
use arduino_uno::{
    hal::port::{
        mode::{Output, Pwm},
        portd::PD3,
        Pin,
    },
    prelude::*,
    pwm::Timer2Pwm,
};
use arduino_uno::{
    hal::{
        clock::MHz16,
        port::{
            mode::{Floating, Input},
            portb::PB2,
            portd::{PD0, PD1},
        },
        usart::{Usart, UsartOps},
    },
    pac::USART0,
    pwm::{self, Timer1Pwm},
};
use avr_device::interrupt::Mutex;
use core::cell::RefCell;
use panic_halt as _;
use pulse_data::{PulseData, PulseMilliThresholds, RedundentReadStatus};

struct SpotWelderIO {
    low_sound: PD3<Pwm<Timer2Pwm>>,
    high_sound: PB2<Pwm<Timer1Pwm>>,
    spot_welder: Pin<Output>,
}

impl SpotWelderIO {
    fn new(
        mut low_sound: PD3<Pwm<Timer2Pwm>>,
        mut high_sound: PB2<Pwm<Timer1Pwm>>,
        mut spot_welder: Pin<Output>,
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

struct SpotWelderManagerState {
    pulse_millis_thresholds: PulseMilliThresholds,
    current_millis: u16,
}

impl SpotWelderManagerState {
    const fn from(pulse_millis_thresholds: PulseMilliThresholds) -> SpotWelderManagerState {
        return SpotWelderManagerState {
            current_millis: pulse_millis_thresholds.start_millis,
            pulse_millis_thresholds,
        };
    }
}

struct SpotWelderManager<USART: UsartOps<RX, TX>, RX, TX, CLOCK> {
    serial: Usart<USART, RX, TX, CLOCK>,
    spot_welder_io: SpotWelderIO,
    state: Option<SpotWelderManagerState>,
}

impl<USART: UsartOps<RX, TX>, RX, TX, CLOCK> SpotWelderManager<USART, RX, TX, CLOCK> {
    const fn new(spot_welder_io: SpotWelderIO, serial: Usart<USART, RX, TX, CLOCK>) -> Self {
        SpotWelderManager {
            serial,
            spot_welder_io,
            state: None,
        }
    }

    fn execute(&mut self, pulse_data: PulseData) {
        self.state = Some(SpotWelderManagerState::from(PulseMilliThresholds::from(
            pulse_data,
        )));
    }

    fn wait_till_successful_read_then_execute(&mut self) {
        loop {
            let pulse_data_response = PulseData::read(|| self.serial.read_byte());
            let pulse_data = match pulse_data_response {
                RedundentReadStatus::Success(pulse_data) => pulse_data,
                _ => {
                    self.serial.write_byte(1);
                    continue;
                }
            };

            if pulse_data.first_pulse_duration > 300 {
                self.serial.write_byte(2);
                continue;
            }

            if pulse_data.pulse_gap_duration > 20000 {
                self.serial.write_byte(3);
                continue;
            }

            if pulse_data.second_pulse_duration > 300 {
                self.serial.write_byte(4);
                continue;
            }

            self.execute(pulse_data);
            break;
        }
    }

    fn interrupt(&mut self) {
        if let Some(ref mut state_data) = self.state {
            if state_data.current_millis == 0 {
                self.spot_welder_io.second_pulse_off();
                self.serial.write_byte(0);
                self.state = None;
            } else {
                if state_data.current_millis == state_data.pulse_millis_thresholds.start_millis {
                    self.spot_welder_io.first_pulse_on();
                } else if state_data.current_millis
                    == state_data.pulse_millis_thresholds.first_pulse_end_threshold
                {
                    self.spot_welder_io.first_pulse_off();
                } else if state_data.current_millis
                    == state_data
                        .pulse_millis_thresholds
                        .second_pulse_start_threshold
                {
                    self.spot_welder_io.second_pulse_on();
                }
                state_data.current_millis -= 1;
            }
        } else {
            self.wait_till_successful_read_then_execute();
        }
    }
}

#[cfg(not(target_arch = "avr"))]
fn main() -> ! {
  panic!("This app is only designed to be run on AVR devices!");
}

#[cfg(target_arch = "avr")]
#[arduino_uno::entry]
fn main() -> ! {
    let peripherals = arduino_uno::Peripherals::take().unwrap();

    let mut pins = arduino_uno::Pins::new(peripherals.PORTB, peripherals.PORTC, peripherals.PORTD);
    let serial = arduino_uno::Serial::new(
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

    let spot_welder_io = SpotWelderIO::new(low_sound, high_sound, spot_welder.downgrade());

    let spot_welder_manager = SpotWelderManager::new(spot_welder_io, serial);

    static SPOT_WELDER_MANAGER_MUTEX: Mutex<
        RefCell<Option<SpotWelderManager<USART0, PD0<Input<Floating>>, PD1<Output>, MHz16>>>,
    > = Mutex::new(RefCell::new(None));

    avr_device::interrupt::free(|cs| {
        SPOT_WELDER_MANAGER_MUTEX
            .borrow(cs)
            .borrow_mut()
            .replace(spot_welder_manager)
    });

    #[avr_device::interrupt(atmega328p)]
    fn TIMER0_COMPA() {
        avr_device::interrupt::free(|cs| {
            SPOT_WELDER_MANAGER_MUTEX
                .borrow(cs)
                .borrow_mut()
                .as_mut()
                .unwrap()
                .interrupt();
        });
    }

    const TIMER_COUNTS: u32 = 250;

    peripherals.TC0.tccr0a.write(|w| w.wgm0().ctc());
    peripherals
        .TC0
        .ocr0a
        .write(|w| unsafe { w.bits(TIMER_COUNTS as u8) });
    peripherals.TC0.tccr0b.write(|w| w.cs0().prescale_64());
    peripherals.TC0.timsk0.write(|w| w.ocie0a().set_bit());

    unsafe { avr_device::interrupt::enable() };

    loop {}
}
