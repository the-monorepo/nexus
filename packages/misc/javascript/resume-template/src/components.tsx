/* eslint-disable */
import './custom.d.ts';
import classNames from 'classnames';
import { format as formatDate } from 'date-fns/esm/index';
import envelope from './envelope.svg';
import github from './github.svg';
import linkedin from './linkedin.svg';
import * as cinder from 'cinder';
import { DomElement } from 'cinder';

const theme = {
  typography: {
    fontWeightMedium: 500,
  },
  palette: {
    primary: {
      // TODO
      main: '#FF0000',
    },
    // TODO
    getContrastText: (x) => '#000000',
  },
};

const Typography = ({ children }: any) => <p>{children}</p>;

const Link = (props) => <Typography {...props} />;

export const ResumeLinkText = ({ href, children }) => {

    return (
      <>
        <style>{`
          .printLink {
            display: none;
          }
          @media print {
            .webLink {
              display: none;
            }
            .printLink {
              display: inline-block;
            }
          }
        `}</style>
        <span class="webLink">
          {children}
        </span>
        {/*
          People who print the resume can't click on the link, obviously,
          so have to show the link as text
        */}
        <span class="printLink">
          {href.replace(/(https?:\/\/(www\.)?|mailto:)/, '')}
        </span>
      </>
    );
}

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
const Contact = ({ href, icon, children }) => {

    const color = theme.palette.getContrastText(theme.palette.primary.main);
    return (
      <>
        <style>{`
          .contact {
            color: ${color};
            display: block;
          }
          .icon {
            width: 1em;
            height: 1em;
            vertical-align: middle;
            margin-right: 0.5em;
          }
          `}</style>
        <EntryLink class="contact" href={href}>
          <img {...icon} aria-hidden class="icon" />
          <ResumeLinkText href={href}>
            {children}
          </ResumeLinkText>
        </EntryLink>
      </>
    );
}


