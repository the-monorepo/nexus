import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

chai.config.truncateThreshold = 0;
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiPlugin => {
  global.expect = chaiPlugin.expect;
});
