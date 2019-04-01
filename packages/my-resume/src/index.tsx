import { createResume } from '@pshaw/resume-template';
import * as mbx from 'mobx-dom';
import { observable } from 'mobx';
import * as data from './data';
const Resume = createResume();
const rootElement = document.getElementById('root');
mbx.render(rootElement, <Resume data={data} />);
