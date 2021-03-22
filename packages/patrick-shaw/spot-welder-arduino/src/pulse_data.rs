pub enum RedundentReadStatus<R> {
  Success(R),
  Corrupt,
}

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

pub struct PulseData {
  pub first_pulse_duration: u16,
  pub pulse_gap_duration: u16,
  pub second_pulse_duration: u16,
}

impl PulseData {
  pub fn read<F>(mut read_byte: F) -> RedundentReadStatus<PulseData>
  where
      F: FnMut() -> u8,
  {
      if let (
          RedundentReadStatus::Success(first_pulse_duration),
          RedundentReadStatus::Success(pulse_gap_duration),
          RedundentReadStatus::Success(second_pulse_duration),
      ) = (
          redundent_read_u16(&mut read_byte),
          redundent_read_u16(&mut read_byte),
          redundent_read_u16(&mut read_byte),
      ) {
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

pub struct PulseMilliThresholds {
  pub start_millis: u16,
  pub current_millis: u16,
  pub first_pulse_end_threshold: u16,
  pub second_pulse_start_threshold: u16,
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
