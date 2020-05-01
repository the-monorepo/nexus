# Css Color Checker
[![npm version](https://badge.fury.io/js/css-color-checker.svg)](https://badge.fury.io/js/css-color-checker) 
[![Build Status](https://travis-ci.org/PatrickShaw/css-color-checker.svg?branch=master)](https://travis-ci.org/PatrickShaw/css-color-checker) 
[![codecov](https://codecov.io/gh/PatrickShaw/css-color-checker/branch/master/graph/badge.svg)](https://codecov.io/gh/PatrickShaw/css-color-checker) 
[![Greenkeeper badge](https://badges.greenkeeper.io/PatrickShaw/css-color-checker.svg)](https://greenkeeper.io/)

A set of functions that check whether a string matches a particular color format.

```js
import cssColorFormat from 'css-color-checker';

if (cssColorFormat('#FFF')) {
  console.log("It's a color!");
}

// Valid CSS color values return a string
cssColorFormat('#FFF'); // Returns 'hex'
cssColorFormat('#FFFFFF'); // Returns 'hex'
cssColorFormat('#FFFFFFFF'); // Returns 'hex'
cssColorFormat('rgb(255,255,255)'); // Returns 'rgb'
cssColorFormat('rgba(255,255,255,1)'); // Returns 'rgba'
cssColorFormat('hsl(0,0%,0%)'); // Returns 'hsl'
cssColorFormat('hsla(255,255,255,0.1)'); // Returns 'hsla'
cssColorFormat('hwb(360,0%,0%)'); // Returns 'hwb'
cssColorFormat('red'); // Returns 'red'

// Everything else return null
cssColorFormat('Not a color'); // false
cssColorFormat('#F'); // false
```


## Installation
`npm install --save css-color-checker` or `yarn add css-color-checker`

## How to use it
**Note:** If there is a leading or trailing space in the css color string (E.g. "` #FFFFFF`"), all color matching functions will return false.

### Examples
[See all examples here](EXAMPLES.md)
