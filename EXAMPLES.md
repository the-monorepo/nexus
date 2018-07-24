# Examples
**Note:** If you would like more examples of what is returns true and what returns false, I recommend looking at the tests.

## isCssColor
`isCssColor` will return true for any input that returns true in the functions below.
E.g. `isCssColor('#FFFFFF')` and `isCssColor('rgb(255,255,255)')` will both return true

## Hex colors

### Inputs that return true
```js
isHexColor("#f"); // true
isHexColor("#F"); // true
isHexColor("#FF"); // true
isHexColor("#FFFF"); // true
isHexColor("#FFFFF"); // true
isHexColor("#0000000"); // true
isHexColor("#0"); // true
isHexColor("#00"); // true
isHexColor("#0000"); // true
isHexColor("#00000"); // true
isHexColor("#GGG"); // true
isHexColor("#GGGGGG"); // true
isHexColor("F"); // true
isHexColor("G"); // true
isHexColor("0"); // true
isHexColor(" #FFFFFF"); // true
isHexColor("#FFFFFF "); // true
```

### Inputs that return true
```js
isHexColor("#fff"); // false
isHexColor("#FFF"); // false
isHexColor("#FFFFFF"); // false
isHexColor("#FFFFFFFF"); // false
isHexColor("#000"); // false
isHexColor("#000000"); // false
isHexColor("#00000000"); // false
```

## rgb(...) colors

### Inputs that return true
```js
isRgbColor("rgb(-0.001,-0.001,-0.001)"); // true
isRgbColor("rgb(255.001,255.001,255.001)"); // true
isRgbColor("rgb0,0,0"); // true
isRgbColor("(255,255,255)"); // true
isRgbColor("(0,0,0)"); // true
isRgbColor("rgb255,255,255)"); // true
isRgbColor("rgb(0,0,0"); // true
isRgbColor(" rgb(255,255,255)"); // true
isRgbColor("rgb(0,0,0) "); // true
isRgbColor("RGB(0,0,0)"); // true
```

### Inputs that return true
```js
isRgbColor("rgb(0,0,0)"); // false
isRgbColor("rgb(255,255,255)"); // false
isRgbColor("rgb(.001,.001,.001)"); // false
isRgbColor("rgb(0.001,0.001,0.001)"); // false
isRgbColor("rgb(254.999,254.999,254.999)"); // false
isRgbColor("rgb(1,1,1)"); // false
isRgbColor("rgb(  0,0,0)"); // false
isRgbColor("rgb(  255,255,255)"); // false
isRgbColor("rgb(0  ,0,0)"); // false
isRgbColor("rgb(255  ,255,255)"); // false
isRgbColor("rgb(0,  0,0)"); // false
isRgbColor("rgb(255,  255,255)"); // false
isRgbColor("rgb(0,0  ,0)"); // false
isRgbColor("rgb(255,255  ,255)"); // false
isRgbColor("rgb(0,0,  0)"); // false
isRgbColor("rgb(255,255,  255)"); // false
isRgbColor("rgb(0,0,0  )"); // false
isRgbColor("rgb(255,255,255  )"); // false
```

## rgba(...) colors

### Inputs that return true
```js
isRgbaColor("rgba(-0.001,-0.001,-0.001,-0.001)"); // true
isRgbaColor("rgba(255.001,255.001,255.001,1.001)"); // true
isRgbaColor("rgba0,0,0,0"); // true
isRgbaColor("(255,255,255,1)"); // true
isRgbaColor("(0,0,0,0)"); // true
isRgbaColor("rgba255,255,255,1)"); // true
isRgbaColor("rgba(0,0,0,0"); // true
isRgbaColor(" rgba(255,255,255,1)"); // true
isRgbaColor("rgba(0,0,0,0) "); // true
isRgbaColor("RGBA(0,0,0,0)"); // true
```

