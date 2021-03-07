import * as cinder from 'cinder';
import styles from './SensorPanelElement.scss';
console.log(styles);

export type ParticleData = {
  PM_SP_UG_1_0: number;
  PM_SP_UG_2_5: number;
  PM_SP_UG_10_0: number;

  PM_AE_UG_1_0: number;
  PM_AE_UG_2_5: number;
  PM_AE_UG_10_0: number;
};

const UNSUCCESSFUL = Symbol('unsuccessful-reading');
const SUCCESSFUL = Symbol('successful-reading');
const ERROR = Symbol('error');

export type SuccessfulParticleReadingResult = {
  type: typeof SUCCESSFUL;
  dateTime: number;
  data: ParticleData;
  status: string;
  error: undefined;
};

export type UnsuccessfulParticleReadingResult = {
  type: typeof UNSUCCESSFUL;
  dateTime: number;
  data: undefined;
  status: string;
  error: undefined;
};

export type ErrorParticleReadingResult = {
  type: typeof ERROR;
  dateTime: number;
  data: undefined;
  status: undefined;
  error: any;
};

export type ParticleReadingResult =
  | SuccessfulParticleReadingResult
  | UnsuccessfulParticleReadingResult
  | ErrorParticleReadingResult;
async function* foreverReadFromUSB(device): AsyncGenerator<ParticleReadingResult> {
  while (true) {
    const dateTimeReceivedReading = Date.now();
    try {
      const { data: dataView, status } = await device.transferIn(2, 64);

      if (status === 'ok') {
        const parsed: ParticleData = {
          PM_SP_UG_1_0: dataView.getUint16(0, true),
          PM_SP_UG_2_5: dataView.getUint16(2, true),
          PM_SP_UG_10_0: dataView.getUint16(4, true),

          PM_AE_UG_1_0: dataView.getUint16(6, true),
          PM_AE_UG_2_5: dataView.getUint16(8, true),
          PM_AE_UG_10_0: dataView.getUint16(10, true),
        };
        yield {
          type: SUCCESSFUL,
          dateTime: dateTimeReceivedReading,
          data: parsed,
          status,
          error: undefined,
        };
      } else {
        yield {
          type: UNSUCCESSFUL,
          dateTime: dateTimeReceivedReading,
          data: undefined,
          status,
          error: undefined,
        };
      }
    } catch (error) {
      yield {
        type: ERROR,
        dateTime: dateTimeReceivedReading,
        data: undefined,
        status: undefined,
        error,
      };
    }
  }
}

export class SensorPanelElement extends cinder.DomElement<any, any> {
  @cinder.rerender
  public readonly device;

  private readonly data: SuccessfulParticleReadingResult[] = [];

  [cinder.MOUNT]() {
    this.data.length = 0;
    (async () => {
      for await (const result of foreverReadFromUSB(this.device)) {
        if (result.type !== SUCCESSFUL) {
          continue;
        }

        this.data.push(result);
        this[cinder.UPDATE]();
      }
    })();
  }

  render() {
    const dataClient = {
      interfaces: [
        {
          data: this.data.map((datum) => ({
            x: datum.dateTime,
            y: datum.data.PM_SP_UG_1_0,
          })),
          color: '#BF360C',
          name: 'PM_SP_UG_1_0',
        },
        {
          data: this.data.map((datum) => ({
            x: datum.dateTime,
            y: datum.data.PM_SP_UG_2_5,
          })),
          name: 'PM_SP_UG_2_5',
          color: '#F9A825'
        },
        {
          data: this.data.map((datum) => ({
            x: datum.dateTime,
            y: datum.data.PM_SP_UG_10_0,
          })),
          color: '#827717',
          name: 'PM_SP_UG_10_0',
        },
      ],
    };
    return (
      <>
        <style>
          {styles.toString()}
        </style>
        <section>
          <p>Selected {this.device.productName}</p>
          <section class={styles.locals.chartContainer}>
            <time-line-chart
              $device={this.device}
              $dataClient={dataClient}
            />
          </section>
        </section>
      </>
    );
  }
}
