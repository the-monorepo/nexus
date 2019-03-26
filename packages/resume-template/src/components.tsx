/* eslint-disable */
/// <reference path="custom.d.ts" />
import classNames from 'classnames';
import { format as formatDate } from 'date-fns/esm/index';
import jss from 'jss';
import envelope from './envelope.svg';
import github from './github.svg';
import linkedin from './linkedin.svg';

const theme = {
  typography: {
    fontWeightMedium: 500,
  },
  palette: {
    primary: {
      // TODO
      main: '#FF0000'
    },
    // TODO
    getContrastText: () => '#000000'
  }
}

const Typography = ({ children }: any) => (
  <p>{children}</p>
);

const Link = (props) => (
  <Typography {...props}/>
);

type ResumeLinkTextProps = {
  [s: string]: any;
};
const ResumeLinkText = (() => {
  const { classes } = jss.createStyleSheet({
    printLink: {
      display: 'none',
    },
    '@media print': {
      webLink: {
        display: 'none',
      },
      printLink: {
        display: 'inline-block',
      },
    },
  }).attach();
  return (({ children, href, ...other }: any) => (
    <>
    {console.warn(href)}
    {console.warn('awr', children)}
      <span {...other} className={classes.webLink}>
        {children}
      </span>
      {/*
        People print resumes and most viewing on a computer don't expect links 
        so have to show the link as text
      */}
      <span {...other} className={classes.printLink}>
        {href.replace(/^(https?:\/\/(www\.)?|mailto:)/, '')}
      </span>
    </>
  )) ;
})();

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
const Contact = (() => {
  const { classes } = jss.createStyleSheet(theme => ({
    contact: {
      color: theme.palette.getContrastText(theme.palette.primary.main),
      display: 'block',
    },
    icon: {
      width: '1em',
      height: '1em',
      verticalAlign: 'middle',
      marginRight: '0.5em',
    },
  })).attach();
  return ((({ children, icon, href, ...other }: any) => (
    <>
      <EntryLink className={classes.contact} href={href} {...other}>
        <img {...icon} aria-hidden className={classes.icon} />
        <ResumeLinkText href={href}>Test</ResumeLinkText>
      </EntryLink>
    </>
  )) );
})()

type HeaderProps = {
  otherClasses: any;
  data: {
    details: any;
  };
};
const Header = (() => {
  const { classes } = jss.createStyleSheet({
    header: {
      background: theme.palette.primary.main,
    },
    heading: {
      color: theme.palette.getContrastText(theme.palette.primary.main),
    },
    headingContainer: {
      gridColumn: '2',
      flexDirection: 'row',
      alignItems: 'center',
      display: 'flex',
    },
    contact: {
      gridColumn: '3',
    },
  }).attach();
  return ((({ otherClasses, children, data }) => (
    <header className={classNames(classes.header, otherClasses.header)}>
      <div className={classes.headingContainer}>
        <Typography
          variant="h3"
          className={classNames(classes.heading, otherClasses.heading)}
        >
          {children}
        </Typography>
      </div>
      <section>
        {/*
          <Contact>
            <a href={data.details.website}>{data.details.website}</a>
          </Contact>
        */}
        <Contact icon={{ src: envelope }} href={`mailto:${data.details.email}`}>
          Email
        </Contact>
        <Contact icon={{ src: linkedin }} href={data.details.linkedin}>
          LinkedIn
        </Contact>
        <Contact icon={{ src: github }} href={data.details.github}>
          Github
        </Contact>
      </section>
    </header>
  )) )
})();

type EntryTopicProps = {
  [s: string]: any;
};
const EntryTopic = (() => {
  const { classes } = jss.createStyleSheet({
    entryTopic: {
      '&>*': {
        // '&:not(:last-child)': {
        marginBottom: '24px',
        // },<
      },
    },
  }).attach();
  return ((({ children, ...other }) => (
    <Topic otherClasses={{ container: classes.entryTopic }} {...other}>
      {children}
    </Topic>
  )) )
})();

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
const Topic = (() => {
  const { classes } = jss.createStyleSheet({
    heading: {
      fontWeight: theme.typography.fontWeightMedium,
    },
    /*'@media print': {
      container: {
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      },
    },*/
  }).attach();
  return ((({
    heading,
    children,
    otherClasses = { container: undefined },
    ...other
  }) => (
  <section className={otherClasses.container}>
    <Typography
      variant="subtitle2"
      color="primary"
      component="h1"
      // color="textSecondary"
      className={classes.heading}
      {...other}
    >
      {heading}
    </Typography>
    {children}
  </section>
)) )
})();