type HeaderProps = {
  otherClasses: any;
  data: {
    details: any;
  };
};
const pageGridRule = `
.pageGrid {
  display: grid;
  grid-template-columns:
    minmax(24px, 1fr) minmax(392px, 444px) minmax(252px, 300px) minmax(24px, 1fr);
  grid-gap: 24px;
}
`;
const Header = ({ data, children }) => {

    const color = theme.palette.getContrastText(theme.palette.primary.main);
    return (
      <>
        <style>
          {`
                      ${pageGridRule}
                      .header {
                        background: ${theme.palette.primary.main};
                        padding-top: 32px;
                        padding-bottom: 32px;
                      }
                      .heading {
                        color: ${color};
                      }
                      .headingContainer {
                        grid-column: 2;
                        flex-direction: row;
                        align-items: center;
                        display: flex;
                      }
                      .contact {
                        grid-column: 3;
                      }
          `}
        </style>
        <header class="header pageGrid">
          <div class="headingContainer">
            <Typography variant="h3" class="heading">
              {children}
            </Typography>
          </div>
          <section>
            {/*
                <Contact>
                  <a href={data.details.website}>{data.details.website}</a>
                </Contact>
              */}
            <Contact
              icon={{ src: envelope }}
              href={`mailto:${data.details.email}`}
            >
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
      </>
    );
}

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
const Topic = ({ heading, children }) => {

    return (
      <>
        <style>{`
            .heading {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
        <section>
          <Typography
            variant="subtitle2"
            color="primary"
            component="h1"
            // color="textSecondary"
            class="heading"
          >
            {heading}
          </Typography>
          {children}
        </section>
      </>
    );
}

type EntryTopicProps = {
  [s: string]: any;
};
const EntryTopic = ({ heading, children }) => {

    // TODO: Get rid of the !important at some point :P
    return (
      <>
        <style>{`
            ::slotted(*) {
              margin-bottom: 24px !important;
            }
          `}</style>
        <Topic class="entryTopic" heading={heading}>
          {children}
        </Topic>
      </>
    );
}

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

const Entry = ({ dateFormat = 'MMM yyyy', leftHeading, rightHeading, startDate, endDate, subtext, description, keyPoints, children }) => {
    return (
      <>
        <style>{`
                .subtext {
                  margin-bottom: 12px;
                }
                .entryHeading {
                  display: inline-block;
                }
                .leftHeading {
                  font-weight: ${theme.typography.fontWeightMedium};
                }
          `}</style>
        <section>
          {leftHeading ? (
            <EntryHeading component="h1" class="entryHeading leftHeading">
              {leftHeading} /&nbsp;
            </EntryHeading>
          ) : null}
          <EntryHeading component="h2" class="entryHeading">
            {rightHeading}
          </EntryHeading>
          {/*TODO: Subtext won't appear if no date*/}
          {startDate || endDate ? (
            <EntryText component="p" variant="caption" class="subtext">
              <DateRange
                start={startDate}
                end={endDate}
                format={dateFormat}
              />
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
      </>
    );
}

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
const EducationEntry = ({ school, course, grade, ...props }: EducationEntryProps) => {

    return (
      <Entry
        leftHeading={school}
        rightHeading={course}
        subtext={`GPA: ${grade.gpa}, WAM: ${grade.wam}`}
        {...props}
      />
    );
}

type DateRangeProps = {
  start?: Date;
  end?: Date;
  format?: string;
};
const DateRange = ({ start, format, end }) => {

    return (
      <>
        {formatDate(start, format, { awareOfUnicodeTokens: true })}
        {end !== undefined ? (
          <>
            {' '}
            <span aria-label="to">-</span>{' '}
            {end === null
              ? 'Current'
              : formatDate(end, format, {
                  awareOfUnicodeTokens: true,
                })}
          </>
        ) : null}
      </>
    );
}

type EntryHeadingProps = {
  [s: string]: any;
};
const EntryHeading = (props) => {

    return (
      <Typography variant="subtitle1" component="h1" {...props}/>
    );
}

type EntryLinkProps = {
  [s: string]: any;
};
const EntryLink = (props) => {

    return (
      <Link variant="caption" color="secondary" {...props}/>
    );
}


type EntryTextProps = {
  [s: string]: any;
};
const EntryText = (props) => {

    return (
      <Typography variant="caption" color="textSecondary" {...props}/>
    );
}

type ListLabelProps = {
  [s: string]: any;
};
const ListLabel = (props) => {

    return (
      <>
        <style>{`
            .label {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
        <EntryText class="label" color="textPrimary" {...props}/>
      </>
    );
}

const LabeledList = ({ items }) => {

    return (
      <>
        <style>
          {`
                  .list>*:not(:last-child) {
                      margin-bottom: 12px;
                  }
          `}
        </style>
        <div class="list">
          {items.map(({ label, items }) => (
            <p>
              <ListLabel component="span" style={`display: 'inline'`} paragraph={false}>
                {label}:
              </ListLabel>{' '}
              <EntryText component="span" style={`display: 'inline'`} paragraph={false}>
                {skillsSentence(items)}
              </EntryText>
            </p>
          ))}
        </div>
      </>
    );
}

type KeyPointItemProps = {
  [s: string]: any;
};
const KeyPoint = (props) => {

    return (
      <EntryText component="span" {...props} />
    );
}
type KeyPointsProps = {
  keyPoints?: KeyPoint[];
  [s: string]: any;
};
const KeyPoints = ({ keyPoints, ...props }) => {

    return (
      <>
        {keyPoints && keyPoints.length > 0 ? (
          <>
            {keyPoints.slice(0, -1).map((keyPoint, index) => (
              <KeyPoint {...props} key={index}>
                {keyPoint}
              </KeyPoint>
            ))}
            {
              <KeyPoint {...props} gutterBottom>
                {keyPoints[keyPoints.length - 1]}
              </KeyPoint>
            }
          </>
        ) : null}
      </>
    );
}
type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
const ExperienceEntry = ({ company, job, ...props}) => {

    return (
      <Entry
        leftHeading={company}
        rightHeading={job}
        subtext={location}
        {...props}
      />
    );
}

type Volunteering = {
  organization: string;
  role: string;
};
type VolunteeringEntryProps = {
  [s: string]: any;
} & Volunteering;
const VolunteeringExperience = ({ organization, role, ...other }) => (
  <Entry leftHeading={organization} rightHeading={role} {...other} />
);
const listSentence = (items) =>
  [items.slice(0, -1).join(', '), items.slice(-1)[0]].join(
    items.length < 2 ? '' : ' and ',
  );
const itemsString = (items) => items.join(' • ');
/*
 */
const tecnologiesSentence = (technologies) =>
  `Technologies: ${listSentence(technologies)}`;
const skillsSentence = (skills) => itemsString(skills);

type Project = {
  name: string;
  types?: string[];
};
type ProjectEntryProps = {
  [s: string]: any;
} & Project;
const ProjectEntry = ({ name, ...props}) => {

    return (
      <Entry
        rightHeading={name}
        {...props}
        startDate={undefined}
        endDate={undefined}
      />
    );
}

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
const HackathonEntry = ({ event, hack, prize, }) => {

    return (
      <>
        <style>{`
          .prize {
            margin-bottom: 12px;
          }
        `}</style>
        <Entry
          leftHeading={event}
          rightHeading={hack}
          startDate={undefined}
          endDate={undefined}
        >
          <Typography component="p" variant="caption" class="prize">
            <em>{prize}</em>
          </Typography>
        </Entry>
      </>
    );
}

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
const EntryMapper = ({ data, Component }) => {

    return data.map((item) => (
      <Component {...item}
      />
    ));
}

type ResumeData = any;
type PageProps = {
  data: ResumeData;
  [s: string]: any;
};

const Resume = ({ data }) => {

    return (
      <>
        <style>{`
          .pageGrid {
            display: grid;
            // gridAutoColumns: auto;
            grid-template-columns:
              minmax(24px, 1fr) minmax(392px, 444px) minmax(252px, 300px) minmax(24px, 1fr);
            grid-gap: 24px;
          }
          .margin {
            visibility: hidden;
          }
          .header {
            grid-column: span 4;
          }
          .topicEntries>* {
            margin-bottom: 24px;
          }
          .main {
            margin-top: 10px;
            grid-column: 2;
            display: flex;
            justify-content: space-between;
            flex-direction: column;
          }
          .aside {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            flex-direction: column;
          }
          `}</style>
        <div class="pageGrid">
          <Header class="header" data={data}>
            {data.details.name}
          </Header>
          <main class="main">
            <EntryTopic heading="Experience">
              <EntryMapper Component={ExperienceEntry} data={data.work} />
            </EntryTopic>
            <EntryTopic heading="Projects">
              <EntryMapper Component={ProjectEntry} data={data.projects} />
            </EntryTopic>
          </main>
          <aside class="aside">
            <EntryTopic heading="Education">
              <EntryMapper Component={EducationEntry} data={data.education} />
            </EntryTopic>
            <EntryTopic heading="Hackathons">
              <EntryMapper Component={HackathonEntry}data={data.hackathons} />
            </EntryTopic>
            <EntryTopic heading="Technical skills">
              <LabeledList items={data.technicalSkills} />
            </EntryTopic>
          </aside>
        </div>
      </>
    );
}

export default Resume;
