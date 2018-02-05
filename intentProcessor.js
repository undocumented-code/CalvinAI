const weather = require("./services/weather/");
const music = require("./services/gpmusic/");
const generic = {welcome: () => {}}

module.exports = {
    init: (config) => {
        weather.init(config);
        music.init(config);
    },
    process: (command, intent, say, config) => {
        console.log(JSON.stringify(intent.parameters));
        eval(intent.action).call(this, intent.parameters.fields, config, say);
    }
}
