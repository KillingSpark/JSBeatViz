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

//switch palette on keyUp
window.onkeyup = function(e) {
    paletteArrayIdx = (paletteArrayIdx + 1) % paletteArray.length;
    palette = paletteArray[paletteArrayIdx];
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
function setSizes(){
    document.documentElement.style.overflow = 'hidden';

    width = window.innerWidth;

    height = window.innerHeight;
    console.log("Detected new window-dimensions: " + width + "/" + height);

    c.width = width;
    c.height = height;
};
//connect to resize event
window.onresize = function(event) {
    setSizes();
}

//connect analyzer to a given audioStream and audioContext and start the "main loop" 
function connectAnalyzer(inputStream, audioctx) {
    try {                                                                                                                                                              
        // Assume that node A is ordinarily connected to B.                                                                                                               
        analyser =  audioctx.createAnalyser();                                                                                                                     
        inputStream.connect(analyser);                                                                                                                                       
    } catch (e) {                                                                                                                                                       
        console.log(e);                                                                                                                                                         
    }
    setInterval(printBars, refreshRate);
}

//asks the beatDetector if a new beat occured and if yes updates the color from the palette
function updateColorsAndThreshold(values){
   var beat = detectBeat(values); 

    if(beat){
        color = updateColorFromPalette();
    }
}

//cycles through the palette and sets color
function updateColorFromPalette(){
    paletteIdx = (paletteIdx + 1) % (palette.length-1);
    return palette[1 + paletteIdx];
}

function sharpenBars(freqs) {
    freqs = freqs.slice()
    var average = 0;
    for (var i = 0; i < freqs.length; i++){
        average += freqs[i];
    }

    average /= freqs.length;
    average /= 1.5;
    var max = 0;
    for (var i = 0; i < freqs.length; i++){
        freqs[i] = freqs[i] - average < 0 ? 0 : freqs[i] - average;
        if (max < freqs[i]) { max = freqs[i] }
    }

    var ratio = 255 / max;
    for (var i = 0; i < freqs.length; i++){
        freqs[i] *= ratio;
    }
    return freqs
} 

function printBars() {
    //clear and fill with first color from palette
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle = palette[0];
    ctx.fillRect(0,0,width,height);

    //x value of the next bar
    var drawx = 0;

    //poll the newest frequencyDomain from the analyzer node
    var freqDomain = new Uint8Array(analyser.frequencyBinCount/freqSplit);
    analyser.getByteFrequencyData(freqDomain);
   
    //set barwidth to minimum 1
    var barwidth = width/(analyser.frequencyBinCount/freqSplit)-(barDistance/2);
    barwidth = barwidth < 1 ? 1 : barwidth; 
    
    //do color and beat stuff
    updateColorsAndThreshold(freqDomain);
    freqDomain = sharpenBars(freqDomain)

    //draw the bars
    ctx.fillStyle = color;
    for (var i = 0; i < analyser.frequencyBinCount / freqSplit; i++) {
        var barheight = height * (freqDomain[i]/255)*0.96
        ctx.fillRect(drawx, height - barheight, barwidth, height);

        drawx += barwidth + barDistance;
    }
}



