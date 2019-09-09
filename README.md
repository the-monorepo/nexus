# Monorepo

An assortment of miscellaneous libraries - Saves me time on rewriting build tooling

## Packages

Version | Package | Description
--- | --- | ---
1.0.0-alpha.0 | [`@pshaw/binary-heap`](packages/binary-heap/README.md) | A implementation of a binary heap
1.4.3 | [`@pshaw/convict-util`](packages/convict-util/README.md) | A helper package for reading configs in using convict
1.1.3 | [`@pshaw/resume-template`](packages/resume-template/README.md) | A template you can use to generate resumes
1.0.0-alpha.0 | [`babel-plugin-transform-mobx-jsx`](packages/babel-plugin-transform-mobx-jsx/README.md) | Convert JSX into MobXElement renderables
2.2.3 | [`hook-schema`](packages/hook-schema/README.md) | A package for adding no operation (noop) hooks to incomplete hook objects
4.0.0 | [`jest-mock-functions`](packages/jest-mock-functions/README.md) | Mock all functions inside an array or object literal with Jest
4.0.0 | [`replace-functions`](packages/replace-functions/README.md) | Mock all functions inside an array or object literal
4.0.0 | [`sinon-stub-functions`](packages/sinon-stub-functions/README.md) | Stub all functions inside an arrays, objects and classes with sinon

### UI
Version | Package | Description
--- | --- | ---
1.0.0-alpha.0 | [`mobx-dom`](packages/mobx-dom/README.md) | Create interactive UIs with seamless state management using MobX

### Build tooling
Version | Package | Description
--- | --- | ---
3.0.1 | [`@pshaw/build-util`](build-packages/build-util/README.md) | Tries to save some time by providing basic build configurations
1.0.0-alpha.6 | [`gulp-staged`](build-packages/gulp-staged/README.md) | A gulp plugin that filters out unstaged files from streams
1.0.0-alpha.5 | [`gulp-status-git-filter`](build-packages/gulp-status-git-filter/README.md) | A gulp plugin that filters out files based off their git status

### Documentation
Version | Package | Description
--- | --- | ---
1.4.3 | [`@pshaw/markdown-util`](packages/markdown-util/README.md) | A helper package for writing markdown files
3.1.3 | [`@writeme/core`](packages/writeme-core/README.md) | A readme generator

### Logging
Version | Package | Description
--- | --- | ---
2.0.4 | [`@pshaw/logger`](packages/logger/README.md) | A preformatted, opinionated logger
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
1.0.0-alpha.0 | [`@fault/addon-hook-schema`](packages/fault-addon-hook-schema/README.md) | Hook schema for Fault.js addons
1.0.0-alpha.0 | [`@fault/addon-istanbul`](packages/fault-addon-istanbul/README.md) | Report istanbul coverage
1.0.0-alpha.0 | [`@fault/addon-mutation-localization`](packages/fault-addon-mutation-localization/README.md) | Fault AST localization
1.0.0-alpha.0 | [`@fault/addon-sbfl`](packages/fault-addon-sbfl/README.md) | A spectrum based localization addon
1.0.0-alpha.0 | [`@fault/ast-localization`](packages/fault-ast-localization/README.md) | Fault AST localization
1.0.0-alpha.0 | [`@fault/benchmarker`](packages/fault-benchmarker/README.md) | Benchmarking library for measuring various fault localization/repair algorithms in Fault.js
1.0.0-alpha.0 | [`@fault/istanbul-util`](packages/fault-istanbul-util/README.md) | Helper functions for use with istanbul
1.0.0-alpha.0 | [`@fault/localization-util`](packages/fault-localization-util/README.md) | Utility package containing common fault localization methods
1.0.0-alpha.0 | [`@fault/messages`](packages/fault-messages/README.md) | Helper methods for easier communication between the main @fault/runner process and its workers
1.0.0-alpha.0 | [`@fault/record-faults`](packages/fault-record-faults/README.md) | Record faults
1.0.0-alpha.0 | [`@fault/runner`](packages/fault-runner/README.md) | The official Fault.js test runner
1.0.0-alpha.0 | [`@fault/sbfl-barinel`](packages/fault-sbfl-barinel/README.md) | Barinel algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-dstar`](packages/fault-sbfl-dstar/README.md) | DStar algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-ochiai`](packages/fault-sbfl-ochiai/README.md) | Ochiai algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-op2`](packages/fault-sbfl-op2/README.md) | Op2 algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/sbfl-tarantula`](packages/fault-sbfl-tarantula/README.md) | Tarantula algorithm for use with @fault/addon-sbfl
1.0.0-alpha.0 | [`@fault/tester-mocha`](packages/fault-tester-mocha/README.md) | Use Mocha tests in the fl test runner
1.0.0-alpha.0 | [`@fault/types`](packages/fault-types/README.md) | Package containing all type values for Fault.js


---
This documentation was generated using [writeme](https://www.npmjs.com/package/@pshaw/writeme)
