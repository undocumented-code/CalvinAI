const weather = require("./services/weather.js");

module.exports = (command, intent, say, config) => {
    switch(intent.action) {
        case "weather.query":
            //This horrible bit was generated by coffee script so I could use the ? operator
            var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8;
            console.log(JSON.stringify(intent.parameters));
            weather.query((ref = intent.parameters) != null ? (ref1 = ref.fields) != null ? (ref2 = ref1["weather-type"]) != null ? ref2.stringValue : void 0 : void 0 : void 0, (ref3 = intent.parameters) != null ? (ref4 = ref3.fields) != null ? (ref5 = ref4.date) != null ? ref5.stringValue : void 0 : void 0 : void 0, typeof intent !== "undefined" && intent !== null ? (ref6 = intent.parameters) != null ? (ref7 = ref6.fields) != null ? (ref8 = ref7["geo-city"]) != null ? ref8.stringValue : void 0 : void 0 : void 0 : void 0, config, say);        
            break;
        case "fallback":
            break;
    }
}