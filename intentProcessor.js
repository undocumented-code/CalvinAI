const weather = require("./services/weather/");
const music = require("./services/gpmusic/");
const generic = {welcome: () => {}}
const fallback = () => {}

const processes = [];

module.exports = {
    init: (config) => {
        processes.push(weather.init(config));
        processes.push(music.init(config));
    },
    clean: () => {
        processes.map((x) => x.kill());
    },
    process: (command, intent, say, config) => {
        console.log(JSON.stringify(intent.parameters));
        eval(intent.action).call(this, intent.parameters.fields, config, say);
    }
}
