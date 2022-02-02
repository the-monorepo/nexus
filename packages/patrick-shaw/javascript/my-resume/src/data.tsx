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
    items: ['React', 'Node', 'Deno', 'Android', /* 'MongoDB' */, 'PostgreSQL', 'GraphQL', 'WebSocket', 'Spring'],
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
      '.NET',
      'TensorFlow',
    ],
  },
  {
    label: 'Interests',
    items: [
      'Application development',
      'web',
      'algorithms',
      'embedded systems'
    ],
  },
];

export const education = [
  {
    school: 'Monash University',
    course: 'B. Soft. Eng.',
    grade: {
      gpa: 3.438,
      wam: 81.089,
    },
    description: 'First class honours. Researched automated repair and bug detection in JavaScript open source software.',
    startDate: new Date(2015, 2),
    endDate: new Date(2019, 11),
  },
];

export const work = [
  {
    company: 'Atlassian',
    job: 'Software Engineer',
    location: 'Sydney',
    description: "I integrated Stripe into Atlassian's products",
    startDate: new Date(2020, 1),
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
      'I built a microservice that all Atlassian products use to create commerce related emails & PDFs. ' +
      'I also improved an entitlement data warehousing process from being a ~4 hour batch process to running in real-time.',
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
      'I built social media sentiment analysis models with TensorFlow and analytics dashboards using React, Node and TypeScript. ' +
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
  {
    name: 'Gecko Download Manager',
    types: new Set(['open-source']),
    startDate: new Date(),
    endDate: new Date(),
    description:
      'GeckoDM is a Chrome extension that downloads & organises lectures uploaded on Echo360 software. ' +
      'I wrote the proof of concept prototype.',
    technologies: ['JavaScript'],
  },
  {
    name: 'OpenAPI Platform',
    types: new Set(['open-source']),
    startDate: new Date(),
    endDate: new Date(),
    description:
      'Final year university team project built for Telstra to manage OpenAPI specifications. Technologies used include Node, React, MobX and Typescript.',
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
    prize: '1st place, best design and best pitch winner',
    description:
      'MEDITrace is a symptomatic health tracker that integrates with the FitBit, Android and Bosch sensor data. \n' +
      'I primarily worked on the UI and Firebase integration.',
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
      'I worked on creating the web app and its associated server-side logic.',
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
      'Uptime is a machine learning model that predicts failures in mining machinery 20 minutes prior to failure. \n' +
      'I worked on building and training a neural network.',
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
