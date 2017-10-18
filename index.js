const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');
const Speech = require('@google-cloud/speech');
const speech = Speech();
const picoSpeaker = require('pico-speaker');

picoSpeaker.init();

const models = new Models();

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

var recognizeStream;

models.add({
  file: 'heycalvin.pmdl',
  sensitivity: '0.4',
  hotwords : 'hey calvin'
});

const detector = new Detector({
  resource: "common.res",
  models: models,
  audioGain: 2.0
});

detector.on('error', function () {
  console.log('error');
});

const mic = record.start({
  sampleRateHertz: sampleRateHertz,
  threshold: 0,
  verbose: false,
  silence: '10.0',
  device: 'plughw:2,0'
});

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode
  },
  interimResults: false // If you want interim results, set this to true
};

detector.on('hotword', function (index, hotword, buffer) {
  console.log('hotword', index, hotword);
  playWav("listening.wav");
  startRecognition((data) => {
    stopRecognition();
    playWav("notlistening.wav");
    say(data);
  });
});

mic.pipe(detector);

function playWav(filename) {
  var file = fs.createReadStream(filename);
  var reader = new wav.Reader();
  
  // the "format" event gets emitted at the end of the WAVE header 
  reader.on('format', function (format) {
    reader.pipe(new Speaker(format));
  });
  file.pipe(reader);
}

function startRecognition(onHeard) {
  recognizeStream = speech.streamingRecognize(request)
    .on('error', console.error)
    .on('data', (data) => {
      if(data.results[0] && data.results[0].alternatives[0]) {
        var command = data.results[0].alternatives[0].transcript;
        console.log(command);
        onHeard(command);
        }
      });
    mic.pipe(recognizeStream);
}

function stopRecognition() {
  mic.unpipe(recognizeStream);
  delete recognizeStream;
}

function say(text) {
  picoSpeaker.speak(text).then(function() {
    // console.log("done");
  }.bind(this));
}