//The stream either from webAudioAPI or from the plugin
var instream = {}
//The analyser from webAudioAPI 
var analyser = {}

//how much of the spectrum is interesting to us?
var freqSplit = 3.2;

//the canvas and 2d context on the page
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

//cycles through the available palettes
var paletteArrayIdx = 0;

//cycles through the available colors in the palette
var paletteIdx = 1;

//current palette
var palette = paletteArray[0];

var printSpeedToggle = false;

//switch palette on keyUp
window.onkeyup = function (e) {
    if (e.key == "ArrowLeft") {
        paletteArrayIdx = (paletteArrayIdx - 1) % paletteArray.length;
        palette = paletteArray[paletteArrayIdx];
    }
    if (e.key == "ArrowRight") {
        paletteArrayIdx = (paletteArrayIdx + 1) % paletteArray.length;
        palette = paletteArray[paletteArrayIdx];
    }
    if (e.key.toUpperCase() == "S") {
        printSpeedToggle = !printSpeedToggle
    }
}

//current color for the bars
var color = palette[paletteIdx];

//refreshRate for the drawing/polling/beatDetection
var refreshRate = 50;

//how much pixels are between two bars
var barDistance = 2;

//needed for reduction of arrays
function add(a, b) {
    return a + b;
}

//update size of the canvas if the window changes
function setSizes() {
    document.documentElement.style.overflow = 'hidden';

    width = window.innerWidth;

    height = window.innerHeight;
    console.log("Detected new window-dimensions: " + width + "/" + height);

    c.width = width;
    c.height = height;
};
//connect to resize event
window.onresize = function (event) {
    setSizes();
}

beatCB = function () {
    color = updateColorFromPalette();
}

newDataCB = function (freqDomain) {
    clearContext()
    printBars(freqDomain)
    if(printSpeedToggle){
        printSpeed()
    }
}

//cycles through the palette and sets color
function updateColorFromPalette() {
    paletteIdx = (paletteIdx + 1) % (palette.length - 1);
    return palette[1 + paletteIdx];
}

function sharpenBars(freqs) {
    freqs = freqs.slice()
    var average = 0;
    for (var i = 0; i < freqs.length; i++) {
        average += freqs[i];
    }

    average /= freqs.length;
    average /= 1.5;
    var max = 0;
    for (var i = 0; i < freqs.length; i++) {
        freqs[i] = freqs[i] - average < 0 ? 0 : freqs[i] - average;
        if (max < freqs[i]) { max = freqs[i] }
    }

    var ratio = 255 / max;
    for (var i = 0; i < freqs.length; i++) {
        freqs[i] *= ratio;
    }
    return freqs
}

function printSpeed() {
    ctx.fillStyle = color;
    ctx.font = "30px Arial";
    speed = beatDetector.detectedSpeed / beatDetector.detectedSpeedAge
    speed *= refreshRate //distance between beats in milliseconds
    speed = 1000 / speed //beats per second 
    ctx.fillText("" + speed.toFixed(2), 100, 100)
}

function clearContext() {
    //clear and fill with first color from palette
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette[0];
    ctx.fillRect(0, 0, width, height);
}

function printBars(freqDomain) {
    freqDomain = sharpenBars(freqDomain)

    //x value of the next bar
    var drawx = 0;

    //set barwidth to minimum 1
    var barwidth = width / (analyser.frequencyBinCount / freqSplit) - (barDistance / 2);
    barwidth = barwidth < 1 ? 1 : barwidth;

    //draw the bars
    ctx.fillStyle = color;

    for (var i = 0; i < analyser.frequencyBinCount / freqSplit; i++) {
        var barheight = height * (freqDomain[i] / 255) * 0.6
        ctx.fillRect(drawx, height - barheight, barwidth, height);

        drawx += barwidth + barDistance;
    }
}



