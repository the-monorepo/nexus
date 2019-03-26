import { createResume } from '@pshaw/resume-template';

import * as data from './data';

const resumeElement = createResume(data);
const rootElement = document.getElementById('root');
rootElement!.appendChild(resumeElement);
