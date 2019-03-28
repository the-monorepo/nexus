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
class ResumeLinkTextElement extends HTMLElement {
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
window.customElements.define('x-resume-link', ResumeLinkTextElement);

type ContactProps = {
  icon: {
    src: string;
    [s: string]: any;
  };
  href: string;
  [s: string]: any;
};
class ContactElement extends HTMLElement {
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
          <x-entry-link className='contact' href={this.href}>
            <img {...this.icon} aria-hidden className='icon' />
            <x-resume-link href={this.href}><slot/></x-resume-link>
          </x-entry-link>
        </>
      );
  }
}

window.customElements.define('x-contact', ContactElement); 

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
class HeaderElement extends HTMLElement {
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
              <x-contact icon={{ src: envelope }} href={`mailto:${this.data.details.email}`}>
                Email
              </x-contact>
              <x-contact icon={{ src: linkedin }} href={this.data.details.linkedin}>
                LinkedIn
              </x-contact>
              <x-contact icon={{ src: github }} href={this.data.details.github}>
                Github
              </x-contact>
            </section>
            </header>
          </>
        );
  }
}
window.customElements.define('x-header', HeaderElement)

type TopicProps = {
  heading: any;
  otherClasses: any;
  [s: string]: any;
};
class TopicElement extends HTMLElement {
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
window.customElements.define('x-topic', TopicElement);

type EntryTopicProps = {
  [s: string]: any;
};
class EntryTopicElement extends HTMLElement {
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
          <x-topic className='entryTopic' heading={this.heading}>
            <slot />
          </x-topic>  
        </>
      )    
  }
}
window.customElements.define('x-entry-topic', EntryTopicElement);

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

class EntryElement extends HTMLElement {
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
              <x-entry-heading
                component="h1"
                className='entryHeading leftHeading'
              >
                {this.leftHeading} /&nbsp;
              </x-entry-heading>
            ) : null}
            <x-entry-heading component="h2" className='entryHeading'>
              {this.rightHeading}
            </x-entry-heading>
            {/*TODO: Subtext won't appear if no date*/}
            {this.startDate || this.endDate ? (
              <x-entry-text component="p" variant="caption" className='subtext'>
                <x-date-range start={this.startDate} end={this.endDate} format={this.dateFormat} />
                {this.subtext ? `, ${this.subtext}` : null}
              </x-entry-text>
            ) : null}
            <slot/>
            {this.description ? (
              <x-entry-text component="p" color="textSecondary">
                {this.description.replace(/\.?\s*$/, '.')}
              </x-entry-text>
            ) : null}
            <x-key-points component="p" color="textSecondary" keyPoints={this.keyPoints} />
          </section>
        </>
      )
  }
}
window.customElements.define('x-entry', EntryElement)

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
class EducationElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <x-entry
          leftHeading={this.school}
          rightHeading={this.course}
          subtext={`GPA: ${this.grade.gpa}, WAM: ${this.grade.wam}`}
          {...this}
        />    
      );
  }
}
window.customElements.define('x-education', EducationElement);

type DateRangeProps = {
  start?: Date;
  end?: Date;
  format?: string;
};
class DateRangeElement extends HTMLElement {
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
window.customElements.define('x-date-range', DateRangeElement);

type EntryHeadingProps = {
  [s: string]: any;
};
class EntryHeadingElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Typography variant="subtitle1" component="h1" {...this}>
          <slot/>
        </Typography>    
      );
  }
}
window.customElements.define('x-entry-heading', EntryHeadingElement);

type EntryLinkProps = {
  [s: string]: any;
};
class EntryLinkElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Link variant="caption" color="secondary" {...this}>
          <slot/>
        </Link>    
      );
  }
}

window.customElements.define('x-entry-link', EntryLinkElement);

type EntryTextProps = {
  [s: string]: any;
};
class EntryTextElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <Typography variant="caption" color="textSecondary" {...this}>
          <slot/>
        </Typography>
    );
  }
}
window.customElements.define('x-entry-text', EntryTextElement);

type ListLabelProps = {
  [s: string]: any;
};
class ListLabelElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          <style>{`
            .label {
              font-weight: ${theme.typography.fontWeightMedium};
            }
          `}</style>
          <x-entry-text className='label' color="textPrimary" {...this}>
            <slot/>
          </x-entry-text>  
        </>
      );
  }
}
window.customElements.define('x-list-label', ListLabelElement);

