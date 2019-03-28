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
      main: '#FF0000',
    },
    // TODO
    getContrastText: () => '#000000',
  },
};

const Typography = ({ children }: any) => <p>{children}</p>;

const Link = props => <Typography {...props} />;

type ResumeLinkTextProps = {
  [s: string]: any;
};
class ResumeLinkText extends HTMLElement {
  connectedCallback() {     
    this.attachShadow({ mode: 'open' }).appendChild(
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
        <span className='webLink'>
          <slot />
        </span>
        {/*
          People who print the resume can't click on the link, obviously, 
          so have to show the link as text
        */}          
        <span className='printLink'>
          {this.href.replace(/(https?:\/\/(www\.)?|mailto:)/, '')}
        </span>
      </>
    );
  }
}
window.customElements.define('x-resume-link', ResumeLinkText);

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
class Contact extends HTMLElement {
  connectedCallback() {
    const color = theme.palette.getContrastText(theme.palette.primary.main);
    console.warn('EEEEEEEEEEEE', this.icon)
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          {console.warn('RAWRAWRAWR', this.icon)}
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
          <EntryLink className='contact' href={this.href}>
            <img {...this.icon} aria-hidden className='icon' />
            <ResumeLinkText href={this.href}><slot/></ResumeLinkText>
          </EntryLink>
        </>
      );
  }
}

window.customElements.define('x-contact', Contact); 

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
`
class Header extends HTMLElement {
  connectedCallback() {
    const color = theme.palette.getContrastText(theme.palette.primary.main);
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          <style>{`
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
          <header className='header pageGrid'>
            <div className='headingContainer'>
              <Typography
                variant="h3"
                className='heading'
              >
                <slot/>
              </Typography>
            </div>
            <section>
              {/*
                <Contact>
                  <a href={data.details.website}>{data.details.website}</a>
                </Contact>
              */}
              <Contact icon={{ src: envelope }} href={`mailto:${this.data.details.email}`}>
                Email
              </Contact>
              <Contact icon={{ src: linkedin }} href={this.data.details.linkedin}>
                LinkedIn
              </Contact>
              <Contact icon={{ src: github }} href={this.data.details.github}>
                Github
              </Contact>
            </section>
            </header>
          </>
        );
  }
}
window.customElements.define('x-header', Header)

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
class Topic extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
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
              className='heading'
            >
              {this.heading}
            </Typography>
            <slot/>
          </section>
        </>
      )
  }
}
window.customElements.define('x-topic', Topic);

type EntryTopicProps = {
  [s: string]: any;
};
class EntryTopic extends HTMLElement {
  connectedCallback() {
    // TODO: Get rid of the !important at some point :P
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          <style>{`
            ::slotted(*) {
              margin-bottom: 24px !important;
            }
          `}</style>
          <Topic className='entryTopic' heading={this.heading}>
            <slot />
          </Topic>  
        </>
      )    
  }
}
window.customElements.define('x-entry-topic', EntryTopic);

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

class Entry extends HTMLElement {
  private _dateFormat?: string;
  set dateFormat(value) {
    this._dateFormat = value;
  }
  get dateFormat() {
    return this._dateFormat || 'MMM YYYY'
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
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
              <EntryHeading
                component="h1"
                className='entryHeading leftHeading'
              >
                {this.leftHeading} /&nbsp;
              </EntryHeading>
            ) : null}
            <EntryHeading component="h2" className='entryHeading'>
              {this.rightHeading}
            </EntryHeading>
            {/*TODO: Subtext won't appear if no date*/}
            {this.startDate || this.endDate ? (
              <EntryText component="p" variant="caption" className='subtext'>
                <DateRange start={this.startDate} end={this.endDate} format={this.dateFormat} />
                {this.subtext ? `, ${this.subtext}` : null}
              </EntryText>
            ) : null}
            <slot/>
            {this.description ? (
              <EntryText component="p" color="textSecondary">
                {this.description.replace(/\.?\s*$/, '.')}
              </EntryText>
            ) : null}
            <KeyPoints component="p" color="textSecondary" keyPoints={this.keyPoints} />
          </section>
        </>
      )
  }
}
window.customElements.define('x-entry', Entry)

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
class EducationEntry extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Entry
          leftHeading={this.school}
          rightHeading={this.course}
          subtext={`GPA: ${this.grade.gpa}, WAM: ${this.grade.wam}`}
          {...this}
        />    
      );
  }
}
window.customElements.define('x-education', EducationEntry);

type DateRangeProps = {
  start?: Date;
  end?: Date;
  format?: string;
};
class DateRange extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open'})
      .appendChild(
        <>
          {formatDate(this.start, this.format, { awareOfUnicodeTokens: true })}
          {this.end !== undefined ? (
            <>
              {' '}
              <span aria-label="to">-</span>{' '}
              {this.end === null
                ? 'Current'
                : formatDate(this.end, this.format, { awareOfUnicodeTokens: true })}
            </>
          ) : null}
        </>    
      );
  }
}
window.customElements.define('x-date-range', DateRange);

