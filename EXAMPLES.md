# Examples

## cssColorFormat

`cssColorFormat` will return a string representing the color type for any input that returns true in the functions below and null for everything else.
E.g. `cssColorFormat('#FFFFFF')` returns 'hex' and `cssColorFormat('rgb(255,255,255)')` returns 'rgb', `cssColorFormat('bleh')` returns null.

## isCssColor

Exactly the same as `cssColorFormat` except, where `cssColorFormat` returns a `string`, `isCssColor` returns `true` and where `cssColorFormat` returns `null`, `isCssColor` returns `false`
## Hex colors

### Inputs that return true
```js
isHexColor("#fff"); // true
isHexColor("#FFF"); // true
isHexColor("#FFFFFF"); // true
isHexColor("#FFFFFFFF"); // true
isHexColor("#000"); // true
isHexColor("#000000"); // true
isHexColor("#00000000"); // true
```

### Inputs that return true
```js
isHexColor("#f"); // false
isHexColor("#F"); // false
isHexColor("#FF"); // false
isHexColor("#FFFF"); // false
isHexColor("#FFFFF"); // false
isHexColor("#0000000"); // false
isHexColor("#0"); // false
isHexColor("#00"); // false
isHexColor("#0000"); // false
isHexColor("#00000"); // false
isHexColor("#GGG"); // false
isHexColor("#GGGGGG"); // false
isHexColor("F"); // false
isHexColor("G"); // false
isHexColor("0"); // false
isHexColor(" #FFFFFF"); // false
isHexColor("#FFFFFF "); // false
```

## rgb(...) colors

### Inputs that return true
```js
isRgbColor("rgb(0,0,0)"); // true
isRgbColor("rgb(255,255,255)"); // true
isRgbColor("rgb(.001,.001,.001)"); // true
isRgbColor("rgb(0.001,0.001,0.001)"); // true
isRgbColor("rgb(254.999,254.999,254.999)"); // true
isRgbColor("rgb(1,1,1)"); // true
isRgbColor("rgb(  0,0,0)"); // true
isRgbColor("rgb(  255,255,255)"); // true
isRgbColor("rgb(0  ,0,0)"); // true
isRgbColor("rgb(255  ,255,255)"); // true
isRgbColor("rgb(0,  0,0)"); // true
isRgbColor("rgb(255,  255,255)"); // true
isRgbColor("rgb(0,0  ,0)"); // true
isRgbColor("rgb(255,255  ,255)"); // true
isRgbColor("rgb(0,0,  0)"); // true
isRgbColor("rgb(255,255,  255)"); // true
isRgbColor("rgb(0,0,0  )"); // true
isRgbColor("rgb(255,255,255  )"); // true
```

### Inputs that return true
```js
isRgbColor("rgb(-0.001,-0.001,-0.001)"); // false
isRgbColor("rgb(255.001,255.001,255.001)"); // false
isRgbColor("rgb0,0,0"); // false
isRgbColor("(255,255,255)"); // false
isRgbColor("(0,0,0)"); // false
isRgbColor("rgb255,255,255)"); // false
isRgbColor("rgb(0,0,0"); // false
isRgbColor(" rgb(255,255,255)"); // false
isRgbColor("rgb(0,0,0) "); // false
isRgbColor("RGB(0,0,0)"); // false
```

## rgba(...) colors

