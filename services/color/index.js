const { spawn } = require('child_process');
const net = require('net');
const colors = require('color-name');
var backingProcess, client;

module.exports = {
    init: (config, say) => {
        //We're going to assume the color process was started by init.d
        setTimeout(() => {
            client = new net.Socket();
            client.connect({path:"/tmp/color.sock"}, function() {
                console.log("Connected to color backing service");
            });
        },2000);
        return backingProcess;
    },
    set: (params, config, say) => {
        const colorName = params.color.stringValue || ""; 
        const color = colors[colorName].join(" ");
        client.write(`color ${color}`);
    },
    animate: (params, config, say) => {
        //Really just for internal stuff like thinking and errors
        client.write(`animation ${params.name}`);
    },
    on: (params, config, say) => {
        client.write(`on`);        
    },
    off: (params, config, say) => {
        client.write(`off`);        
    },
    pause: (params, config, say) => {
        client.write(`pause`);        
    },
    resume: (params, config, say) => {
        client.write(`resume`);        
    }
}