/* tslint:disable:prefer-template */
export const details = {
  name: 'Patrick Shaw',
  email: 'mail@patrickshaw.me',
  github: 'https://github.com/PatrickShaw',
  linkedin: 'https://au.linkedin.com/in/patrick-shaw',
  // website: 'https://patrickshaw.me',
};
export const technicalSkills = [
  {
    label: 'Languages',
    items: ['JavaScript', 'TypeScript', 'Java', 'Python'],
  },
  {
    label: 'Technologies',
    items: ['React', 'Node', /* 'Deno' */, 'Android', /* 'MongoDB', */ 'PostgreSQL', 'GraphQL', /*'WebSocket',*/ 'Spring', 'Terraform'],
  },
  {
    label: 'Exposure to',
    items: [
      'C/C++',
      // 'Perl',
      'Bash',
      'Go',
      // 'PHP',
      // 'Wireshark',
      // 'MATLAB',
      'Rust',
      //'WASM',
      '.NET',
      'TensorFlow',
    ],
  },
  {
    label: 'Interests',
    items: [
      'Web',
      'algorithms',
      'progressive web apps',
      'embedded systems',
    ],
  },
];

export const education = [
  {
    school: 'Monash University',
    course: 'B. Soft. Eng.',
    grade: {
      gpa: 3.438,
      wam: 81.1,
    },
    description: 'Received first class honours. Researched & built an automated repair & bug detection algortihm for JavaScript called FaultJS.',
    startDate: new Date(2015, 2),
    endDate: new Date(2019, 10),
  },
];

export const work = [
  {
    company: 'Atlassian',
    job: 'Software Engineer',
    location: 'Remote',
    description: "Most notably, I integrated Stripe into Atlassian's products, added 3D Secure support & implemented analytics instrumentation, SLO/SLIs & general health monitoring for Atlassian's new billing console & shopping cart. I also run system design & coding interviews.",
    startDate: new Date(2020, 0),
    endDate: null,
  },
  {
    company: 'Atlassian',
    job: 'Intern developer',
    location: 'Sydney',
    description:
      "I added analytics support to Atlassian's billing platform & " +
      'the ability to generate financial quotes to the service built in my previous internship. ' +
      'I also reduced the build time of a microservice from ~14 mins to ~4 mins.',
    startDate: new Date(2018, 10),
    endDate: new Date(2019, 1),
  },
  {
    company: 'Monash University',
    job: 'Teaching associate',
    location: 'Clayton',
    description:
      "I taught 1st & 2nd year students Android development & algorithmic fundamentals. Monash's end of semester surveys reported that 96% of students agreed or strongly agreed that I provided clear explanations.",
    startDate: new Date(2018, 2),
    endDate: new Date(2018, 10),
  },
  {
    company: 'Atlassian',
    job: 'Intern developer',
    location: 'Sydney',
    description:
      'I built a microservice that Atlassian products use to create billing related emails & PDFs. ' +
      'I also improved a data warehousing process for entitlements from being a ~4 hour batch process to running in real-time.',
    technologies: ['Node', 'Spring', 'React'],
    startDate: new Date(2017, 10),
    endDate: new Date(2018, 1),
  },
  {
    company: 'ANZ',
    job: 'University placement',
    location: 'Melbourne',
    /*description:
      'I automated the migration of data into JIRA; parsing ~20000 records in total. ' +
      'I built social media sentiment analysis models with TensorFlow & analytics dashboards using React, Node & TypeScript. ' +
      'I also ported JQuery+Handlebars components to React for ANZ.com.',*/
    startDate: new Date(2017, 6),
    endDate: new Date(2017, 10),
  },
  {
    company: 'Rundl',
    job: 'Software developer',
    location: 'Prahran',
    /*description:
      'I designed & developed the Rundl Android application in Java. \n' +
      'Waiting for replacement full-time developer before release',*/
    startDate: new Date(2015, 11),
    endDate: new Date(2017, 5),
  },
];

export const volunteering = [
  {
    organization: 'Monash University',
    role: 'Faculty mentor',
    startDate: new Date(),
    endDate: new Date(),
    keyPoints: [
      'Trained 32 students to be peer mentors',
      'Acted as lead mentor for 6 mentoring events',
    ],
  },
  {
    organization: 'Monash University',
    role: 'Student Engagement Committee member',
    startDate: new Date(),
    endDate: new Date(),
    keyPoints: [
      'Organised official Monash events for the Faculty of IT',
      'Helped shape the IT Peer Mentoring Program',
    ],
  },
  {
    organization: 'Monash University',
    role: 'Software engineering student representative',
    startDate: new Date(),
    endDate: new Date(),
    keyPoints: [
      'Improved IT units by collating student feedback',
      'Acted as liaison between students & staff',
    ],
  },
];

export const projects = [
  /*{
    name: 'Gecko Download Manager',
    types: new Set(['open-source']),
    startDate: new Date(),
    endDate: new Date(),
    description:
      'GeckoDM is a Chrome extension that downloads & organises lectures uploaded on Echo360 software. ' +
      'I wrote the proof of concept prototype.',
    technologies: ['JavaScript'],
  },*/
  {
    name: 'OpenAPI Platform',
    types: new Set(['open-source']),
    startDate: new Date(),
    endDate: new Date(),
    description:
      'Final year university team project built for Telstra to manage OpenAPI specifications. Technologies used include Node, React, MobX & Typescript.',
    technologies: ['Node', 'React', 'MobX', 'TypeScript'],
  },
];

export const hackathons = [
  {
    hack: 'MEDITrace',
    links: {
      entry: 'https://devpost.com/software/meditrace',
    },
    event: 'Unihack Melb. 2018',
    startDate: new Date(2018),
    endDate: new Date(),
    prize: '1st place, best design & best pitch winner',
    description:
      'MEDITrace is a symptomatic health tracker that integrates with FitBit, Android & Bosch sensor data. \n' +
      'I worked on the UI & Firebase integration.',
    technologies: ['React', 'JavaScript', 'Python', 'Android', 'Firebase'],
  },
  {
    hack: 'Seat.me',
    links: {
      entry: 'https://devpost.com/software/seatme',
    },
    event: 'Unihack Melb. 2017',
    prize: '2nd place prize winner',
    startDate: new Date(2017),
    endDate: new Date(),
    description:
      'Seat.me is a platform that determines seat availability in train carriages & other spaces. \n' +
      'I worked on creating the web app & its associated server-side logic.',
    technologies: [
      'Node',
      'React',
      'MobX',
      'TypeScript',
      'Python',
      'convolution neural networks',
    ],
  },
  {
    hack: 'Uptime',
    links: {
      entry: 'https://unearthed.solutions/u/submissions/uptime-0',
    },
    event: 'Unearthed 2017',
    startDate: new Date(2017),
    prize: 'Microsoft sponsored people’s choice winner',
    description:
      'Uptime is a machine learning model that predicts failures in mining machinery 20 minutes prior to error. \n' +
      'I worked on building its neural network.',
    technologies: ['TensorFlow', 'Python'],
  },
];

export const achievements = [
  {
    description:
      'Monash University Vice-Chancellor’s Ancora Imparo Leadership Scholarship',
  },
  {
    description: 'Monash University Industry Based Learning Placement Scholarship',
  },
  {
    description: 'Monash University Industry Based Learning Entry Scholarship',
  },
  {
    description: 'East Doncaster Secondary College 2-year swimming champion',
  },
  {
    description:
      'Competitor at Eastern Metropolitan Regional & Whitehorse Division Swimming',
  },
];