### Inputs that return true
```js
isRgbaColor("rgba(0,0,0,0)"); // true
isRgbaColor("rgba(255,255,255,1)"); // true
isRgbaColor("rgba(.001,.001,.001,.001)"); // true
isRgbaColor("rgba(0.001,0.001,0.001,0.001)"); // true
isRgbaColor("rgba(254.999,254.999,254.999,.999)"); // true
isRgbaColor("rgba(254.999,254.999,254.999,0.999)"); // true
isRgbaColor("rgba(1,1,1,1)"); // true
isRgbaColor("rgba(  0,0,0,0)"); // true
isRgbaColor("rgba(  255,255,255,1)"); // true
isRgbaColor("rgba(0  ,0,0,0)"); // true
isRgbaColor("rgba(255  ,255,255,1)"); // true
isRgbaColor("rgba(0,  0,0,0)"); // true
isRgbaColor("rgba(255,  255,255,1)"); // true
isRgbaColor("rgba(0,0  ,0,0)"); // true
isRgbaColor("rgba(255,255  ,255,1)"); // true
isRgbaColor("rgba(0,0,  0,0)"); // true
isRgbaColor("rgba(255,255,  255,1)"); // true
isRgbaColor("rgba(0,0,0  ,0)"); // true
isRgbaColor("rgba(255,255,255  ,1)"); // true
isRgbaColor("rgba(0,0,0,  0)"); // true
isRgbaColor("rgba(255,255,255,  1)"); // true
isRgbaColor("rgba(0,0,0,0  )"); // true
isRgbaColor("rgba(255,255,255,1  )"); // true
```

### Inputs that return true
```js
isRgbaColor("rgba(-0.001,-0.001,-0.001,-0.001)"); // false
isRgbaColor("rgba(255.001,255.001,255.001,1.001)"); // false
isRgbaColor("rgba0,0,0,0"); // false
isRgbaColor("(255,255,255,1)"); // false
isRgbaColor("(0,0,0,0)"); // false
isRgbaColor("rgba255,255,255,1)"); // false
isRgbaColor("rgba(0,0,0,0"); // false
isRgbaColor(" rgba(255,255,255,1)"); // false
isRgbaColor("rgba(0,0,0,0) "); // false
isRgbaColor("RGBA(0,0,0,0)"); // false
```

## hsl(...) colors

### Inputs that return true
```js
isHslColor("hsl(0,0%,0%)"); // true
isHslColor("hsl(360,100%,100%)"); // true
isHslColor("hsl(.001,.001%,.001%)"); // true
isHslColor("hsl(0.001,0.001%,0.001%)"); // true
isHslColor("hsl(359.999,99.999%,99.999%)"); // true
isHslColor("hsl(1,1%,1%)"); // true
isHslColor("hsl(  0,0%,0%)"); // true
isHslColor("hsl(  360,100%,100%)"); // true
isHslColor("hsl(0  ,0%,0%)"); // true
isHslColor("hsl(360  ,100%,100%)"); // true
isHslColor("hsl(0,  0%,0%)"); // true
isHslColor("hsl(360,  100%,100%)"); // true
isHslColor("hsl(0,0%  ,0%)"); // true
isHslColor("hsl(360,100%  ,100%)"); // true
isHslColor("hsl(0,0%,  0%)"); // true
isHslColor("hsl(360,100%,  100%)"); // true
isHslColor("hsl(0,0%,0%  )"); // true
isHslColor("hsl(360,100%,100%  )"); // true
```

### Inputs that return true
```js
isHslColor("hsl(-0.001,-0.001%,-0.001%)"); // false
isHslColor("hsl(360.001,100.001%,100.001%)"); // false
isHslColor("hsl0,0%,0%"); // false
isHslColor("(360,100%,100%)"); // false
isHslColor("(0,0%,0%)"); // false
isHslColor("hsl360,100%,100%)"); // false
isHslColor("hsl(0,0%,0%"); // false
isHslColor(" hsl(360,100%,100%)"); // false
isHslColor("hsl(0,0%,0%) "); // false
isHslColor("HSL(0,0%,0%)"); // false
```

## hsla(...) colors

