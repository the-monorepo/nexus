/* eslint-disable */
import './custom.d.ts';
import { format as formatDate } from 'date-fns/esm/index';
import envelope from './envelope.svg';
import github from './github.svg';
import linkedin from './linkedin.svg';
import * as cinder from 'cinder';
import { DomElement } from 'cinder';
import cx from 'classnames';
import * as styles from './components.scss';

const Typography = ({
  children,
  color,
  variant,
  backgroundContext,
  class: clazz,
  Component: TextComponent = 'p',
  weight,
  ...other
}: any) => {
  return (
    // TODO: For some reason transpilation for anything of the same length as "Component" if you don't have an alias, gets converted to HTML.
    <TextComponent
      {...other}
      class={cx(
        clazz,
        styles.text,
        weight !== undefined ? styles.weight : undefined,
        styles[weight],
        variant !== undefined ? styles.variant : undefined,
        styles[variant],
        color !== undefined ? styles.color : undefined,
        styles[color],
        backgroundContext !== undefined ? styles.backgroundContext : undefined,
        styles[backgroundContext],
      )}
    >
      {children}
    </TextComponent>
  );
};

const Link = (props) => <Typography Component="a" {...props} />;

export const ResumeLinkText = ({ href, children, backgroundContext }) => {
  return (
    <>
      <Typography
        Component="span"
        variant="body2"
        class={styles.webLink}
        backgroundContext={backgroundContext}
      >
        {children}
      </Typography>
      {/*
          People who print the resume can't click on the link, obviously,
          so have to show the link as text
        */}
      <Typography
        Component="span"
        variant="body2"
        class={styles.printLink}
        backgroundContext={backgroundContext}
      >
        {href.replace(/(https?:\/\/(www\.)?|mailto:)/, '')}
      </Typography>
    </>
  );
};

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
const Contact = ({ href, icon, children, ...other }) => {
  return (
    <>
      <EntryLink class={styles.contact} href={href}>
        <img {...icon} aria-hidden class={styles.icon} />
        <ResumeLinkText href={href} {...other}>
          {children}
        </ResumeLinkText>
      </EntryLink>
    </>
  );
};

type HeaderProps = {
  otherClasses: any;
  data: {
    details: any;
  };
};
const Header = ({ data, children }) => {
  return (
    <>
      <header class={cx(styles.header, styles.pageGrid)}>
        <div class={styles.headingContainer}>
          <Typography
            variant="h3"
            Component="h1"
            class={styles.heading}
            backgroundContext="primary"
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
          <Contact
            icon={{ src: envelope }}
            href={`mailto:${data.details.email}`}
            backgroundContext="primary"
          >
            Email
          </Contact>
          <Contact
            icon={{ src: linkedin }}
            href={data.details.linkedin}
            backgroundContext="primary"
          >
            LinkedIn
          </Contact>
          <Contact
            icon={{ src: github }}
            href={data.details.github}
            backgroundContext="primary"
          >
            Github
          </Contact>
        </section>
      </header>
    </>
  );
};

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
const Topic = ({ heading, children }) => {
  return (
    <>
      <section>
        <Typography
          variant="subtitle2"
          color="primary"
          Component="h1"
          weight="normal"
          // color="secondary"
          class={styles.topicHeading}
        >
          {heading}
        </Typography>
        {children}
      </section>
    </>
  );
};

type EntryTopicProps = {
  [s: string]: any;
};
const EntryTopic = ({ heading, children }) => {
  // TODO: Get rid of the !important at some point :P
  return (
    <>
      <Topic class={styles.entryTopic} heading={heading}>
        {children}
      </Topic>
    </>
  );
};

type EntryProps = {
  leftHeading?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  rightHeading?: string;
  keyPoints?: string[];
  subtext?: string;
  dateFormat?: string;
  children: any;
};

