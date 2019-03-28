import '@pshaw/resume-template/esm/register';
import { createResume } from '@pshaw/resume-template';
import * as data from './data';

const Resume = createResume();
const rootElement = document.getElementById('root');
const resumeElement = <Resume data={data}/>;
console.log(resumeElement);
rootElement!.appendChild(resumeElement);
