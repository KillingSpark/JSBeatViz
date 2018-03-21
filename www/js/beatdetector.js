//holds all settings for the beat detection
var beatDetector = {}

function initBeatDetector(newDataCB, beatCB) {
    //how much time has passed since the last threshold break
    beatDetector.threshAge = 0;

    //array of arrays that is the memory for the recorded frequencies. 1024 frequencies at maximum.
    beatDetector.lastValues = [];
    beatDetector.lastValues.length = 1024;

    //How many values are remebered by the history. Note that this is kindof relativ to the refreshRate
    beatDetector.histLen = 100;
    for (var i = 0; i < beatDetector.lastValues.length; i++) {
        beatDetector.lastValues[i] = [];
        beatDetector.lastValues[i].length = beatDetector.histLen;
    }

    //where in the history the next entry will be written (cycles through the array to simulate circular buffer)
    beatDetector.histIndex = 0;

    beatDetector.beatDetectedCallBack = beatCB
    beatDetector.newDataCallback = newDataCB


    //minimum/maximum times for the occurance of a beat.
    beatDetector.minimumBeatDistance = 400 / refreshRate; //150 bpm
    beatDetector.maximumBeatDistance = (1200) / refreshRate; //50 bpm

    //how much an value must beat the average to count as a threshold break
    beatDetector.minimumFactorOverAverage = 1.5;

    //the detectedSpeed makes a guess about how fast the actual music is and allows beats only after that time has passed
    beatDetector.detectedSpeed = beatDetector.maximumBeatDistance;

    //used to determin average beats
    beatDetector.detectedSpeedAge = 1;

    //used to cut down the detectedSpeed(Age) to avoid overflows and to invalidate old values over time.
    beatDetector.detectedSpeedAgeMaximium = refreshRate * 1000;

    //how much time has passed since the last beat was detected
    beatDetector.beatAge = 0;

    //how many different channels we want to break the values down to
    beatDetector.numchan = 20;

    //how many thresholds have to be broken to count as a beat
    beatDetector.threshBreakNum = 2;

    beatDetector.energyHist = []
    beatDetector.energyHistInd = 0
    beatDetector.energyHistSize = 100

}

//feeds new data into the detector and if a beat has been detected it calls the callback
function feedData(values) {
    var beat = detectBeat(values);

    if (beat) {
        beatDetector.beatDetectedCallBack()
    }
}

function pollAnalyzer() {
    //poll the newest frequencyDomain from the analyzer node
    var freqDomain = new Uint8Array(analyser.frequencyBinCount / freqSplit);
    analyser.getByteFrequencyData(freqDomain);
    //do color and beat stuff
    feedData(freqDomain);

    beatDetector.newDataCallback(freqDomain)
}

//connect analyzer to a given audioStream and audioContext and start the "main loop" 
function connectAnalyzer(inputStream, audioctx) {
    try {
        // Assume that node A is ordinarily connected to B.                                                                                                               
        analyser = audioctx.createAnalyser();
        inputStream.connect(analyser);
    } catch (e) {
        console.log(e);
    }
    setInterval(pollAnalyzer, refreshRate);
}

//filters noise from the frequencies by subtracting the average/1.2 and then scales the values back to max=255
function filterNoise(freqs) {
    freqs = freqs.slice()
    var average = 0;
    for (var i = 0; i < freqs.length; i++) {
        average += freqs[i];
    }

    average /= freqs.length;
    average *= 1.2;
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

function updateHistory(values) {
    var channelWidth = Math.floor(values.length / beatDetector.numchan);
    var energy = 0;
    var threshBreaks = 0;
    //count which channel we are looking after
    var chanIdx = 0;
    for (var i = 0; i < values.length; i += channelWidth) {
        //average over the channel
        var localAv = 0;
        for (var k = i; k < i + channelWidth; k++) {
            if (k < values.length && !isNaN(values[k])) {
                localAv += values[k];
            }
        }
        localAv /= channelWidth;

        //average over the history of the channel
        var histAv = beatDetector.lastValues[chanIdx].reduce(add, 0) / beatDetector.histLen;

        //if localAv big enough count the threshBreak 
        if (histAv * beatDetector.minimumFactorOverAverage < localAv) { threshBreaks++; }
        energy += (x = (localAv - histAv)) < 0 ? -x : x

        //store localAv in history
        beatDetector.lastValues[chanIdx][beatDetector.histIndex] = localAv;
        chanIdx++;
    }
    beatDetector.energyHist[beatDetector.energyHistInd] = energy
    beatDetector.energyHistInd++
    beatDetector.energyHistInd %= beatDetector.energyHistSize

    beatDetector.histIndex++;
    beatDetector.histIndex %= beatDetector.histLen;
    return [energy, threshBreaks]
}

//checks for beats and updates its history etc 
function detectBeat(values) {
    values = filterNoise(values)
    var histRes = updateHistory(values);
    var threshBreaks = histRes[1]
    var energy = histRes[0]

    if (beatDetector.beatAge >= beatDetector.minimumBeatDistance) {
        //prevent overflows
        if (beatDetector.detectedSpeedAge > beatDetector.detectedSpeedAgeMaximium) {
            beatDetector.detectedSpeedAge /= 2;
            beatDetector.detectedSpeed /= 2;
        }

        energyAv = 0
        for (var i = 0; i < beatDetector.energyHist.length; i++) {
            energyAv += beatDetector.energyHist[i]
        }
        energyAv /= beatDetector.energyHist.length
        beatProb = energy / energyAv
        beatProb = Math.pow(beatProb, 3)

        curSpeed = (beatDetector.detectedSpeed / beatDetector.detectedSpeedAge)
        timingProb = (beatDetector.beatAge % curSpeed) / curSpeed


        timingProb = Math.abs(timingProb - 1 / 2) * 2
        timingProb = Math.pow(timingProb, 2)
        //console.log(timingProb)
        if (beatProb + timingProb > 1.3) {
            //console.log(beatProb+"/"+timingProb)
            beatDetector.detectedSpeed += beatDetector.beatAge;
            beatDetector.detectedSpeedAge++;
            beatDetector.beatAge = 0;
            return true;
        }
    }

    beatDetector.beatAge += 1;
    beatDetector.threshAge += 1;

    //force beat after maximumBeatDistance
    //if(beatDetector.beatAge >= beatDetector.maximumBeatDistance){
    //    beatDetector.beatAge = 0;
    //    return true;
    //}

    //default to false
    return false;
}