type EntryProps = {
  leftHeading?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  rightHeading?: string;
  keyPoints?: string[];
  subtext?: string;
  dateFormat?: string;
};
const Entry = (() => {
  const { classes } = jss.createStyleSheet({
    subtext: {
      marginBottom: '12px',
    },
    entryHeading: {
      display: 'inline-block',
    },
    leftHeading: {
      fontWeight: theme.typography.fontWeightMedium,
    },
  }).attach();
  return ((({
    leftHeading,
    description,
    startDate,
    endDate,
    rightHeading,
    keyPoints,
    subtext,
    dateFormat = 'MMM YYYY',
    children,
  }) => (
    <section>
      {leftHeading ? (
        <EntryHeading
          component="h1"
          className={classNames(classes.entryHeading, classes.leftHeading)}
        >
          {leftHeading} /&nbsp;
        </EntryHeading>
      ) : null}
      <EntryHeading component="h2" className={classes.entryHeading}>
        {rightHeading}
      </EntryHeading>
      {/*TODO: Subtext won't appear if no date*/}
      {startDate || endDate ? (
        <EntryText component="p" variant="caption" className={classes.subtext}>
          <DateRange start={startDate} end={endDate} format={dateFormat} />
          {subtext ? `, ${subtext}` : null}
        </EntryText>
      ) : null}
      {children}
      {description ? (
        <EntryText component="p" color="textSecondary">
          {description.replace(/\.?\s*$/, '.')}
        </EntryText>
      ) : null}
      <KeyPoints component="p" color="textSecondary" keyPoints={keyPoints} />
    </section>
  )));
})();

type Grade = {
  gpa: number;
  wam: number;
};
type Education = {
  school: string;
  course: string;
  grade: Grade;
};
type EducationEntryProps = { [s: string]: any } & Education;
const EducationEntry = ({
  school,
  grade,
  course,
  ...other
}) => (
  <Entry
    leftHeading={school}
    rightHeading={course}
    subtext={`GPA: ${grade.gpa}, WAM: ${grade.wam}`}
    {...other}
  />
);

type DateRangeProps = {
  start?: Date;
  end?: Date;
  format?: string;
};
const DateRange = ({ start, end, format }) => (
  <>
    {formatDate(start, format, { awareOfUnicodeTokens: true })}
    {end !== undefined ? (
      <>
        {' '}
        <span aria-label="to">-</span>{' '}
        {end === null
          ? 'Current'
          : formatDate(end, format, { awareOfUnicodeTokens: true })}
      </>
    ) : null}
  </>
);

type EntryHeadingProps = {
  [s: string]: any;
};
const EntryHeading = ({ children, ...other }) => (
  <Typography variant="subtitle1" component="h1" {...other}>
    {children}
  </Typography>
);

type EntryLinkProps = {
  [s: string]: any;
};
const EntryLink = ({ children, ...other }) => (
  <Link variant="caption" color="secondary" {...other}>
    {children}
  </Link>
);

type EntryTextProps = {
  [s: string]: any;
};
const EntryText = ({ children, ...other }) => (
  <Typography variant="caption" color="textSecondary" {...other}>
    {children}
  </Typography>
);

type ListLabelProps = {
  [s: string]: any;
};
const ListLabel = (() => {
  const { classes } = jss.createStyleSheet({
    label: {
      fontWeight: theme.typography.fontWeightMedium,
    },
  }).attach();
  return (({ children, ...other }) => (
    <EntryText className={classes.label} color="textPrimary" {...other}>
      {children}
    </EntryText>
  )) ;
})();

type LabeledListProps = {
  [s: string]: any;
};
const LabeledList = (() => {
  const { classes } = jss.createStyleSheet({
    list: {
      '&>*': {
        '&:not(:last-child)': {
          marginBottom: '12px',
        },
      },
    },
  }).attach();
  return (({ ...other }) => (
    <div className={classes.list}>
      {other.items.map(({ label, items }, index) => (
        <p key={index}>
          <ListLabel component="span" style={{ display: 'inline' }} paragraph={false}>
            {label}:
          </ListLabel>{' '}
          <EntryText component="span" style={{ display: 'inline' }} paragraph={false}>
            {skillsSentence(items)}
          </EntryText>
        </p>
      ))}
    </div>
  )) ;
})();

const Ul = (() => {
  const { classes } = jss.createStyleSheet({
    list: {
      listStylePosition: 'inside',
      paddingLeft: 0,
      marginBlockStart: '0em',
      marginBlockEnd: '0em',
    },
  }).attach();
  return (({ children, classes }: any) => <ul className={classes.list}>{children}</ul>);
})();

