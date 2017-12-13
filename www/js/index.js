/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        setSizes();
        audioinput.start({streamToWebAudio: true});
        connectAnalyzer(audioinput, audioinput.getAudioContext());	
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    }
};


//constraints for the webAudioAPI
var constraints = window.constraints = {
    audio: true,
    video: false
};

//log errors from permission request
function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

//for debugging, not in prod (very often called)
function onAudioInput( evt ) {
// 'evt.data' is an integer array containing raw audio data 
//    
//console.log( "Audio data received: " + evt.data + " samples" );

// ... do something with the evt.data array ... 
}

// Listen to audioinput events 
window.addEventListener( "audioinput", onAudioInput, false );


var onAudioInputError = function( error ) {
    console.log( "onAudioInputError event recieved: " + JSON.stringify(error) );
};

// Listen to audioinputerror events 
window.addEventListener( "audioinputerror", onAudioInputError, false );

//if permission is granted initialize important stuff
function audioPermissionGranted(stream){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    mediastream = audioContext.createMediaStreamSource(stream);
    connectAnalyzer(mediastream, audioContext); 
}

function requestPermission(){
    try {
        navigator.mediaDevices.getUserMedia(constraints).then(audioPermissionGranted).catch(handleError);
    } catch (e) {
        alert(e + 'Web Audio API not supported.');
    }
}
