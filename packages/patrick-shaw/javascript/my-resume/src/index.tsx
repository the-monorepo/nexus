import { createResume } from '@pshaw/resume-template';
import * as cinder from 'cinder';
import * as data from './data.tsx';
const Resume = createResume();
const rootElement = document.getElementById('root');
cinder.render(rootElement, <Resume data={data} />);
