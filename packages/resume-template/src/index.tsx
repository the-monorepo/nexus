import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';
import jss from 'jss';
import * as jssGlobal from 'jss-global';
import * as jssNested from 'jss-nested';
import * as React from 'react';

import { Page } from './components';

export function createResume() {
  const theme = createMuiTheme({
    typography: {
      useNextVariants: true,
      fontWeightMedium: 600,
      subtitle1: {
        fontWeight: 400,
      },
      subtitle2: {
        fontWeight: 400,
      },
      fontFamily: ['Open Sans', 'sans-serif'].join(','),
    },
  });

  jss
    .use(jssGlobal.default())
    .use(jssNested.default())
    .createStyleSheet({
      '@global': {
        // TODO: * seems to break types
        '*': {
          padding: 0,
          margin: 0,
          'margin-block-start': 0,
          'margin-block-end': 0,
        },
        a: {
          color: 'inherit' /* blue colors for links too */,
          'text-decoration': 'inherit' /* no underline */,
        },
      } as any,
    })
    .attach();

  const Resume = ({ data }) => (
    <MuiThemeProvider theme={theme}>
      <Page data={data} />
    </MuiThemeProvider>
  );
  return Resume;
}
