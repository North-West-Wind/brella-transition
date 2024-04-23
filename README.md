# Brella Transition
The coolest OBS Studio transition you will ever see. This repository contains the code that is used to generate the animation.

## Preview
![transition](https://raw.githubusercontent.com/North-West-Wind/brella-transition/main/preview.gif)

# Usage

## Requirements
- Node.js
- FFmpeg

## Installing to system
Run `npm i -g brella-transition` in the terminal.

## Generating the animation
Run `brella-transition` in the terminal.

You can also use additional options:
```
Options:
  -W, --width <number>        width of the canvas (default: "1920")
  -H, --height <number>       height of the canvas (default: "1080")
  -o, --output <string>       name of output file (default: "brella.webm")
  --brella <number>           maximum amount of brella (default: "30")
  --retries <number>          maximum retries before choosing to overlap, -1 to allow indefinite retries (default: "1000000")
  --fps <number>              framerate of the transition (default: "60")
  --attack <number>           frames of brella opening/closing (default: "15")
  --hold <number>             frames of brella staying opened (default: "30")
  --ribs <numbers>            possible number of ribs, separated by commas (default: "6,8")
  -h, --hue <numbers>         HUE angle range in degrees, separated by comma (default: "0,360")
  -s, --saturation <numbers>  saturation range in percentage, separated by comma (default: "80,100")
  -l, --lightness <numbers>   lightness range in percentage, separated by comma (default: "50,50")
  --help                      display help for command
```

Once generated, copy/move the WebM file to somewhere you can save permanently.

## Adding to OBS Studio
1. Launch OBS Studio.
2. Locate the "Scene Transitions" dock.
3. Click the "+" button and choose "Stinger".
4. Give it a name (I recommend calling it "Brellas").
5. Click "Browse" next to the "Video File" input field and choose your WebM file.
6. Change "Transition Point Type" to "Frame".
7. Set "Transition Point (frame)" to half of your WebM file's total frames.
8. Click "OK".
9. Change your transition from "Fade" (or whatever it is) to "Brellas" (or whatever you named it).
10. Profit!

# License
GPLv3