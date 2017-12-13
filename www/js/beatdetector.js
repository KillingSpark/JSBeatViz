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


var minimumBeatDistance = 400; //150 bpm
var minimumFactorOverAverage = 1.1;
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

    if (threshBreaks >= 2 && threshAge >= minimumBeatDistance/refreshRate) {
        threshAge = 0;
        return true;
    } else {
        threshAge += 1;
        return false;
    }
}
