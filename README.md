# Monorepo

An assortment of miscellaneous libraries - Saves me time on rewriting build tooling

## Packages

Version | Package | Description
--- | --- | ---
1.4.3 | [`@pshaw/convict-util`](misc/convict-util/README.md) | A helper package for reading configs in using convict
1.0.0-alpha.0 | [`@pshaw/html-template`](misc/html-template/README.md) | A HTML template generator
1.0.0-alpha.0 | [`@pshaw/keyed-binary-heap`](misc/keyed-binary-heap/README.md) | A implementation of a binary heap with O(1) search & item updates
1.1.3 | [`@pshaw/resume-template`](misc/resume-template/README.md) | A template you can use to generate resumes
1.0.0-alpha.0 | [`babel-plugin-transform-mobx-jsx`](misc/babel-plugin-transform-mobx-jsx/README.md) | Convert JSX into MobXElement renderables
1.0.0-alpha.0 | [`custom-element`](misc/custom-element/README.md) | TODO
2.2.3 | [`hook-schema`](misc/hook-schema/README.md) | A package for adding no operation (noop) hooks to incomplete hook objects
4.0.0 | [`jest-mock-functions`](misc/jest-mock-functions/README.md) | Mock all functions inside an array or object literal with Jest
4.0.0 | [`replace-functions`](misc/replace-functions/README.md) | Mock all functions inside an array or object literal
1.0.0-alpha.0 | [`scheduler`](misc/scheduler/README.md) | TODO
1.0.0-alpha.0 | [`semantic-documents`](misc/semantic-documents/README.md) | TODO
4.0.0 | [`sinon-stub-functions`](misc/sinon-stub-functions/README.md) | Stub all functions inside an arrays, objects and classes with sinon
1.0.0-alpha.0 | [`tree-suffix-mapper`](misc/tree-suffix-mapper/README.md) | Maps suffixes of a tree to particular values

### UI
Version | Package | Description
--- | --- | ---
1.0.0-alpha.0 | [`mobx-dom`](misc/mobx-dom/README.md) | Create interactive UIs with seamless state management using MobX

### Semantic documents
Version | Package | Description
--- | --- | ---
1.0.0-alpha.0 | [`@semantic-documents/element`](semantic-documents/semantic-documents-element/README.md) | TODO
1.0.0-alpha.0 | [`@semantic-documents/html5-symbols`](semantic-documents/semantic-documents-html5-symbols/README.md) | TODO
1.0.0-alpha.0 | [`@semantic-documents/matcher-info`](semantic-documents/semantic-documents-matcher-info/README.md) | TODO
1.0.0-alpha.0 | [`@semantic-documents/suffix-element`](semantic-documents/semantic-documents-suffix-element/README.md) | TODO
1.0.0-alpha.0 | [`@semantic-documents/suffix-matcher`](semantic-documents/semantic-documents-suffix-matcher/README.md) | TODO

### Build tooling
Version | Package | Description
--- | --- | ---
3.0.1 | [`@pshaw/build-util`](build-packages/build-util/README.md) | Tries to save some time by providing basic build configurations
1.0.0-alpha.6 | [`gulp-staged`](build-packages/gulp-staged/README.md) | A gulp plugin that filters out unstaged files from streams
1.0.0-alpha.5 | [`gulp-status-git-filter`](build-packages/gulp-status-git-filter/README.md) | A gulp plugin that filters out files based off their git status

### Documentation
Version | Package | Description
--- | --- | ---
1.4.3 | [`@pshaw/markdown-util`](misc/markdown-util/README.md) | A helper package for writing markdown files
3.1.3 | [`@writeme/core`](misc/writeme-core/README.md) | A readme generator

### Logging
Version | Package | Description
--- | --- | ---
2.0.4 | [`@pshaw/logger`](misc/logger/README.md) | A preformatted, opinionated logger
1.5.3 | [`@pshaw/winston-formats`](build-packages/winston-formats/README.md) | A set of Winston formats

### ESLint
Version | Package | Description
--- | --- | ---
1.4.2 | [`@pshaw/tslint-preset-core`](build-packages/tslint-preset-core/README.md) | A pratical style preset for TSLint
1.4.2 | [`@pshaw/tslint-preset-react`](build-packages/tslint-preset-react/README.md) | A pratical React style preset for TSLint

### TSLint
Version | Package | Description
--- | --- | ---
1.4.2 | [`@pshaw/eslint-config-core`](build-packages/eslint-config-core/README.md) | A pratical style preset for ESLint
1.4.2 | [`@pshaw/eslint-config-react`](build-packages/eslint-config-react/README.md) | A pratical React style preset for ESLint
1.4.3 | [`@pshaw/eslint-config-typescript`](build-packages/eslint-config-typescript/README.md) | A pratical Typescript style preset for ESLint

### Fault localization
Version | Package | Description
--- | --- | ---
1.0.0-alpha.0 | [`@fault/addon-hook-schema`](faultjs/fault-addon-hook-schema/README.md) | Hook schema for Fault.js addons
1.0.0-alpha.0 | [`@fault/addon-istanbul`](faultjs/fault-addon-istanbul/README.md) | Report istanbul coverage
1.0.0-alpha.0 | [`@fault/addon-mutation-localization`](faultjs/fault-addon-mutation-localization/README.md) | Fault AST localization
1.0.0-alpha.0 | [`@fault/addon-sbfl`](faultjs/fault-addon-sbfl/README.md) | A spectrum based localization addon
1.0.0-alpha.0 | [`@fault/benchmarker`](faultjs/fault-benchmarker/README.md) | Also known as DefectsJS. A benchmarking library for measuring various fault localization/repair algorithms in Fault.js
1.0.0-alpha.0 | [`@fault/istanbul-util`](faultjs/fault-istanbul-util/README.md) | Helper functions for use with istanbul
1.0.0-alpha.0 | [`@fault/localization-util`](faultjs/fault-localization-util/README.md) | Utility package containing common fault localization methods
1.0.0-alpha.0 | [`@fault/messages`](faultjs/fault-messages/README.md) | Helper methods for easier communication between the main @fault/runner process and its workers
1.0.0-alpha.0 | [`@fault/record-faults`](faultjs/fault-record-faults/README.md) | Record faults
1.0.0-alpha.0 | [`@fault/runner`](faultjs/fault-runner/README.md) | The official Fault.js test runner
1.0.0-alpha.0 | [`@fault/sbfl-barinel`](faultjs/fault-sbfl-barinel/README.md) | Barinel algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-dstar`](faultjs/fault-sbfl-dstar/README.md) | DStar algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-ochiai`](faultjs/fault-sbfl-ochiai/README.md) | Ochiai algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-op2`](faultjs/fault-sbfl-op2/README.md) | Op2 algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-tarantula`](faultjs/fault-sbfl-tarantula/README.md) | Tarantula algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/tester-mocha`](faultjs/fault-tester-mocha/README.md) | Use Mocha tests in the fl test runner
1.0.0-alpha.0 | [`@fault/types`](faultjs/fault-types/README.md) | Package containing all type values for Fault.js


---
This documentation was generated using [writeme](https://www.npmjs.com/package/@pshaw/writeme)