### Inputs that return true
```js
isRgbaColor("rgba(0,0,0,0)"); // false
isRgbaColor("rgba(255,255,255,1)"); // false
isRgbaColor("rgba(.001,.001,.001,.001)"); // false
isRgbaColor("rgba(0.001,0.001,0.001,0.001)"); // false
isRgbaColor("rgba(254.999,254.999,254.999,.999)"); // false
isRgbaColor("rgba(254.999,254.999,254.999,0.999)"); // false
isRgbaColor("rgba(1,1,1,1)"); // false
isRgbaColor("rgba(  0,0,0,0)"); // false
isRgbaColor("rgba(  255,255,255,1)"); // false
isRgbaColor("rgba(0  ,0,0,0)"); // false
isRgbaColor("rgba(255  ,255,255,1)"); // false
isRgbaColor("rgba(0,  0,0,0)"); // false
isRgbaColor("rgba(255,  255,255,1)"); // false
isRgbaColor("rgba(0,0  ,0,0)"); // false
isRgbaColor("rgba(255,255  ,255,1)"); // false
isRgbaColor("rgba(0,0,  0,0)"); // false
isRgbaColor("rgba(255,255,  255,1)"); // false
isRgbaColor("rgba(0,0,0  ,0)"); // false
isRgbaColor("rgba(255,255,255  ,1)"); // false
isRgbaColor("rgba(0,0,0,  0)"); // false
isRgbaColor("rgba(255,255,255,  1)"); // false
isRgbaColor("rgba(0,0,0,0  )"); // false
isRgbaColor("rgba(255,255,255,1  )"); // false
```

## hsl(...) colors

### Inputs that return true
```js
isHslColor("hsl(-0.001,-0.001%,-0.001%)"); // true
isHslColor("hsl(360.001,100.001%,100.001%)"); // true
isHslColor("hsl0,0%,0%"); // true
isHslColor("(360,100%,100%)"); // true
isHslColor("(0,0%,0%)"); // true
isHslColor("hsl360,100%,100%)"); // true
isHslColor("hsl(0,0%,0%"); // true
isHslColor(" hsl(360,100%,100%)"); // true
isHslColor("hsl(0,0%,0%) "); // true
isHslColor("HSL(0,0%,0%)"); // true
```

### Inputs that return true
```js
isHslColor("hsl(0,0%,0%)"); // false
isHslColor("hsl(360,100%,100%)"); // false
isHslColor("hsl(.001,.001%,.001%)"); // false
isHslColor("hsl(0.001,0.001%,0.001%)"); // false
isHslColor("hsl(359.999,99.999%,99.999%)"); // false
isHslColor("hsl(1,1%,1%)"); // false
isHslColor("hsl(  0,0%,0%)"); // false
isHslColor("hsl(  360,100%,100%)"); // false
isHslColor("hsl(0  ,0%,0%)"); // false
isHslColor("hsl(360  ,100%,100%)"); // false
isHslColor("hsl(0,  0%,0%)"); // false
isHslColor("hsl(360,  100%,100%)"); // false
isHslColor("hsl(0,0%  ,0%)"); // false
isHslColor("hsl(360,100%  ,100%)"); // false
isHslColor("hsl(0,0%,  0%)"); // false
isHslColor("hsl(360,100%,  100%)"); // false
isHslColor("hsl(0,0%,0%  )"); // false
isHslColor("hsl(360,100%,100%  )"); // false
```

## hsla(...) colors

### Inputs that return true
```js
isHslaColor("hsla(-0.001,-0.001%,-0.001%,-0.001)"); // true
isHslaColor("hsla(360.001,100.001%,100.001%,1.001)"); // true
isHslaColor("hsla0,0%,0%,0"); // true
isHslaColor("(360,100%,100%,1)"); // true
isHslaColor("(0,0%,0%,0)"); // true
isHslaColor("hsla360,100%,100%,1)"); // true
isHslaColor("hsla(0,0%,0%,0"); // true
isHslaColor(" hsla(360,100%,100%,1)"); // true
isHslaColor("hsla(0,0%,0%,0) "); // true
isHslaColor("HSLA(0,0%,0%,0)"); // true
```

