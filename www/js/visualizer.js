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

    width = window.screen.width;

    height = window.screen.height;
    console.log("Detected new window-dimensions: " + width + "/" + height);

    c.width = width;
    c.height = height;
};

//connect to resize event
window.onresize = function(event) {
    setSizes();
}

var refreshRate = 100;
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
        newColors();
    }else{
        red -= 2;
        green -= 2;
        blue -= 2;
        color = 'rgb('+ Math.floor(red) +',' + Math.floor(green) + ',' + Math.floor(blue) + ')';
    }
}
function newColors(){
    main = Math.floor(Math.random() * 3.9);
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
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0,0,width,height);
    var drawx = 0;
    var sum = 0; 
    try{
        var freqDomain = new Uint8Array(analyser.frequencyBinCount/freqSplit);
        analyser.getByteFrequencyData(freqDomain);
        filterNoise(freqDomain);
        ctx.fillStyle = color;
        var barwidth = width/(analyser.frequencyBinCount/freqSplit)-(barDistance/2);

        updateColorsAndThreshold(freqDomain);

        for (var i = 0; i < analyser.frequencyBinCount / freqSplit; i++) {
            var barheight = height * (freqDomain[i]/255)*0.8
            ctx.fillRect(drawx, height - barheight, barwidth, height);

            drawx += barwidth + barDistance;
        }
    } catch (e) {
        console.log(e)
    }
}



