import * as cinder from 'cinder';

let usbDevice: any = undefined;
let usbError: any = undefined;

const selectUSB = async () => {
  try {
    usbError = undefined;
    usbDevice = await navigator.usb.requestDevice({ filters: [] });
    console.log(usbDevice)
    await usbDevice.open();
    await usbDevice.claimInterface(0);
    for await(const _ of readFromUSB(usbDevice)) {

    }
  } catch (err) {
    usbError = err;
    console.error(err);
  } finally {
    rerender();
  }
};

async function* readFromUSB(device) {
  while(true) {
    console.log('Reading...')
    const data = await device.transferIn(2, 64);
    const decoder = new TextDecoder('utf-8');
    var decodedString = decoder.decode(data.data);
    console.log(data, decodedString);
  }
}

const SensorDataView = () => <section>Test</section>;

const USBError = ({ error }) =>
  error !== undefined ? <section>{JSON.stringify(error, undefined, 2)}</section> : null;

const USBView = ({ device }) =>
  device !== undefined ? <section>Selected {device.productName}</section> : null;

const App = () => (
  <main>
    <section>
      <button $$click={selectUSB}>Test</button>
    </section>
    <USBView device={usbDevice} />
    <USBError />
  </main>
);

const rootElement = document.getElementById('root');
const rerender = () => cinder.render(<App />, rootElement);
rerender();
