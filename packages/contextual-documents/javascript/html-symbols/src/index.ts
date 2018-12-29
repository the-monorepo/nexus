import { MatcherInfo } from '@contextual-documents/matcher-info';

export const SECTION = Symbol('section');
export const HEADER = Symbol('header');
export const FOOTER = Symbol('footer');
export const PARAGRAPH = Symbol('paragraph');
export const LABEL = Symbol('label');

const HEADING_SYMBOLS = [
  Symbol('h1'),
  Symbol('h2'),
  Symbol('h3'),
  Symbol('h4'),
  Symbol('h5'),
  Symbol('h6'),
];

export const [HEADING_1, HEADING_2, HEADING_3, HEADING_4, HEADING_5, HEADING_6] =
  HEADING_SYMBOLS;
export type MatcherInfoFactory = (
  className: string,
) => (...children: MatcherInfo[]) => MatcherInfo;

const simpleMatcherInfoFactory =
  (type: symbol): MatcherInfoFactory =>
  (className) =>
  (...children) =>
    new MatcherInfo(type, className, children);

export const section: MatcherInfoFactory = simpleMatcherInfoFactory(SECTION);
export const header: MatcherInfoFactory = simpleMatcherInfoFactory(HEADER);
export const footer: MatcherInfoFactory = simpleMatcherInfoFactory(FOOTER);
export const h1: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_1);
export const h2: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_2);
export const h3: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_3);
export const h4: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_4);
export const h5: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_5);
export const h6: MatcherInfoFactory = simpleMatcherInfoFactory(HEADING_6);
export const p: MatcherInfoFactory = simpleMatcherInfoFactory(PARAGRAPH);
export const label: MatcherInfoFactory = simpleMatcherInfoFactory(LABEL);
