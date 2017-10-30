const { exec } = require('child_process');
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');
const Speech = require('@google-cloud/speech');
const speech = Speech();
const picoSpeaker = require('pico-speaker');
const config = require('./config.json');

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

listenForHotword();

detector.on('hotword', function (index, hotword, buffer) {
  console.log('hotword', index, hotword);
  dontListenForHotword();
  startRecognition(() => {
    playWav("listening.wav");
  }, (command) => {
    stopRecognition();
    playWav("notlistening.wav");
    say(command);
    listenForHotword();
  });
});

function listenForHotword() {
  mic.pipe(detector);
}

function dontListenForHotword() {
  mic.unpipe(detector);
}

function playWav(filename) {
  executeCommand(`aplay ${filename}`);
}

function startRecognition(onStart, onHeard) {
  let upOptions = {
    url: `https://www.google.com/speech-api/full-duplex/v1/up?key=${config.key}&pair=${pair}&output=json&lang=en-US&app=chromium&interim&continuous`,
    headers: {
      "Content-Type": "audio/l16; rate=16000",
      "Referer": "https://docs.google.com"
    }
  }
  mic.pipe(request.post(upOptions));
  
  //Create a JSON stream parser
  const parser = new require("stream").Writable({
    write: function(chunk, encoding, next) {
      let obj = JSON.parse(chunk);
      if(obj.result.length === 0) onStart();
      //console.log(obj);
      if(obj && obj.result && obj.result[0] && obj.result[0].alternative && obj.result[0].alternative[0] && obj.result[0].alternative[0].transcript && obj.result[0].final) {
        console.log(obj.result[0].alternative[0].transcript);
        onHeard(obj.result[0].alternative[0].transcript)
      }
      next();
    }
  });
  
  //Start the downloading (text) stream:
  request.get(`https://www.google.com/speech-api/full-duplex/v1/down?key=${config.key}&pair=${pair}&output=json`).pipe(parser);
}

function stopRecognition() {
  mic.unpipe();
}

function say(text) {
  picoSpeaker.speak(text).then(function() {
    // console.log("done");
  }.bind(this));
}

function executeCommand(cmd) {
  exec(cmd, (err, stdout, stderr) => {});
}