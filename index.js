const { execSync } = require('child_process');
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const request = require('request');
const config = require('./config.json');
const randomstring = require("randomstring");

const intentProcessor = require("./intentProcessor.js");

const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(config.projectId, randomstring.generate({length: 16, charset: "hex", capitalization: "uppercase"}));

const cache = {};

const models = new Models();

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;

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

request('http://freegeoip.net/json/', (error, response, body) => {
  config.location = JSON.response(body);
});

listenForHotword();

detector.on('hotword', (index, hotword, buffer) => {
  console.log('hotword', index, hotword);
  dontListenForHotword();
  startRecognition(() => {
    playWav("listening.wav");
  }, (command) => {
    stopRecognition();
    playWav("notlistening.wav");
    console.log("HEARD:", command);
    var request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: command,
          languageCode: config.languageCode,
        },
      },
    };
    sessionClient
      .detectIntent(request)
      .then(responses => {
        const result = responses[0].queryResult;
        if(result.fulfillmentText) say(`${result.fulfillmentText}`);
        if (result.intent) {
          intentProcessor(command, result, say, config);
        } else {
          console.log(`No intent matched.`);
        }
      })
      .catch(err => {
        console.error('ERROR:', err);
      });
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
  let pair = randomstring.generate({length: 16, charset: "hex", capitalization: "uppercase"});
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
      let obj;
      try {
        obj = JSON.parse(chunk);
      } catch(e) {}

      if(!obj) {
        onHeard(null);
        return;
      }

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
  executeCommand(`pico2wave --wave=/tmp/voice1.wav "${text}"`);
  executeCommand("sox /tmp/voice1.wav /tmp/voice2.wav pitch -400")
  playWav("/tmp/voice2.wav");
}

function executeCommand(cmd) {
  execSync(cmd, (err, stdout, stderr) => {});
}