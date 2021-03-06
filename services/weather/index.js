const request = require('request');
const moment = require('moment');

module.exports = {
    init: () => {},
    query: (params, config, say) => {
        const what = params["weather-types"].stringValue;
        const when = params["date"].stringValue;
        const where = params["geo-city"].stringValue;
        console.log({when, where, say});
        var days = (when)?Math.round(moment.duration(moment(when).diff(moment())).asDays()):0;
        console.log("Weather for", days, "days in the future");
        if(days==0) {
            let todayWeatherHandler = (error, response, body) => {
                let data = JSON.parse(body);
                console.log(data);
                let output = "The current weather ";
                if (where) output += `in ${where}`
                output += "is " + Math.round(data.main.temp) + " degrees with " + data.weather[0].description;
                say(output);
            }
            if(where) request.get(`http://api.openweathermap.org/data/2.5/weather?q=${where}&appid=${config.weatherKey}&units=imperial`, todayWeatherHandler);
            else request.get(`http://api.openweathermap.org/data/2.5/weather?lat=${config.location.latitude}&lon=${config.location.longitude}&appid=${config.weatherKey}&units=imperial`, todayWeatherHandler);
        } else {
            let laterWeatherHandler = (error, response, body) => {
                let data = JSON.parse(body);
                let output = "The weather for " + moment(when).calendar().split(" ")[0];
                if (where) output += ` in ${where}`
                let forecast = data.list.filter(x => moment(when).diff(x.dt*1000, "hours") < 2)[0];
                output += " will be " + Math.round(forecast.main.temp) + " degrees with " + forecast.weather[0].description;
                say(output);
            }
            if(where) request.get(`http://api.openweathermap.org/data/2.5/forecast?q=${where}&appid=${config.weatherKey}&units=imperial`, laterWeatherHandler);
            else request.get(`http://api.openweathermap.org/data/2.5/forecast?lat=${config.location.latitude}&lon=${config.location.longitude}&appid=${config.weatherKey}&units=imperial`, laterWeatherHandler);
        }
    }
}