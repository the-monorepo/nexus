#![no_std]
#![no_main]
#![feature(abi_avr_interrupt)]
#![feature(const_fn)]
mod pulse_data;
use arduino_uno::{
    hal::port::{
        mode::{Output, Pwm},
        portd::PD3,
    },
    prelude::*,
    pwm::Timer2Pwm,
};
use arduino_uno::{
    hal::{
        clock::MHz16,
        port::{
            mode::{Floating, Input},
            portb::{PB2, PB5},
            portd::{PD0, PD1},
        },
        usart::{Usart, UsartOps},
    },
    pac::{USART0},
    pwm::{self, Timer1Pwm},
};
use avr_device::interrupt::Mutex;
use core::{cell::RefCell, ops::DerefMut};
use panic_halt as _;
use pulse_data::{PulseData, PulseMilliThresholds, RedundentReadStatus};

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

struct SpotWelderManager<USART: UsartOps<RX, TX>, RX, TX, CLOCK> {
    serial: Option<Usart<USART, RX, TX, CLOCK>>,
    spot_welder_io: Option<SpotWelderIO>,
    pulse_millis_thresholds: Option<PulseMilliThresholds>,
    current_millis: Option<u16>,
}

impl<USART: UsartOps<RX, TX>, RX, TX, CLOCK> SpotWelderManager<USART, RX, TX, CLOCK> {
    const fn new() -> Self {
        SpotWelderManager {
            serial: None,
            spot_welder_io: None,
            pulse_millis_thresholds: None,
            current_millis: None,
        }
    }

    fn initialize(&mut self, spot_welder_io: SpotWelderIO, serial: Usart<USART, RX, TX, CLOCK>) {
        self.spot_welder_io = Some(spot_welder_io);
        self.serial = Some(serial);
    }

    fn execute(&mut self, pulse_data: PulseData) {
        let thresholds = PulseMilliThresholds::from(pulse_data);
        self.pulse_millis_thresholds = Some(thresholds);
    }

    fn interrupt(&mut self) {
        if let Some(ref mut threshold_data) = self.pulse_millis_thresholds {
            if let Some(ref mut spot_welder_io) = self.spot_welder_io {
                if let Some(ref mut serial) = self.serial {
                    if let Some(current_millis) = self.current_millis {
                        if current_millis == 0 {
                            spot_welder_io.second_pulse_off();
                            serial.write_byte(0);
                        } else {
                            if current_millis == threshold_data.start_millis {
                                spot_welder_io.first_pulse_on();
                            } else if current_millis == threshold_data.first_pulse_end_threshold {
                                spot_welder_io.first_pulse_off();
                            } else if current_millis == threshold_data.second_pulse_start_threshold
                            {
                                spot_welder_io.second_pulse_on();
                            }
                            self.current_millis.replace(current_millis - 1);
                        }
                    } else {
                        let pulse_data_response = PulseData::read(|| serial.read_byte());
                        let pulse_data = match pulse_data_response {
                            RedundentReadStatus::Success(pulse_data) => pulse_data,
                            _ => {
                                serial.write_byte(1);
                                return;
                            }
                        };

                        if pulse_data.first_pulse_duration > 300 {
                            serial.write_byte(2);
                            return;
                        }

                        if pulse_data.pulse_gap_duration > 20000 {
                            serial.write_byte(3);
                            return;
                        }

                        if pulse_data.second_pulse_duration > 300 {
                            serial.write_byte(4);
                            return;
                        }

                        self.execute(pulse_data);
                    }
                }
            }
        }
    }
}

static SPOT_WELDER_MANAGER_MUTEX: Mutex<
    RefCell<SpotWelderManager<USART0, PD0<Input<Floating>>, PD1<Output>, MHz16>>,
> = Mutex::new(RefCell::new(SpotWelderManager::new()));

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

    let spot_welder_io = SpotWelderIO::initialise(low_sound, high_sound, spot_welder);

    avr_device::interrupt::free(|cs| {
        SPOT_WELDER_MANAGER_MUTEX
            .borrow(cs)
            .borrow_mut()
            .deref_mut()
            .initialize(spot_welder_io, serial);
    });

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
