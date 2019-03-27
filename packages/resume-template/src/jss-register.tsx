import jss from 'jss';
import * as jssGlobal from 'jss-global';
import * as jssNested from 'jss-nested';
import * as jssCamelCase from 'jss-plugin-camel-case';
jss
  .use(jssGlobal.default())
  .use(jssNested.default())
  .use(jssCamelCase.default())
  .createStyleSheet({
    '@global': {
      // TODO: * seems to break types
      '*': {
        padding: 0,
        margin: 0,
      },
    } as any,
  })
  .attach();