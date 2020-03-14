import * as React from 'react';
import * as ReactDOM from 'react-dom';

import cx from 'classnames';

import app from './index.scss';
import styles from './section.scss';

export const Section = ({ children, noGutterBottom }) => (
  <section className={cx(styles.section, noGutterBottom ? null : styles.gutterBottom)}>
    {children}
  </section>
);

export const Typography = ({
  Component,
  className: className,
  typographyclassName,
  noGutterBottom,
  longform,
  children,
}) => (
  <Component 
    className={cx(
      className,
      typographyclassName,
      noGutterBottom ? null : styles.gutterBottom,
      longform ? styles.longform : null,
    )}
  >
    {children}
  </Component>
);

export const H1 = (props) => (
  <Typography {...props} Component="h1" typographyclassName={styles.h1} />
);

export const H2 = (props) => (
  <Typography {...props} Component="h2" typographyclassName={styles.h2} />
);

export const H3 = (props) => (
  <Typography {...props} Component="h3" typographyclassName={styles.h3} />
);

export const H4 = (props) => (
  <Typography {...props} Component="h4" typographyclassName={styles.h4} />
);

export const H5 = (props) => (
  <Typography {...props} Component="h5" typographyclassName={styles.h5} />
);

export const H6 = (props) => (
  <Typography {...props} Component="h6" typographyclassName={styles.h6} />
);

export const P = (props) => (
  <Typography {...props} Component="p" typographyclassName={styles.p} />
);

export const ImportantInformation = (props) => (
  <Typography {...props} Component="p" typographyclassName={styles.h400} />
);

export const Article = ({ children }) => (
  <article className={styles.section}>
    {children}
  </article>
)

export const Page = ({ children }) => (
  <section className={styles.page}>
    {children}
  </section>
)

export const Footnote = (props) => (
  <Typography {...props} Component="p" typographyclassName={styles.footnote} />
);

export const ListSection = ({ children, noGutterBottom }) => (
  <section className={cx(styles.listSection, noGutterBottom ? null : styles.gutterBottom)}>
    {children}
  </section>
);

export const Ol = ({ children }) => (
  <ol className={cx(styles.ol)}>
    {children}
  </ol>
);

export const Ul = ({ children }) => (
  <ul className={cx(styles.ul)}>
    {children}
  </ul>
);

export const Header = ({ children, noGutterBottom }) => (
  <header className={cx(styles.header, noGutterBottom ? null : styles.gutterBottom)}>
    {children}
  </header>
);

export const HGroup = ({ children, noGutterBottom }) => (
  <hgroup className={cx(styles.header, noGutterBottom ? null : styles.gutterBottom)}>
    {children}    
  </hgroup>
);

export const Panel = ({ children, noGutterBottom }) => (
  <section className={cx(styles.panel, noGutterBottom ? null : styles.gutterBottom)}>
    {children}
  </section>
);

export const Dl = ({ children }) => (
  <dl className={styles.dl}>
    {children}
  </dl>
);

export const Dt = ({ children }) => (
  <dt className={styles.dt}>
    {children}
  </dt>
);

export const Dd = ({ children }) => (
  <dd className={styles.dd}>
    {children}
  </dd>
);

export const Li = ({ children }) => (
  <li className={styles.li}>{children}</li>
);

ReactDOM.render(
  <div className={app.page}>
    <Page>
      <HGroup>
        <H1>Page heading 1</H1>
        <H2>Page subheading 1</H2>
      </HGroup>

      <Section>
        <H1>Payment method</H1>
        <Panel>
          <H1>Errr... Cbs mocking</H1>
          <P noGutterBottom>Some stuff goes here I guess</P>
        </Panel>
      </Section>

      <Section>
        <H1>Contact details</H1>
        <P>The technical contact's postal address is the address that will reflect in the invoice</P>
        <Section>
          <H1>Technical contact</H1>
          <Panel>
            <Dl>
              <Dt>Company name</Dt>
              <Dd>Atlassian</Dd>
              
              <Dt>Name</Dt>
              <Dd>Patrick Shaw</Dd>

              <Dt>Address</Dt>
              <Dd>12 Some place, Box Hill, VIC 3109, Australia</Dd>
            </Dl>
          </Panel>
          <P>Hmm</P>
        </Section>
        
        <Section>
          <H1>Billing contact</H1>
          <Panel>
            <Dl>
              <Dt>Company name</Dt>
              <Dd>Atlassian</Dd>
              
              <Dt>Name</Dt>
              <Dd>Patrick Shaw</Dd>

              <Dt>Address</Dt>
              <Dd>12 Some place, Box Hill, VIC 3109, Australia</Dd>
            </Dl>            
          </Panel>
        </Section>
      </Section>

      <ListSection>
        <P>A paragraph: </P>
        <Ol>
          <Li>Test</Li>
          <Li>Test</Li>
          <Li>Test</Li>
        </Ol>
      </ListSection>

      <ListSection>
        <H1>A heading: </H1>
        <Ul>
          <Li>Test</Li>
          <Li>Test</Li>
          <Li>Test</Li>
        </Ul>
      </ListSection>

      <Footnote>
        Your billing statement will display Atlassian B.V., located in Amsterdam, Netherlands. Atlassian Pty Limited, our principal place of business, is at Level 6, 341 George Street, Sydney NSW Australia 2000.

        Your credit card issuer may charge foreign transaction or cross-border fees in addition to the total price above.
      </Footnote>
    </Page>
  </div>,
  document.getElementById('root')
);