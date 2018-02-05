const weather = require("./services/weather");
const music = require("./service/gpmusic");

module.exports = {
    init: (config) => {
        weather.init(config);
        music.init(config);
    },
    process: (command, intent, say, config) => {
        console.log(JSON.stringify(intent.parameters));
        eval(intent.action).call(intent.parameters, say, config);
    }
}
