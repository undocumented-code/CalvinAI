const { spawn } = require('child_process');
const net = require('net');
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
        const color = params.color.stringValue || "";
        
    }
}