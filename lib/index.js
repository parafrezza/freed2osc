const { option } = require('yargs');

// rf 2020
const settings      = require('./settings.json'),
      chalk         = require("chalk"),
      boxen         = require("boxen"),
      yargs         = require("yargs"),
      greeting      = chalk.white.bold("Hallo.\nI'm your simple translator.\n"),
      osc           = require('osc'),
      dgram         = require('dgram'),
      server        = dgram.createSocket('udp4');
let   isOSCReady    = false,
      udpPort       = new osc.UDPPort(
                    {
                       localPort: settings.localPort,
                       metadata: true,
                       broadcast: true
                    });
const boxenOptions = 
{
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    backgroundColor: "#555555"
    };
const msgBox = boxen( greeting, boxenOptions );
console.log(msgBox);

const options = yargs
 .usage("Usage: -i <incomingPort>")
 .option("i",  { alias: "incomingPort",   describe: "port you're free-d device sends packets to", type: "int", demandOption: false })
 .option("o",  { alias: "OSCSendingPort", describe: "port you're sending OSC to", type: "int", demandOption: false })
 .option("ip", { alias: "OSCSendingIP",   describe: "IP you want to send OSC to (broadcast is OK)", type: "int", demandOption: false })
 .argv;


if(options.incomingPort !== undefined && options.incomingPort)
{
    settings.incomingPort = options.incomingPort;
    console.log(settings.incomingPort);
    //const reaction = `Hello, ${options.incomingPort}!`;
    //console.log(reaction);
}
if(options.OSCSendingPort !== undefined && options.OSCSendingPort)
{
    settings.OSCSendingPort = options.OSCSendingPort;
    console.log(settings.OSCSendingPort);
    //const reaction = `Hello, ${options.OSCSendingPort}!`;
    //console.log(reaction);
}
if(options.OSCSendingIP !== undefined && options.OSCSendingIP)
{
    settings.OSCSendingIP = options.OSCSendingIP;
    console.log(settings.OSCSendingIP);
    //const reaction = `Hello, ${options.OSCSendingIP}!`;
    //console.log(reaction);
}

/////////////////////////////////////////////////////////////////////
udpPort.open();
udpPort.on("ready", function () { isOSCReady == true; });
server.bind(settings.incomingPort, settings.receivingIP);
server.on('listening', function () {
    var address = server.address();
    console.log('expecting free-D on ' + address.address + ':' + address.port);
    });
server.on('freeDMessage', function (message, remote) 
    {
        if(settings.DEBUG)
        {
            console.clear();
            console.log(freeDMessage);
        }
        parseFreeD(freeDMessage);
    });
//////////////////////////////////////////////////////////////////////////7
function parseFreeD(packet)
{
    let arrByte = Uint8Array.from(packet)
    let id = arrByte[1];
    let pan   = (((arrByte[2] << 24)  | (arrByte[3] << 16)  | (arrByte[4]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let tilt  = (((arrByte[5] << 24)  | (arrByte[6] << 16)  | (arrByte[7]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let zoom  = (((arrByte[21] << 24) | (arrByte[22] << 16) | (arrByte[23] << 8)) >> 8) - 52488; // just a magic number
    let focus = (((arrByte[24] << 24) | (arrByte[25] << 16) | (arrByte[26] << 8)) >> 8) - 52488; // just a magic number
    if(settings.DEBUG){console.log('camera %s  -> pan: %s, tilt: %s,  zoom: %s, focus: %s', id, pan, tilt, zoom, focus);}
    shootAnOSC(id, pan, tilt, zoom, focus);
}
function shootAnOSC(id, pan, tilt, zoom, focus)
{
    udpPort.send({
        address: "/panasonic" +id + "/rotation/",
        args: [
            {
                type: "f",
                value: pan
            },
            {
                type: "f",
                value: tilt
            },
            {
                type: "f",
                value: 0
            }
        ]
    }, settings.OSCSendingIP, settings.OSCSendingPort);
    udpPort.send({
        address: "/panasonic" + id + "/lens/",
        args: [
            {
                type: "f",
                value: zoom
            },
            {
                type: "f",
                value: focus
            }
        ]
    }, settings.OSCSendingIP, settings.OSCSendingPort);
}
