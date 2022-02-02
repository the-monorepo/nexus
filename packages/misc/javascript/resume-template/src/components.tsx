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

export class ResumeLinkText extends DomElement {
  private href;
  render() {
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
          <slot />
        </span>
        {/*
          People who print the resume can't click on the link, obviously,
          so have to show the link as text
        */}
        <span class="printLink">
          {this.href.replace(/(https?:\/\/(www\.)?|mailto:)/, '')}
        </span>
      </>
    );
  }
}
globalThis.customElements.define('x-resume-link', ResumeLinkText);

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
class Contact extends DomElement {
  render() {
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
        <EntryLink class="contact" $href={this.href}>
          <img {...this.icon} aria-hidden class="icon" />
          <ResumeLinkText $href={this.href}>
            <slot />
          </ResumeLinkText>
        </EntryLink>
      </>
    );
  }
}

globalThis.customElements.define('x-contact', Contact);

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
class Header extends DomElement {
  render() {
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
            <Typography $variant="h3" class="heading">
              <slot />
            </Typography>
          </div>
          <section>
            {/*
                <Contact>
                  <a href={data.details.website}>{data.details.website}</a>
                </Contact>
              */}
            <Contact
              $icon={{ src: envelope }}
              $href={`mailto:${this.data.details.email}`}
            >
              Email
            </Contact>
            <Contact $icon={{ src: linkedin }} $href={this.data.details.linkedin}>
              LinkedIn
            </Contact>
            <Contact $icon={{ src: github }} $href={this.data.details.github}>
              Github
            </Contact>
          </section>
        </header>
      </>
    );
  }
}
globalThis.customElements.define('x-header', Header);

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
class Topic extends DomElement {
  render() {
    return (
      <>
        <style>{`
            .heading {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
        <section>
          <Typography
            $variant="subtitle2"
            $color="primary"
            $component="h1"
            // $color="textSecondary"
            class="heading"
          >
            {this.heading}
          </Typography>
          <slot />
        </section>
      </>
    );
  }
}
globalThis.customElements.define('x-topic', Topic);

type EntryTopicProps = {
  [s: string]: any;
};
class EntryTopic extends DomElement {
  render() {
    // TODO: Get rid of the !important at some point :P
    return (
      <>
        <style>{`
            ::slotted(*) {
              margin-bottom: 24px !important;
            }
          `}</style>
        <Topic class="entryTopic" $heading={this.heading}>
          <slot />
        </Topic>
      </>
    );
  }
}
globalThis.customElements.define('x-entry-topic', EntryTopic);

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

class Entry extends DomElement {
  render() {
    const dateFormat = this.dateFormat ? this.dateFormat : 'MMM YYYY';
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
          {this.leftHeading ? (
            <EntryHeading $component="h1" class="entryHeading leftHeading">
              {this.leftHeading} /&nbsp;
            </EntryHeading>
          ) : null}
          <EntryHeading $component="h2" class="entryHeading">
            {this.rightHeading}
          </EntryHeading>
          {/*TODO: Subtext won't appear if no date*/}
          {this.startDate || this.endDate ? (
            <EntryText $component="p" $variant="caption" class="subtext">
              <DateRange
                $start={this.startDate}
                $end={this.endDate}
                $format={dateFormat}
              />
              {this.subtext ? `, ${this.subtext}` : null}
            </EntryText>
          ) : null}
          <slot />
          {this.description ? (
            <EntryText $component="p" $color="textSecondary">
              {this.description.replace(/\.?\s*$/, '.')}
            </EntryText>
          ) : null}
          <KeyPoints $component="p" $color="textSecondary" $keyPoints={this.keyPoints} />
        </section>
      </>
    );
  }
}
globalThis.customElements.define('x-entry', Entry);

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
class EducationEntry extends DomElement {
  render() {
    return (
      <Entry
        $leftHeading={this.school}
        $rightHeading={this.course}
        $subtext={`GPA: ${this.grade.gpa}, WAM: ${this.grade.wam}`}
        {...this.props}
      />
    );
  }
}
globalThis.customElements.define('x-education', EducationEntry);

type DateRangeProps = {
  start?: Date;
  end?: Date;
  format?: string;
};
class DateRange extends DomElement {
  render() {
    return (
      <>
        {formatDate(this.start, this.format, { awareOfUnicodeTokens: true })}
        {this.end !== undefined ? (
          <>
            {' '}
            <span aria-label="to">-</span>{' '}
            {this.end === null
              ? 'Current'
              : formatDate(this.end, this.format, {
                  awareOfUnicodeTokens: true,
                })}
          </>
        ) : null}
      </>
    );
  }
}
globalThis.customElements.define('x-date-range', DateRange);

type EntryHeadingProps = {
  [s: string]: any;
};
class EntryHeading extends DomElement {
  render() {
    return (
      <Typography $variant="subtitle1" $component="h1" {...this.props}>
        <slot />
      </Typography>
    );
  }
}
globalThis.customElements.define('x-entry-heading', EntryHeading);

type EntryLinkProps = {
  [s: string]: any;
};
class EntryLink extends DomElement {
  render() {
    return (
      <Link $variant="caption" $color="secondary" {...this.props}>
        <slot />
      </Link>
    );
  }
}

globalThis.customElements.define('x-entry-link', EntryLink);

type EntryTextProps = {
  [s: string]: any;
};
class EntryText extends DomElement {
  render() {
    return (
      <Typography $variant="caption" $color="textSecondary" {...this.props}>
        <slot />
      </Typography>
    );
  }
}
globalThis.customElements.define('x-entry-text', EntryText);

type ListLabelProps = {
  [s: string]: any;
};
class ListLabel extends DomElement {
  render() {
    return (
      <>
        <style>{`
            .label {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
        <EntryText class="label" $color="textPrimary" {...this.props}>
          <slot />
        </EntryText>
      </>
    );
  }
}
globalThis.customElements.define('x-list-label', ListLabel);

class LabeledList extends DomElement {
  private items;
  render() {
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
          {this.items.map(({ label, items }) => (
            <p>
              <ListLabel $component="span" style={`display: 'inline'`} $paragraph={false}>
                {label}:
              </ListLabel>{' '}
              <EntryText $component="span" style={`display: 'inline'`} $paragraph={false}>
                {skillsSentence(items)}
              </EntryText>
            </p>
          ))}
        </div>
      </>
    );
  }
}
globalThis.customElements.define('x-labeled-list', LabeledList);

type KeyPointItemProps = {
  [s: string]: any;
};
class KeyPoint extends DomElement {
  render() {
    return (
      <EntryText $component="span" {...this.props}>
        <slot />
      </EntryText>
    );
  }
}
globalThis.customElements.define('x-key-point', KeyPoint);
type KeyPointsProps = {
  keyPoints?: KeyPoint[];
  [s: string]: any;
};
class KeyPoints extends DomElement {
  render() {
    return (
      <>
        {this.keyPoints && this.keyPoints.length > 0 ? (
          <>
            {this.keyPoints.slice(0, -1).map((keyPoint, index) => (
              <KeyPoint {...this.props} $key={index}>
                {keyPoint}
              </KeyPoint>
            ))}
            {
              <KeyPoint {...this.props} gutterBottom>
                {this.keyPoints[this.keyPoints.length - 1]}
              </KeyPoint>
            }
          </>
        ) : null}
      </>
    );
  }
}
globalThis.customElements.define('x-key-points', KeyPoints);
type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
class ExperienceEntry extends DomElement {
  render() {
    return (
      <Entry
        $leftHeading={this.company}
        $rightHeading={this.job}
        $subtext={this.location}
        {...this.props}
      >
        <slot />
      </Entry>
    );
  }
}
globalThis.customElements.define('x-experience', ExperienceEntry);

type Volunteering = {
  organization: string;
  role: string;
};
type VolunteeringEntryProps = {
  [s: string]: any;
} & Volunteering;
const VolunteeringExperience = ({ organization, role, ...other }) => (
  <Entry $leftHeading={organization} $rightHeading={role} {...other} />
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
class ProjectEntry extends DomElement {
  render() {
    return (
      <Entry
        $rightHeading={this.name}
        {...this.props}
        $startDate={undefined}
        $endDate={undefined}
      />
    );
  }
}
globalThis.customElements.define('x-project', ProjectEntry);

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
class HackathonEntry extends DomElement {
  render() {
    return (
      <>
        <style>{`
          .prize {
            margin-bottom: 12px;
          }
        `}</style>
        <Entry
          {...this.props}
          $leftHeading={this.event}
          $rightHeading={this.hack}
          $startDate={undefined}
          $endDate={undefined}
        >
          <Typography $component="p" $variant="caption" class="prize">
            <em>{this.prize}</em>
          </Typography>
        </Entry>
      </>
    );
  }
}
globalThis.customElements.define('x-hackathon', HackathonEntry);

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
class EntryMapper extends DomElement {
  render() {
    console.log({ bleh: this.data });

    return this.data.map((item) => (
      <this.Component
        {...Object.entries(item).map(([key, value]) => [`$${key}`, value])}
      />
    ));
  }
}
globalThis.customElements.define('x-entry-mapper', EntryMapper);

type ResumeData = any;
type PageProps = {
  data: ResumeData;
  [s: string]: any;
};

class Resume extends DomElement {
  render() {
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
          <Header class="header" $data={this.data}>
            {this.data.details.name}
          </Header>
          <main class="main">
            <EntryTopic $heading="Experience">
              <EntryMapper $Component={'x-experience'} $data={this.data.work} />
            </EntryTopic>
            <EntryTopic $heading="Projects">
              <EntryMapper $Component={'x-project'} $data={this.data.projects} />
            </EntryTopic>
          </main>
          <aside class="aside">
            <EntryTopic $heading="Education">
              <EntryMapper $Component={'x-education'} $data={this.data.education} />
            </EntryTopic>
            <EntryTopic $heading="Hackathons">
              <EntryMapper $Component="x-hackathon" $data={this.data.hackathons} />
            </EntryTopic>
            <EntryTopic $heading="Technical skills">
              <LabeledList $items={this.data.technicalSkills} />
            </EntryTopic>
          </aside>
        </div>
      </>
    );
  }
}
globalThis.customElements.define('x-resume', Resume);

export default Resume;
