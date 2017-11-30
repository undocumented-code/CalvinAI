const weather = require("./services/weather.js");

module.exports = (command, intent, say, config) => {
    switch(intent.action) {
        case "weather.query":
            weather.query(intent.parameters.fields["weather-type"], intent.parameters.fields.date, intent.parameters.fields["geo-city"], config, say);
            break;
        case "fallback":
            break;
    }
}