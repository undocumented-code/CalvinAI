const weather = require("./services/weather.js");

module.exports = (command, intent, say) => {
    switch(intent.action) {
        case "weather.query":
            console.log(intent.parameters.fields.date);
            console.log(intent.parameters.fields["geo-city"]);
            console.log(intent.parameters.fields["weather-type"]);
            say("Weather my dude");
            break;
        case "fallback":
            break;
    }
}