type EntryHeadingProps = {
  [s: string]: any;
};
class EntryHeading extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Typography variant="subtitle1" component="h1" {...this}>
          <slot/>
        </Typography>    
      );
  }
}
window.customElements.define('x-entry-heading', EntryHeading);

type EntryLinkProps = {
  [s: string]: any;
};
class EntryLink extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Link variant="caption" color="secondary" {...this}>
          <slot/>
        </Link>    
      );
  }
}

window.customElements.define('x-entry-link', EntryLink);

type EntryTextProps = {
  [s: string]: any;
};
class EntryText extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Typography variant="caption" color="textSecondary" {...this}>
          <slot/>
        </Typography>
    );
  }
}
window.customElements.define('x-entry-text', EntryText);

type ListLabelProps = {
  [s: string]: any;
};
class ListLabel extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          <style>{`
            .label {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
          <EntryText className='label' color="textPrimary" {...this}>
            <slot/>
          </EntryText>  
        </>
      );
  }
}
window.customElements.define('x-list-label', ListLabel);

type LabeledListProps = {
  [s: string]: any;
};
class LabeledList extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          <style>{`
                  .list>*:not(:last-child) {
                      margin-bottom: 12px;
                  }
          `}
          </style>
          <div className='list'>
          {this.items.map(({ label, items }) => (
            <p>
              <ListLabel component="span" style={{ display: 'inline' }} paragraph={false}>
                {label}:
              </ListLabel>{' '}
              <EntryText component="span" style={{ display: 'inline' }} paragraph={false}>
                {skillsSentence(items)}
              </EntryText>
            </p>
          ))}
        </div>

        </>
      )
  }
}
window.customElements.define('x-labeled-list', LabeledList);

const Ul = (() => {
  const { classes } = jss
    .createStyleSheet({
      list: {
        listStylePosition: 'inside',
        paddingLeft: 0,
        marginBlockStart: '0em',
        marginBlockEnd: '0em',
      },
    })
    .attach();
  return ({ children, classes }: any) => <ul className={classes.list}>{children}</ul>;
})();

type KeyPointItemProps = {
  [s: string]: any;
};
class KeyPoint extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <EntryText component="span" {...this}>
          <slot/>
        </EntryText>    
      );
  }
}
window.customElements.define('x-key-point', KeyPoint);
type KeyPoint = string;
type KeyPointsProps = {
  keyPoints?: KeyPoint[];
  [s: string]: any;
};
class KeyPoints extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          {
            this.keyPoints && this.keyPoints.length > 0 ? <>
              {this.keyPoints.slice(0, -1).map((keyPoint, index) => (
                <KeyPoint {...this} key={index}>
                  {keyPoint}
                </KeyPoint>
              ))}
              {
                <KeyPoint {...this} gutterBottom>
                  {this.keyPoints[this.keyPoints.length - 1]}
                </KeyPoint>
              }
            </> : null
          }
        </>
      );
  }
}
window.customElements.define('x-key-points', KeyPoints);
type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
class ExperienceEntry extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Entry leftHeading={this.company} rightHeading={this.job} subtext={this.location} {...this} />
      )
  }
}
window.customElements.define('x-experience', ExperienceEntry);

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
class ProjectEntry extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Entry rightHeading={this.name} {...this} startDate={undefined} endDate={undefined} />        
      );
  }
}
window.customElements.define('x-project', ProjectEntry);

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
class HackathonEntry extends HTMLElement {  
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(
      <>
        <style>{`
          .prize {
            margin-bottom: 12px;
          }
        `}</style>
          <Entry
            {...this}
            leftHeading={this.event}
            rightHeading={this.hack}
            startDate={undefined}
            endDate={undefined}
      >
      <Typography component="p" variant="caption" className='prize'>
        <em>{this.prize}</em>
      </Typography>
    </Entry>
      </>
    );
  }
}
window.customElements.define('x-hackathon', HackathonEntry);

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
class EntryMapper extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(<>
      {this.data.map((item) => <this.Component {...item} />)}
    </>); 
  }
}
window.customElements.define('x-entry-mapper', EntryMapper);

type ResumeData = any;
type PageProps = {
  data: ResumeData;
  [s: string]: any;
};
export const Page = (() => {
  const { classes } = jss
    .createStyleSheet({
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
    })
    .attach();
  return ({ data }) => (
    <div className={classNames(classes.pageContainer, classes.pageGrid)}>
      <Header
        className={classes.header}
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
    </div>
  );
})();