### Inputs that return true
```js
isHslaColor("hsla(0,0%,0%,0)"); // true
isHslaColor("hsla(360,100%,100%,1)"); // true
isHslaColor("hsla(.001,.001%,.001%,.001)"); // true
isHslaColor("hsla(0.001,0.001%,0.001%,0.001)"); // true
isHslaColor("hsla(359.999,99.999%,99.999%,.999)"); // true
isHslaColor("hsla(359.999,99.999%,99.999%,0.999)"); // true
isHslaColor("hsla(1,1%,1%,1)"); // true
isHslaColor("hsla(  0,0%,0%,0)"); // true
isHslaColor("hsla(  360,100%,100%,1)"); // true
isHslaColor("hsla(0  ,0%,0%,0)"); // true
isHslaColor("hsla(360  ,100%,100%,1)"); // true
isHslaColor("hsla(0,  0%,0%,0)"); // true
isHslaColor("hsla(360,  100%,100%,1)"); // true
isHslaColor("hsla(0,0%  ,0%,0)"); // true
isHslaColor("hsla(360,100%  ,100%,1)"); // true
isHslaColor("hsla(0,0%,  0%,0)"); // true
isHslaColor("hsla(360,100%,  100%,1)"); // true
isHslaColor("hsla(0,0%,0%  ,0)"); // true
isHslaColor("hsla(360,100%,100%  ,1)"); // true
isHslaColor("hsla(0,0%,0%,  0)"); // true
isHslaColor("hsla(360,100%,100%,  1)"); // true
isHslaColor("hsla(0,0%,0%,0  )"); // true
isHslaColor("hsla(360,100%,100%,1  )"); // true
```

### Inputs that return true
```js
isHslaColor("hsla(-0.001,-0.001%,-0.001%,-0.001)"); // false
isHslaColor("hsla(360.001,100.001%,100.001%,1.001)"); // false
isHslaColor("hsla0,0%,0%,0"); // false
isHslaColor("(360,100%,100%,1)"); // false
isHslaColor("(0,0%,0%,0)"); // false
isHslaColor("hsla360,100%,100%,1)"); // false
isHslaColor("hsla(0,0%,0%,0"); // false
isHslaColor(" hsla(360,100%,100%,1)"); // false
isHslaColor("hsla(0,0%,0%,0) "); // false
isHslaColor("HSLA(0,0%,0%,0)"); // false
```

## hwb(...) colors

### Inputs that return true
```js
isHwbColor("hwb(0,0%,0%)"); // true
isHwbColor("hwb(0,100%,0%)"); // true
isHwbColor("hwb(0,50%,50%)"); // true
isHwbColor("hwb(0,0%,100%)"); // true
isHwbColor("hwb(360,0%,0%)"); // true
isHwbColor("hwb(359.99,99.99%,0.01%)"); // true
```

### Inputs that return true
```js
isHwbColor("hwb(0,101%,0%)"); // false
isHwbColor("hwb(-1,0%,0%)"); // false
isHwbColor("hwb(0,0%,101%)"); // false
isHwbColor("hwb(0,51%,50%)"); // false
isHwbColor("hwb(361,0%,0%)"); // false
```

## Named colors

