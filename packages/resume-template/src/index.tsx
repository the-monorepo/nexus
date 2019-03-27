import './jss-register';
import { Page } from './components';

export function createResume() {
  return ({ data }) => (
    <Page data={data} />
  );
}
