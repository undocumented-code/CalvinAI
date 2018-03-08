const request = require('request');
const moment = require('moment');
const tz = require('moment-timezone');

module.exports = {
    init: () => {},
    query: (params, config, say) => {
        console.log(params);
        const where = params["geo-country"].stringValue || params["geo-city"].stringValue;
        if(where == "") {
            say(moment().format(`[The time is] h m A`));
            return;
        }
        console.log(where);
        request.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${where}&key=${config.gapikey}`, (error, response, body) => {
            if(error) {
                say("There was an error finding the time there");
                return;
            }
            let data = JSON.parse(body);
            console.log(data);
            const lat = data.results[0].geometry.location.lat;
            const lng = data.results[0].geometry.location.lng;
            request.get(`https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Date.now()/1000}&key=${config.gapikey}`, (error, response, body) => {
                let data2 = JSON.parse(body);
                const time = moment.tz(data2.timeZoneId);
                if(time.format('e') == moment().format('e')) say(time.format(`[The time in ${where} is] h m A`));
                else say(time.format(`[The time in ${where} is] h m A [on] dddd`));
            });
        });
    }
}