### Inputs that return true
```js
isHslaColor("hsla(0,0%,0%,0)"); // false
isHslaColor("hsla(360,100%,100%,1)"); // false
isHslaColor("hsla(.001,.001%,.001%,.001)"); // false
isHslaColor("hsla(0.001,0.001%,0.001%,0.001)"); // false
isHslaColor("hsla(359.999,99.999%,99.999%,.999)"); // false
isHslaColor("hsla(359.999,99.999%,99.999%,0.999)"); // false
isHslaColor("hsla(1,1%,1%,1)"); // false
isHslaColor("hsla(  0,0%,0%,0)"); // false
isHslaColor("hsla(  360,100%,100%,1)"); // false
isHslaColor("hsla(0  ,0%,0%,0)"); // false
isHslaColor("hsla(360  ,100%,100%,1)"); // false
isHslaColor("hsla(0,  0%,0%,0)"); // false
isHslaColor("hsla(360,  100%,100%,1)"); // false
isHslaColor("hsla(0,0%  ,0%,0)"); // false
isHslaColor("hsla(360,100%  ,100%,1)"); // false
isHslaColor("hsla(0,0%,  0%,0)"); // false
isHslaColor("hsla(360,100%,  100%,1)"); // false
isHslaColor("hsla(0,0%,0%  ,0)"); // false
isHslaColor("hsla(360,100%,100%  ,1)"); // false
isHslaColor("hsla(0,0%,0%,  0)"); // false
isHslaColor("hsla(360,100%,100%,  1)"); // false
isHslaColor("hsla(0,0%,0%,0  )"); // false
isHslaColor("hsla(360,100%,100%,1  )"); // false
```

## hwb(...) colors

### Inputs that return true
```js
isHwbColor("hwb(0,101%,0%)"); // true
isHwbColor("hwb(-1,0%,0%)"); // true
isHwbColor("hwb(0,0%,101%)"); // true
isHwbColor("hwb(0,51%,50%)"); // true
isHwbColor("hwb(361,0%,0%)"); // true
```

### Inputs that return true
```js
isHwbColor("hwb(0,0%,0%)"); // false
isHwbColor("hwb(0,100%,0%)"); // false
isHwbColor("hwb(0,50%,50%)"); // false
isHwbColor("hwb(0,0%,100%)"); // false
isHwbColor("hwb(360,0%,0%)"); // false
isHwbColor("hwb(359.99,99.99%,0.01%)"); // false
```

## Named colors

### Inputs that return true
```js
isColorName("reddd"); // true
isColorName(""); // true
```

