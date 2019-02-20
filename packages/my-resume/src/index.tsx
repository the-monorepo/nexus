import { createResume } from '@pshaw/resume-template';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as data from './data';

const Resume = createResume();
ReactDOM.render(<Resume data={data} />, document.getElementById('root'));
