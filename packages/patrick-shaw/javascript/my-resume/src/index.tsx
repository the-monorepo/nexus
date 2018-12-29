import Resume from '@pshaw/resume-template';
import * as cinder from 'cinder';
import * as data from './data.tsx';
const rootElement = document.getElementById('root');
cinder.render(<Resume data={data} />, rootElement);