type KeyPointItemProps = {
  [s: string]: any;
};
const KeyPointItem = ({ children, ...other }) => (
  <EntryText component="span" {...other}>
    {children}
  </EntryText>
);
type KeyPoint = string;
type KeyPointsProps = {
  keyPoints?: KeyPoint[];
  [s: string]: any;
};
const KeyPoints = ({ keyPoints, ...other }) =>
  keyPoints && keyPoints.length > 0 ? (
    <>
      {keyPoints.slice(0, -1).map((keyPoint, index) => (
        <KeyPointItem {...other} key={index}>
          {keyPoint}
        </KeyPointItem>
      ))}
      {
        <KeyPointItem {...other} gutterBottom>
          {keyPoints[keyPoints.length - 1]}
        </KeyPointItem>
      }
    </>
  ) : null;

type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
const ExperienceEntry = ({
  company,
  job,
  location,
  ...other
}) => <Entry leftHeading={company} rightHeading={job} subtext={location} {...other} />;

type Volunteering = {
  organization: string;
  role: string;
};
type VolunteeringEntryProps = {
  [s: string]: any;
} & Volunteering;
const VolunteeringExperience = ({
  organization,
  role,
  ...other
}) => <Entry leftHeading={organization} rightHeading={role} {...other} />;
const listSentence = items =>
  [items.slice(0, -1).join(', '), items.slice(-1)[0]].join(
    items.length < 2 ? '' : ' and ',
  );
const itemsString = items => items.join(' • ');
/*
 */
const tecnologiesSentence = technologies => `Technologies: ${listSentence(technologies)}`;
const skillsSentence = skills => itemsString(skills);

type Project = {
  name: string;
  types?: string[];
};
type ProjectEntryProps = {
  [s: string]: any;
} & Project;
const ProjectEntry = ({ name, types, ...other }) => (
  <Entry rightHeading={name} {...other} startDate={undefined} endDate={undefined} />
);

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
const HackathonEntry = (() => {
  const { classes } = jss.createStyleSheet({
    prize: {
      marginBottom: '12px',
    },
  }).attach();
  return (({ hack, event, prize, technologies, ...other }) => (
    <Entry
      leftHeading={event}
      rightHeading={hack}
      {...other}
      startDate={undefined}
      endDate={undefined}
    >
      <Typography component="p" variant="caption" className={classes.prize}>
        <em>{prize}</em>
      </Typography>
    </Entry>
  )) ;
})();
/*
class HackathonElement extends HTMLElement {
  constructor() {
    super();
    // const template = document.querySelector('#page-template') as HTMLTemplateElement;
    const shadowRoot = this.attachShadow({ mode: 'open' });
    console.log(this.dataset)
    ReactDOM.render(<HackathonEntry {...this.dataset}/>, shadowRoot, null);
    //shadowRoot.appendChild(template!.content.cloneNode(true));
  }
}
window.customElements.define('x-hackathon', HackathonElement);
*/

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
const EntryMapper = ({ Component, data }) =>
  data.map((item, index) => <Component {...item} key={index} />);

type ResumeData = any;
type PageProps = {
  data: ResumeData;
  [s: string]: any;
};
export const Page = (() => {
  const { classes } = jss.createStyleSheet({
    pageGrid: {
      display: 'grid',
      // gridAutoColumns: 'auto',
      gridTemplateColumns:
        'minmax(24px, 1fr) minmax(392px, 444px) minmax(252px, 300px) minmax(24px, 1fr)',
      gridGap: '24px',
    },
    margin: {
      visibility: 'hidden',
    },
    header: {
      gridColumn: 'span 4',
      paddingTop: '32px',
      paddingBottom: '32px',
    },
    topicEntries: {
      '&>*': {
        // '&:not(:last-child)': {
        marginBottom: '24px',
        // },
      },
    },
    main: {
      marginTop: '10px',
      gridColumn: 2,
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'column',
    },
    aside: {
      marginTop: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      flexDirection: 'column',
    },
  });
  return (({ data }) => (
    <div className={classNames(classes.pageContainer, classes.pageGrid)}>
      <Header
        otherClasses={{
          header: classNames(classes.header, classes.pageGrid),
        }}
        data={data}
      >
        {data.details.name}
      </Header>
      <main className={classes.main}>
        <EntryTopic heading="Experience">
          <EntryMapper Component={ExperienceEntry} data={data.work} />
        </EntryTopic>
        <EntryTopic heading="Projects">
          <EntryMapper Component={ProjectEntry} data={data.projects} />
        </EntryTopic>
      </main>
      <aside className={classes.aside}>
        <EntryTopic heading="Education">
          <EntryMapper Component={EducationEntry} data={data.education} />
        </EntryTopic>
        <EntryTopic heading="Hackathons">
          <EntryMapper Component={HackathonEntry} data={data.hackathons} />  
        </EntryTopic>
        <EntryTopic heading="Technical skills">
          <LabeledList items={data.technicalSkills} />
        </EntryTopic>
      </aside>
      <div className={classes.margin} />
    </div>
  )) ;
})();
