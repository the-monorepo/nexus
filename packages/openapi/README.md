# Generate OpenAPI schemas from examples

## Installation

`npm install --save @by-example/openapi`
or
`yarn add @by-example/openapi`

## How to use it
```js
import { createSchema } from '@by-example/openapi';
const nameSchemaExamples = [{
  firstName: 'Patrick',
  lastName: 'Shaw'
}, {
  firstName: 'John',
  middleName: 'Oliver',
  lastName: 'Smith'
}];

// firstName and lastName will be marked as required
const nameSchema = createSchema(nameSchemaExamples);
{
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Test',
  },
  paths: {},
  components: {
    name: nameSchema
  },
}
```