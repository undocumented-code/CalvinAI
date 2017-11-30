const weather = require("./services/weather.js");

module.exports = (command, intent, say, config) => {
    switch(intent.action) {
        case "weather.query":
            weather.query(intent.parameters.fields["weather-type"].stringValue, intent.parameters.fields.date.stringValue, intent.parameters.fields["geo-city"].stringValue, config, say);
            break;
        case "fallback":
            break;
    }
}