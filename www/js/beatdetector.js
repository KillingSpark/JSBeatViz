//variables for beat detection / colorchanges
var threshAge = 0;

var lastValues = [];
lastValues.length = 1024;
histLen = 100;
histIndex = 0;
for (var i = 0; i < lastValues.length; i++){
    lastValues[i] = [];
    lastValues[i].length = histLen;
}


var minimumBeatDistance = 200/refreshRate; //300 bpm
var minimumFactorOverAverage = 1.5;

var maximumBeatDistance = (600)/refreshRate; //100 bpm

var detectedSpeed = minimumBeatDistance;
var beatAge = 0;
//checks for beats and updates its history etc 
function detectBeat(values){
    var threshBreaks = 0;
    var numchan = 20;
    var channelWidth = Math.floor(values.length / numchan);
    var chanIdx = 0;
    for (var i = 0; i < values.length; i += channelWidth){
        var localAv = 0;
        for(var k = i; k < i+channelWidth; k++){
            if(k < values.length && !isNaN(values[k])){
                localAv += values[k];
            }
        }
        localAv /= channelWidth;
        var histAv = lastValues[chanIdx].reduce(add,0) / histLen;
        if (histAv*minimumFactorOverAverage < localAv) {threshBreaks++;}
        lastValues[chanIdx][histIndex] = localAv;
        chanIdx++;    
    }

    histIndex ++;
    histIndex %= histLen;

    if (threshBreaks >= 2 && threshAge >= minimumBeatDistance) {
        detectedSpeed = detectedSpeed * 0.9 + threshAge * 0.1;
        threshAge = 0;
        //console.log(60000/(detectedSpeed*refreshRate));
         
        if(beatAge > detectedSpeed){
            beatAge = 0;
            return true;
        }            
    }
    beatAge+=1;
    threshAge += 1;
    
    if(beatAge >= maximumBeatDistance){
        beatAge = 0;
        return true;
    }

    return false;
    


}