### Inputs that return true
```js
isColorName("aliceblue"); // false
isColorName("antiquewhite"); // false
isColorName("aqua"); // false
isColorName("aquamarine"); // false
isColorName("azure"); // false
isColorName("beige"); // false
isColorName("bisque"); // false
isColorName("black"); // false
isColorName("blanchedalmond"); // false
isColorName("blue"); // false
isColorName("blueviolet"); // false
isColorName("brown"); // false
isColorName("burlywood"); // false
isColorName("cadetblue"); // false
isColorName("chartreuse"); // false
isColorName("chocolate"); // false
isColorName("coral"); // false
isColorName("cornflowerblue"); // false
isColorName("cornsilk"); // false
isColorName("crimson"); // false
isColorName("cyan"); // false
isColorName("darkblue"); // false
isColorName("darkcyan"); // false
isColorName("darkgoldenrod"); // false
isColorName("darkgray"); // false
isColorName("darkgreen"); // false
isColorName("darkgrey"); // false
isColorName("darkkhaki"); // false
isColorName("darkmagenta"); // false
isColorName("darkolivegreen"); // false
isColorName("darkorange"); // false
isColorName("darkorchid"); // false
isColorName("darkred"); // false
isColorName("darksalmon"); // false
isColorName("darkseagreen"); // false
isColorName("darkslateblue"); // false
isColorName("darkslategray"); // false
isColorName("darkslategrey"); // false
isColorName("darkturquoise"); // false
isColorName("darkviolet"); // false
isColorName("deeppink"); // false
isColorName("deepskyblue"); // false
isColorName("dimgray"); // false
isColorName("dimgrey"); // false
isColorName("dodgerblue"); // false
isColorName("firebrick"); // false
isColorName("floralwhite"); // false
isColorName("forestgreen"); // false
isColorName("fuchsia"); // false
isColorName("gainsboro"); // false
isColorName("ghostwhite"); // false
isColorName("gold"); // false
isColorName("goldenrod"); // false
isColorName("gray"); // false
isColorName("green"); // false
isColorName("greenyellow"); // false
isColorName("grey"); // false
isColorName("honeydew"); // false
isColorName("hotpink"); // false
isColorName("indianred"); // false
isColorName("indigo"); // false
isColorName("ivory"); // false
isColorName("khaki"); // false
isColorName("lavender"); // false
isColorName("lavenderblush"); // false
isColorName("lawngreen"); // false
isColorName("lemonchiffon"); // false
isColorName("lightblue"); // false
isColorName("lightcoral"); // false
isColorName("lightcyan"); // false
isColorName("lightgoldenrodyellow"); // false
isColorName("lightgray"); // false
isColorName("lightgreen"); // false
isColorName("lightgrey"); // false
isColorName("lightpink"); // false
isColorName("lightsalmon"); // false
isColorName("lightseagreen"); // false
isColorName("lightskyblue"); // false
isColorName("lightslategray"); // false
isColorName("lightslategrey"); // false
isColorName("lightsteelblue"); // false
isColorName("lightyellow"); // false
isColorName("lime"); // false
isColorName("limegreen"); // false
isColorName("linen"); // false
isColorName("magenta"); // false
isColorName("maroon"); // false
isColorName("mediumaquamarine"); // false
isColorName("mediumblue"); // false
isColorName("mediumorchid"); // false
isColorName("mediumpurple"); // false
isColorName("mediumseagreen"); // false
isColorName("mediumslateblue"); // false
isColorName("mediumspringgreen"); // false
isColorName("mediumturquoise"); // false
isColorName("mediumvioletred"); // false
isColorName("midnightblue"); // false
isColorName("mintcream"); // false
isColorName("mistyrose"); // false
isColorName("moccasin"); // false
isColorName("navajowhite"); // false
isColorName("navy"); // false
isColorName("oldlace"); // false
isColorName("olive"); // false
isColorName("olivedrab"); // false
isColorName("orange"); // false
isColorName("orangered"); // false
isColorName("orchid"); // false
isColorName("palegoldenrod"); // false
isColorName("palegreen"); // false
isColorName("paleturquoise"); // false
isColorName("palevioletred"); // false
isColorName("papayawhip"); // false
isColorName("peachpuff"); // false
isColorName("peru"); // false
isColorName("pink"); // false
isColorName("plum"); // false
isColorName("powderblue"); // false
isColorName("purple"); // false
isColorName("rebeccapurple"); // false
isColorName("red"); // false
isColorName("rosybrown"); // false
isColorName("royalblue"); // false
isColorName("saddlebrown"); // false
isColorName("salmon"); // false
isColorName("sandybrown"); // false
isColorName("seagreen"); // false
isColorName("seashell"); // false
isColorName("sienna"); // false
isColorName("silver"); // false
isColorName("skyblue"); // false
isColorName("slateblue"); // false
isColorName("slategray"); // false
isColorName("slategrey"); // false
isColorName("snow"); // false
isColorName("springgreen"); // false
isColorName("steelblue"); // false
isColorName("tan"); // false
isColorName("teal"); // false
isColorName("thistle"); // false
isColorName("tomato"); // false
isColorName("turquoise"); // false
isColorName("violet"); // false
isColorName("wheat"); // false
isColorName("white"); // false
isColorName("whitesmoke"); // false
isColorName("yellow"); // false
isColorName("yellowgreen"); // false
```