const Entry = ({
  dateFormat = 'MMM yyyy',
  leftHeading,
  rightHeading,
  startDate,
  endDate,
  subtext,
  description,
  keyPoints,
  children,
}: EntryProps) => {
  return (
    <>
      <section class={styles.entrySection}>
        {leftHeading ? (
          <EntryHeading
            Component="h1"
            class={cx(styles.entryHeading, styles.leftHeading, styles.gutterTop)}
          >
            {leftHeading} /&nbsp;{' '}
          </EntryHeading>
        ) : null}
        <EntryHeading
          Component="h2"
          class={cx(
            styles.entryHeading,
            leftHeading === undefined ? styles.gutterTop : null,
          )}
        >
          {rightHeading}
        </EntryHeading>
        {/*TODO: Subtext won't appear if no date*/}
        {startDate || endDate ? (
          <EntryText
            Component="p"
            variant="caption"
            class={
              description !== undefined || children !== undefined
                ? styles.subtextGutterBottom
                : null
            }
          >
            <DateRange start={startDate} end={endDate} format={dateFormat} />
            {subtext ? `, ${subtext}` : null}
          </EntryText>
        ) : null}
        {children}
        {description ? (
          <EntryText Component="p" variant="body2" color="tertiary">
            {description.replace(/\.?\s*$/, '.')}
          </EntryText>
        ) : null}
        <KeyPoints Component="p" color="secondary" keyPoints={keyPoints} />
      </section>
    </>
  );
};

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
};

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
};

type EntryHeadingProps = {
  [s: string]: any;
};
const EntryHeading = (props) => {
  return <Typography variant="subtitle1" Component="h1" {...props} />;
};

type EntryLinkProps = {
  [s: string]: any;
};
const EntryLink = (props) => {
  return <Link variant="caption" color="secondary" {...props} />;
};

type EntryTextProps = {
  [s: string]: any;
};
const EntryText = (props) => {
  return <Typography variant="caption" color="secondary" {...props} />;
};

type ListLabelProps = {
  [s: string]: any;
};
const ListLabel = (props) => {
  return (
    <>
      <EntryText class={styles.listLabel} color="primary" {...props} />
    </>
  );
};

const LabeledList = ({ items }) => {
  return (
    <>
      <div class={styles.list}>
        {items.map(({ label, items }) => (
          <p>
            <ListLabel Component="span" style={`display: 'inline'`} paragraph={false}>
              {label}:
            </ListLabel>{' '}
            <EntryText Component="span" style={`display: 'inline'`} paragraph={false}>
              {skillsSentence(items)}
            </EntryText>
          </p>
        ))}
      </div>
    </>
  );
};

type KeyPointItemProps = {
  [s: string]: any;
};
const KeyPoint = (props) => {
  return <EntryText Component="span" {...props} />;
};
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
};
type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
const ExperienceEntry = ({ company, job, location, ...props }) => {
  return <Entry leftHeading={company} rightHeading={job} subtext={location} {...props} />;
};

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
const ProjectEntry = ({ name, ...props }) => {
  return (
    <Entry rightHeading={name} {...props} startDate={undefined} endDate={undefined} />
  );
};

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
const HackathonEntry = ({ event, hack, prize, description }) => {
  return (
    <>
      <Entry
        leftHeading={event}
        rightHeading={hack}
        startDate={undefined}
        endDate={undefined}
        description={description}
      >
        <Typography Component="p" variant="caption" color="tertiary" class={styles.prize}>
          <em>{prize}</em>
        </Typography>
      </Entry>
    </>
  );
};

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
const EntryMapper = ({ data, Component }) => {
  return data.map((item) => <Component {...item} />);
};

type ResumeData = any;
type PageProps = {
  data: ResumeData;
  [s: string]: any;
};

const Resume = ({ data }) => {
  return (
    <>
      <div class={styles.pageGrid}>
        <Header class={styles.header} data={data}>
          {data.details.name}
        </Header>
        <main class={styles.main}>
          <EntryTopic heading="Experience">
            <EntryMapper Component={ExperienceEntry} data={data.work} />
          </EntryTopic>
          <EntryTopic heading="Projects">
            <EntryMapper Component={ProjectEntry} data={data.projects} />
          </EntryTopic>
        </main>
        <aside class={styles.aside}>
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
      </div>
    </>
  );
};

export default Resume;
