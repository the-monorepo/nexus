import '@pshaw/resume-template/src/register';
import { render } from '@pshaw/resume-template/src/render';
import { createResume } from '@pshaw/resume-template';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
render(rootElement, <Resume data={data}/>);
