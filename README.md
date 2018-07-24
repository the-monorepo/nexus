# Css Color Checker
[![npm version](https://badge.fury.io/js/css-color-checker.svg)](https://badge.fury.io/js/css-color-checker) 
[![Build Status](https://travis-ci.org/PatrickShaw/css-color-checker.svg?branch=master)](https://travis-ci.org/PatrickShaw/css-color-checker) 
[![codecov](https://codecov.io/gh/PatrickShaw/css-color-checker/branch/master/graph/badge.svg)](https://codecov.io/gh/PatrickShaw/css-color-checker)

A set of functions that check whether a string matches a particular color format.

```js
import { isCssColor } from 'css-color-checker';
isCssColor('#FFF');
isCssColor('#FFFFFF');
isCssColor('#FFFFFFFF');
isCssColor('rgb(255,255,255)');
isCssColor('rgba(255,255,255,1)');
isCssColor('hsl(0,0%,0%)');
isCssColor('hsla(255,255,255,0.1)');
isCssColor('hwb(360,0%,0%)');
isCssColor('red');
```


## Installation
`npm install --save css-color-checker` or `yarn add css-color-checker`

## How to use it
**Note:** If there is a leading or trailing space in the css color string (E.g. "` #FFFFFF`"), all color matching functions will return false.

### Examples
[See all examples here](EXAMPLES.md)