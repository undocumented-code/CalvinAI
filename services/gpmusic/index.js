const { spawn } = require('child_process');
const net = require('net');
var backingProcess, client;

module.exports = {
    init: (config) => {
        backingProcess = spawn("python",["gpmusic_backing.py", config.google.username, config.google.password]);
        client = new net.Socket();
        client.connect("gpmusic.sock", function() {
            console.log("Connected to gpmusic backing service");
        });
    },
    query: (params, config, say) => {
        const artist = params.artist || "";
        const album = params.album || "";
        const genre = params.genre || "";
        const song = params.song || "";
        if(song) client.write(`play song ${song} ${album} ${artist}`);
        else if (album) client.write(`play album ${album} ${artist}`);
        else if (artist) client.write(`play artist ${artist}`);
        else if(genre) client.write(`play genre ${genre}`);
    },
    control: (params, config, say) => {
        const action = params["music-direction"];
        client.write(action);
    },
    stop: (params, config, say) => {
        client.write("stop");
    }
}