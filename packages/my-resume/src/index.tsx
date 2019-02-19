import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as data from './data';
import { createResume } from '@pshaw/resume-template';

const Resume = createResume();
ReactDOM.render(<Resume data={data} />, document.getElementById('root'));
