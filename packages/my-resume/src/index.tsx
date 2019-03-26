import '@pshaw/resume-template/esm/register';
import { createResume } from '@pshaw/resume-template';
import * as data from './data';

const Resume = createResume();
const rootElement = document.getElementById('root');
rootElement!.appendChild(<Resume data={data}/>);
