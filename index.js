const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');
const Speech = require('@google-cloud/speech');
const speech = Speech();

const models = new Models();

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US';

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
  interimResults: true // If you want interim results, set this to true
};

detector.on('hotword', function (index, hotword, buffer) {
  console.log('hotword', index, hotword);
  
  var file = fs.createReadStream('listening.wav');
  var reader = new wav.Reader();
   
  // the "format" event gets emitted at the end of the WAVE header 
  reader.on('format', function (format) {
    reader.pipe(new Speaker(format));
  });
  file.pipe(reader);

  // Create a recognize stream
  const recognizeStream = speech.streamingRecognize(request)
    .on('error', console.error)
    .on('data', (data) =>
      process.stdout.write(
        (data.results[0] && data.results[0].alternatives[0])
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : `\n\nReached transcription time limit, press Ctrl+C\n`));

  // Start recording and send the microphone input to the Speech API
  mic.pipe(recognizeStream);
});

mic.pipe(detector);