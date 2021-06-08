import { createResume } from '@pshaw/resume-template';
import * as cinder from 'cinder';
import * as data from './data.ts'
const Resume = createResume();
const rootElement = document.getElementById('root');
cinder.render(rootElement, <Resume data={data} />);
