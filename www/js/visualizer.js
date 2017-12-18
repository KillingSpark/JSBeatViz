//drawing context from canvas
var ctx;

//The stream either from webAudioAPI or from the plugin
var instream = {}
//The analyser from webAudioAPI 
var analyser = {}

//how much of the spectrum is interesting to us?
var freqSplit = 3;

var c = document.getElementById("myCanvas");
ctx = c.getContext("2d"); 

function makeRGB(r,g,b){
    return 'rgb('+Math.floor(r)+","+Math.floor(g)+","+Math.floor(b)+")";
}

var blackWhitePalette = [makeRGB(0,0,0),
    makeRGB(10,10,10),
    makeRGB(20,20,20),
    makeRGB(30,30,30),
    makeRGB(40,40,40),
    makeRGB(50,50,50),
    makeRGB(60,60,60),
    makeRGB(70,70,70),
    makeRGB(80,80,80),
    makeRGB(90,90,90),
    makeRGB(100,100,100),
    makeRGB(110,110,110),
    makeRGB(120,120,120),
    makeRGB(130,130,130),
    makeRGB(140,140,140),
    makeRGB(150,150,150),
    makeRGB(160,160,160),
    makeRGB(170,170,170),
    makeRGB(180,180,180),
    makeRGB(190,190,190),
    makeRGB(200,200,200),
    makeRGB(210,210,210),
    makeRGB(220,220,220),
    makeRGB(230,230,230),
    makeRGB(240,240,240),
    makeRGB(250,250,250)
]

var redShadePalette = [
   makeRGB(170, 57, 57),
   makeRGB(255,170,170),
   makeRGB(212,106,106),
   makeRGB(128, 21, 21),
   makeRGB( 85,  0,  0)
]

var deepColorPalette = [
    makeRGB( 70, 10,  3),
    makeRGB(168, 84,  0),
    makeRGB(  2, 85,104),
    makeRGB(115, 57,  0),
    makeRGB(  0,146, 23),
    makeRGB(  2, 85,104),
]

paletteArray = [blackWhitePalette, redShadePalette, deepColorPalette];
var paletteArrayIdx = 0;

var palette = deepColorPalette; 

window.onkeyup = function(e) {
    paletteArrayIdx = (paletteArrayIdx + 1) % paletteArray.length;
    palette = paletteArray[paletteArrayIdx];
}
var red = 0;
var green = 0;
var blue = 0;
var color = 'rgb(0,0,0)';

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

var refreshRate = 50;
//connect analyzer to a given audioStream and audioContext
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

//updates colors for the bars and creates a new color if the sum exceeds the threshold
function updateColorsAndThreshold(values){
   var beat = detectBeat(values); 

    if(beat){
        getNewColorFromPalette();
        //newColors();
    }
}

var paletteIdx = 1;
function getNewColorFromPalette(){
    paletteIdx = (paletteIdx + 1) % (palette.length-1);
    color = palette[1 + paletteIdx];
}

function newColors(){
    main = Math.floor(Math.random() * 3);
    secmain = Math.floor(Math.random() * 2);
    mainweight = 255;
    secmainweight = (Math.random() > 0.45) ? (0.95*255 + Math.random()*0.05*255) : (Math.random()*0.25*255);
    rest = Math.random()*0.25*255;
    if (main === 0){
        red = mainweight;
        if (secmain === 0){
            blue = secmainweight;
            green = rest;
        }else{
            green = secmainweight;
            blue = rest;
        }
    }

    if (main === 1){                                                                                                                                              
        blue = mainweight;                                                                                                                                         
        if (secmain === 0){                                                                                                                                       
            red = secmainweight;                                                                                                                                 
            green = rest;                                                                                                                                         
        }else{                                                                                                                                                    
            green = secmainweight;                                                                                                                                
            red = rest;                                                                                                                                          
        }                                                                                                                                                         
    }

    if (main === 3){                                                                                                                                              
        green = mainweight;                                                                                                                                         
        if (secmain === 0){                                                                                                                                       
            blue = secmainweight;                                                                                                                                 
            red = rest;                                                                                                                                         
        }else{                                                                                                                                                    
            green = secmainweight;                                                                                                                                
            red = rest;                                                                                                                                          
        }                                                                                                                                                         
    }
    color = 'rgb('+ Math.floor(red) +',' + Math.floor(green) + ',' + Math.floor(blue) + ')';
}

function filterNoise(freqs) {
    var average = 0;
    for (var i = 0; i < freqs.length; i++){
        average += freqs[i];
    }

    average /= freqs.length;
    average /= 1.2;
    var max = 0;
    for (var i = 0; i < freqs.length; i++){
        freqs[i] = freqs[i] - average < 0 ? 0 : freqs[i] - average;
        if (max < freqs[i]) { max = freqs[i] }
    }

    var ratio = 255 / max;
    for (var i = 0; i < freqs.length; i++){
        freqs[i] *= ratio;
    }
}

var barDistance = 2;
function printBars() {
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle = palette[0];
    ctx.fillRect(0,0,width,height);
    var drawx = 0;
    var sum = 0; 
    
    var max = 0;

    try{
        var freqDomain = new Uint8Array(analyser.frequencyBinCount/freqSplit);
        analyser.getByteFrequencyData(freqDomain);
        filterNoise(freqDomain);
        var barwidth = width/(analyser.frequencyBinCount/freqSplit)-(barDistance/2);
        barwidth = barwidth < 1 ? 1 : barwidth; 
        updateColorsAndThreshold(freqDomain);

        
        ctx.fillStyle = color;
        for (var i = 0; i < analyser.frequencyBinCount / freqSplit; i++) {
            var barheight = height * (freqDomain[i]/255)*0.96
            ctx.fillRect(drawx, height - barheight, barwidth, height);

            drawx += barwidth + barDistance;
            

        }

        
    } catch (e) {
        console.log(e)
    }
}