### Inputs that return true
```js
isColorName("aliceblue"); // true
isColorName("antiquewhite"); // true
isColorName("aqua"); // true
isColorName("aquamarine"); // true
isColorName("azure"); // true
isColorName("beige"); // true
isColorName("bisque"); // true
isColorName("black"); // true
isColorName("blanchedalmond"); // true
isColorName("blue"); // true
isColorName("blueviolet"); // true
isColorName("brown"); // true
isColorName("burlywood"); // true
isColorName("cadetblue"); // true
isColorName("chartreuse"); // true
isColorName("chocolate"); // true
isColorName("coral"); // true
isColorName("cornflowerblue"); // true
isColorName("cornsilk"); // true
isColorName("crimson"); // true
isColorName("cyan"); // true
isColorName("darkblue"); // true
isColorName("darkcyan"); // true
isColorName("darkgoldenrod"); // true
isColorName("darkgray"); // true
isColorName("darkgreen"); // true
isColorName("darkgrey"); // true
isColorName("darkkhaki"); // true
isColorName("darkmagenta"); // true
isColorName("darkolivegreen"); // true
isColorName("darkorange"); // true
isColorName("darkorchid"); // true
isColorName("darkred"); // true
isColorName("darksalmon"); // true
isColorName("darkseagreen"); // true
isColorName("darkslateblue"); // true
isColorName("darkslategray"); // true
isColorName("darkslategrey"); // true
isColorName("darkturquoise"); // true
isColorName("darkviolet"); // true
isColorName("deeppink"); // true
isColorName("deepskyblue"); // true
isColorName("dimgray"); // true
isColorName("dimgrey"); // true
isColorName("dodgerblue"); // true
isColorName("firebrick"); // true
isColorName("floralwhite"); // true
isColorName("forestgreen"); // true
isColorName("fuchsia"); // true
isColorName("gainsboro"); // true
isColorName("ghostwhite"); // true
isColorName("gold"); // true
isColorName("goldenrod"); // true
isColorName("gray"); // true
isColorName("green"); // true
isColorName("greenyellow"); // true
isColorName("grey"); // true
isColorName("honeydew"); // true
isColorName("hotpink"); // true
isColorName("indianred"); // true
isColorName("indigo"); // true
isColorName("ivory"); // true
isColorName("khaki"); // true
isColorName("lavender"); // true
isColorName("lavenderblush"); // true
isColorName("lawngreen"); // true
isColorName("lemonchiffon"); // true
isColorName("lightblue"); // true
isColorName("lightcoral"); // true
isColorName("lightcyan"); // true
isColorName("lightgoldenrodyellow"); // true
isColorName("lightgray"); // true
isColorName("lightgreen"); // true
isColorName("lightgrey"); // true
isColorName("lightpink"); // true
isColorName("lightsalmon"); // true
isColorName("lightseagreen"); // true
isColorName("lightskyblue"); // true
isColorName("lightslategray"); // true
isColorName("lightslategrey"); // true
isColorName("lightsteelblue"); // true
isColorName("lightyellow"); // true
isColorName("lime"); // true
isColorName("limegreen"); // true
isColorName("linen"); // true
isColorName("magenta"); // true
isColorName("maroon"); // true
isColorName("mediumaquamarine"); // true
isColorName("mediumblue"); // true
isColorName("mediumorchid"); // true
isColorName("mediumpurple"); // true
isColorName("mediumseagreen"); // true
isColorName("mediumslateblue"); // true
isColorName("mediumspringgreen"); // true
isColorName("mediumturquoise"); // true
isColorName("mediumvioletred"); // true
isColorName("midnightblue"); // true
isColorName("mintcream"); // true
isColorName("mistyrose"); // true
isColorName("moccasin"); // true
isColorName("navajowhite"); // true
isColorName("navy"); // true
isColorName("oldlace"); // true
isColorName("olive"); // true
isColorName("olivedrab"); // true
isColorName("orange"); // true
isColorName("orangered"); // true
isColorName("orchid"); // true
isColorName("palegoldenrod"); // true
isColorName("palegreen"); // true
isColorName("paleturquoise"); // true
isColorName("palevioletred"); // true
isColorName("papayawhip"); // true
isColorName("peachpuff"); // true
isColorName("peru"); // true
isColorName("pink"); // true
isColorName("plum"); // true
isColorName("powderblue"); // true
isColorName("purple"); // true
isColorName("rebeccapurple"); // true
isColorName("red"); // true
isColorName("rosybrown"); // true
isColorName("royalblue"); // true
isColorName("saddlebrown"); // true
isColorName("salmon"); // true
isColorName("sandybrown"); // true
isColorName("seagreen"); // true
isColorName("seashell"); // true
isColorName("sienna"); // true
isColorName("silver"); // true
isColorName("skyblue"); // true
isColorName("slateblue"); // true
isColorName("slategray"); // true
isColorName("slategrey"); // true
isColorName("snow"); // true
isColorName("springgreen"); // true
isColorName("steelblue"); // true
isColorName("tan"); // true
isColorName("teal"); // true
isColorName("thistle"); // true
isColorName("tomato"); // true
isColorName("turquoise"); // true
isColorName("violet"); // true
isColorName("wheat"); // true
isColorName("white"); // true
isColorName("whitesmoke"); // true
isColorName("yellow"); // true
isColorName("yellowgreen"); // true
```

### Inputs that return true
```js
isColorName("reddd"); // false
isColorName(""); // false
```

