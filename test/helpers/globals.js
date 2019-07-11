import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import faultChai from '@fault/chai';

chai.config.truncateThreshold = 0;
chai.use(faultChai);
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiPlugin => {
  global.expect = chaiPlugin.expect;
});
