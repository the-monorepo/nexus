import { createResume } from '@pshaw/resume-template';
import * as React from 'react';
import * as data from './data';
import * as ReactDOM from 'react-dom';

const Resume = createResume();
ReactDOM.render(<Resume data={data} />, document.getElementById('root'));
