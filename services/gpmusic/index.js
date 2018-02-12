const { spawn } = require('child_process');
const net = require('net');
var backingProcess, client;

module.exports = {
    init: (config, say) => {
        backingProcess = spawn("/usr/bin/python",[__dirname+"/gpmusic_backing.py", config.google.username, config.google.password]);
        const uint8arrayToString = (data) => String.fromCharCode.apply(null, data);
        backingProcess.stdout.on('data', (data) => {
            say(uint8arrayToString(data));
        });
        backingProcess.stderr.on('data', (data) => {
            console.log("[GPMUSIC info]",uint8arrayToString(data));
        });
        backingProcess.on('exit', (code) => {
            console.log("[GPMUSIC]", "Process quit with code: " + code);
        });
        setTimeout(() => {
            client = new net.Socket();
            client.connect({path:"/tmp/gpmusic.sock"}, function() {
                console.log("Connected to gpmusic backing service");
            });
        },2000);
        return backingProcess;
    },
    query: (params, config, say) => {
        const artist = params.artist.stringValue || "";
        const album = params.album.stringValue || "";
        const genre = params.genre.stringValue || "";
        const song = params.song.stringValue || "";
        if(song) client.write(`play song ${song} ${album} ${artist}`);
        else if (album) client.write(`play album ${album} ${artist}`);
        else if (artist) client.write(`play artist ${artist}`);
        else if(genre) client.write(`play genre ${genre}`);
    },
    control: (params, config, say) => {
        const action = params["music-direction"].stringValue;
        client.write(action);
    },
    stop: (params, config, say) => {
        client.write("stop");
    },
    attenuate: (params, config, say) => {
        if(params.down) client.write("pause");
        else client.write("resume");
    }
}