type LabeledListProps = {
  [s: string]: any;
};
class LabeledListElement extends HTMLElement {
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
              <x-list-label component="span" style={{ display: 'inline' }} paragraph={false}>
                {label}:
              </x-list-label>{' '}
              <x-entry-text component="span" style={{ display: 'inline' }} paragraph={false}>
                {skillsSentence(items)}
              </x-entry-text>
            </p>
          ))}
        </div>

        </>
      )
  }
}
window.customElements.define('x-labeled-list', LabeledListElement);

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
class KeyPointElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <x-entry-text component="span" {...this}>
          <slot/>
        </x-entry-text>    
      );
  }
}
window.customElements.define('x-key-point', KeyPointElement);
type KeyPoint = string;
type KeyPointsProps = {
  keyPoints?: KeyPoint[];
  [s: string]: any;
};
class KeyPointsElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <>
          {
            this.keyPoints && this.keyPoints.length > 0 ? <>
              {this.keyPoints.slice(0, -1).map((keyPoint, index) => (
                <x-key-point {...this} key={index}>
                  {keyPoint}
                </x-key-point>
              ))}
              {
                <x-key-point {...this} gutterBottom>
                  {this.keyPoints[this.keyPoints.length - 1]}
                </x-key-point>
              }
            </> : null
          }
        </>
      );
  }
}
window.customElements.define('x-key-points', KeyPointsElement);
type Experience = {
  company: string;
  job: string;
  location: string;
};
type ExperienceEntryProps = {
  [s: string]: any;
} & Experience;
class ExperienceElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <x-entry leftHeading={this.company} rightHeading={this.job} subtext={this.location} {...this} />
      )
  }
}
window.customElements.define('x-experience', ExperienceElement);

type Volunteering = {
  organization: string;
  role: string;
};
type VolunteeringEntryProps = {
  [s: string]: any;
} & Volunteering;
const VolunteeringExperience = ({ organization, role, ...other }) => (
  <x-entry leftHeading={organization} rightHeading={role} {...other} />
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
class ProjectElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
      .appendChild(
        <x-entry rightHeading={this.name} {...this} startDate={undefined} endDate={undefined} />        
      );
  }
}
window.customElements.define('x-project', ProjectElement);

type Hackathon = {
  hack?: string;
  event?: string;
  prize?: string;
  technologies?: string[];
};
type HackathonEntryProps = {
  [s: string]: any;
} & Hackathon;
class HackathonElement extends HTMLElement {  
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(
      <>
        <style>{`
          .prize {
            margin-bottom: 12px;
          }
        `}</style>
          <x-entry
            {...this}
            leftHeading={this.event}
            rightHeading={this.hack}
            startDate={undefined}
            endDate={undefined}
      >
      <Typography component="p" variant="caption" className='prize'>
        <em>{this.prize}</em>
      </Typography>
    </x-entry>
      </>
    );
  }
}
window.customElements.define('x-hackathon', HackathonElement);

type EntryData = any;
type EntryMapperProps = {
  data: EntryData;
  [s: string]: any;
};
const EntryMapper = ({ Component, data }) => data.map((item, index) => <Component {...item} key={index}/>);
class EntryMapperElement extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).appendChild(<>
      {this.data.map((item) => <this.Component {...item} />)}
    </>); 
  }
}
window.customElements.define('x-entry-mapper', EntryMapperElement);

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
      <x-header
        className={classes.header}
        data={data}
      >
        {data.details.name}
      </x-header>
      <main className={classes.main}>
        <x-entry-topic heading="Experience">
          <x-entry-mapper Component={'x-experience'} data={data.work} />
        </x-entry-topic>
        <x-entry-topic heading="Projects">
          <x-entry-mapper Component={'x-project'} data={data.projects} />
        </x-entry-topic>
      </main>
      <aside className={classes.aside}>
        <x-entry-topic heading="Education">
          <x-entry-mapper Component={'x-education'} data={data.education} />
        </x-entry-topic>
        <x-entry-topic heading="Hackathons">
          <x-entry-mapper Component={'x-hackathon'} data={data.hackathons} />
        </x-entry-topic>
        <x-entry-topic heading="Technical skills">
          <x-labeled-list items={data.technicalSkills} />
        </x-entry-topic>
      </aside>
    </div>
  );
})();
