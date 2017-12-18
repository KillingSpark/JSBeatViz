//holds all settings for the beat detection
beatDetector = {}

//how much time has passed since the last threshold break
beatDetector.threshAge = 0;

//array of arrays that is the memory for the recorded frequencies. 1024 frequencies at maximum.
beatDetector.lastValues = [];
beatDetector.lastValues.length = 1024;

//How many values are remebered by the history. Note that this is kindof relativ to the refreshRate
beatDetector.histLen = 100;
for (var i = 0; i < beatDetector.lastValues.length; i++){
    beatDetector.lastValues[i] = [];
    beatDetector.lastValues[i].length = beatDetector.histLen;
}

//where in the history the next entry will be written (cycles through the array to simulate circular buffer)
var histIndex = 0;

//minimum/maximum times for the occurance of a beat.
beatDetector.minimumBeatDistance = 200/refreshRate; //300 bpm
beatDetector.maximumBeatDistance = (600)/refreshRate; //100 bpm

//how much an value must beat the average to count as a threshold break
beatDetector.minimumFactorOverAverage = 1.5;

//the detectedSpeed makes a guess about how fast the actual music is and allows beats only after that time has passed
beatDetector.detectedSpeed = beatDetector.minimumBeatDistance;

//used to determin average beats
beatDetector.detectedSpeedAge = 1;

//used to cut down the detectedSpeed(Age) to avoid overflows and to invalidate old values over time.
beatDetector.detectedSpeedAgeMaximium = refreshRate*1000;

//how much time has passed since the last beat was detected
beatDetector.beatAge = 0;

//how many different channels we want to break the values down to
beatDetector.numchan = 20;

//how many thresholds have to be broken to count as a beat
beatDetector.threshBreakNum = 2;

//checks for beats and updates its history etc 
function detectBeat(values){
    var channelWidth = Math.floor(values.length / beatDetector.numchan);
    var threshBreaks = 0;

    //count which channel we are looking after
    var chanIdx = 0;
    for (var i = 0; i < values.length; i += channelWidth){
        //average over the channel
        var localAv = 0;
        for(var k = i; k < i+channelWidth; k++){
            if(k < values.length && !isNaN(values[k])){
                localAv += values[k];
            }
        }
        localAv /= channelWidth;

        //average over the history of the channel
        var histAv = beatDetector.lastValues[chanIdx].reduce(add,0) / beatDetector.histLen;
        
        //if localAv big enough count the threshBreak 
        if (histAv*beatDetector.minimumFactorOverAverage < localAv) {threshBreaks++;}

        //store localAv in history
        beatDetector.lastValues[chanIdx][histIndex] = localAv;
        chanIdx++;    
    }

    histIndex ++;
    histIndex %= beatDetector.histLen;

    //if thresholds broken and last beat long anough ago there is a possible beat
    if (threshBreaks >= beatDetector.threshBreakNum && beatDetector.threshAge >= beatDetector.minimumBeatDistance) {
        beatDetector.detectedSpeed += beatDetector.threshAge;
        beatDetector.detectedSpeedAge++;
        
        //prevent overflows
        if (beatDetector.detectedSpeedAge > beatDetector.detectedSpeedAgeMaximium){
            beatDetector.detectedSpeedAge /= 2;
            beatDetector.detectedSpeed /=2;
        }

        beatDetector.threshAge = 0;
         
        //if beatAge beats the detectedSpeed we detect a beat
        if(beatDetector.beatAge > beatDetector.detectedSpeed/beatDetector.detectedSpeedAge){
            beatDetector.beatAge = 0;
            return true;
        }            
    }

    beatDetector.beatAge += 1;
    beatDetector.threshAge += 1;
    
    //force beat after maximumBeatDistance
    if(beatDetector.beatAge >= beatDetector.maximumBeatDistance){
        beatDetector.beatAge = 0;
        return true;
    }

    //default to false
    return false;
}
