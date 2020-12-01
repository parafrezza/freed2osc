// rf 2020
const settings         = require('./settings.json'),
      fs               = require('fs'),
      chalk            = require("chalk"),
      boxen            = require("boxen"),
      yargs            = require("yargs"),
     // yargsInteractive = require("yargs-interactive");
      greeting         = chalk.white.bold("Here's your simple free-d to OSC translator.\nHallo."),
      osc              = require('osc'),
      dgram            = require('dgram'),
      server           = dgram.createSocket('udp4');
let   isOSCReady       = false,
      udpPort          = new osc.UDPPort(
                         {
                            localPort: settings.OSCLocalPort,
                            localAddress: settings.receivingIP,
                            metadata: true,
                            broadcast: true
                         });
const boxenOptions = 
{
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
    backgroundColor: "#777711"
    };
const msgBox = boxen( greeting, boxenOptions );
console.clear();
console.log(msgBox);
settings.DEBUG = true;

const interactiveOptions =
 {
  incomingPort:       { type: "input", default: 1111, describe: "please enter port number you are going to receive free-D packets on" },
  OSCSendingIP:         { type: "input", default: '192.168.10.255', describe: "then IP you'd like me to relay those data" },
  outgoingPort:       { type: "input", default: 9200, describe: "finally, that port your apps expect to have OSC sent" },
};
 
// yargsInteractive()
//   .usage("$0 <command> [args]")
//   .interactive(interactiveOptions)
//   .then(result => {
//     // Your business logic goes here.
//     // Get the arguments from the result
//     // e.g. myCli(result.name);
//     settings.incomingPort = result.incomingPort;
//     settings.OSCSendingIP = result.OSCSendingIP;
//     settings.OSCSendingPort = result.OSCSendingPort;
//     let stringifiedSettings = JSON.stringify(settings);
//     //fs.writeFile('./lib/settings.json', stringifiedSettings, 'utf8', function(ero){if(ero){console.error(ero);}});
//     console.log(`\nResult is:\n` + `- incoming port: ${result.incomingPort}\n` + `- outgoing IP: ${result.OSCSendingIP}\n` + `- outgoing port: ${result.OSCSendingPort}\n`);
//   });




///////////////////////////////////////////////////////////////////  strating CLI options
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
/////////////////////////////////////////////////////////////////////  UDP and OSC taking off
udpPort.open();
udpPort.on("ready", function () { isOSCReady == true; console.log('aperta porta udp'); });
server.bind(settings.incomingPort, settings.receivingIP);
server.on('listening', function () {
    var address = server.address();
    console.log('expecting free-D on ' + address.address + ':' + address.port);
    console.log('relaying OSC data to ' + settings.OSCSendingIP + ':' + settings.OSCSendingPort);
    console.log('use -i  option to change incoming port');
    console.log('use -IP option to change outgoing IP');
    console.log('use -o  option to change outgoing port');

    });
server.on('message', function (freeDMessage, remote) 
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
    let id    =    arrByte[1];
    let pan   = (((arrByte[2]  << 24) | (arrByte[3]  << 16) | (arrByte[4]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let tilt  = (((arrByte[5]  << 24) | (arrByte[6]  << 16) | (arrByte[7]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let roll  = (((arrByte[8]  << 24) | (arrByte[9]  << 16) | (arrByte[10] << 8)) >> 8) / 32768; // 1/900 of a degree
    let x     = (((arrByte[11] << 24) | (arrByte[12] << 16) | (arrByte[13] << 8)) >> 8) / 64; // movement is expressed in 1/64 of millimeter
    let y     = (((arrByte[14] << 24) | (arrByte[15] << 16) | (arrByte[16] << 8)) >> 8) / 64; // movement is expressed in 1/64 of millimeter
    let z     = (((arrByte[17] << 24) | (arrByte[18] << 16) | (arrByte[19] << 8)) >> 8) / 64; // movement is expressed in 1/64 of millimeter
    let zoom  = (((arrByte[20] << 24) | (arrByte[21] << 16) | (arrByte[22] << 8)) >> 8) - 52488; // just a magic number
    let focus = (((arrByte[23] << 24) | (arrByte[24] << 16) | (arrByte[25] << 8)) >> 8) - 52488; // just a magic number
    if(settings.DEBUG){console.log('camera %s  -> pan: %s, tilt: %s,  zoom: %s, focus: %s', id, pan, tilt, zoom, focus);}
    shootAnOSC(id, pan, tilt, zoom, focus);
}
function shootAnOSC(id, pan, tilt, roll, x, y, z, zoom, focus)
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
                value: roll
            }
        ]
    }, settings.OSCSendingIP, settings.OSCSendingPort);
    udpPort.send({
        address: "/panasonic" + id + "/position/",
        args: [
            {
                type: "f",
                value: x
            },
            {
                type: "f",
                value: y
            },
            {
                type: "f",
                value: z
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
function test()
{
    udpPort.send({
    address: "/panasonic" +255 + "/rotation/",
    args: [
        {
            type: "f",
            value: 342
        },
        {
            type: "f",
            value: 4323
        },
        {
            type: "f",
            value: 0
        }
    ]
}, settings.OSCSendingIP, settings.OSCSendingPort);
}
// pkg . -t node14-win-x64

/*
from free-d PDF:

B.8 Camera zoom
The Camera Zoom is defined as the vertical angle of view of the camera; ie,
the vertical angle subtended at the camera lens by the top and bottom edges
of the active picture.
The value is expressed as a 24-bit positive unsigned number in arbitrary units
related to the rotation of the ‘zoom ring’ on the camera lens. It will be
necessary for the host system to convert this to a true zoom value based on
the type and particular sample of lens and camera in use.
B.9 Camera focus
The Camera Focus is defined as the distance between the camera lens and
an object at which the object will be in sharp focus. The value is expressed as
a 24-bit positive unsigned number in arbitrary units related to the rotation of
the ‘focus ring’ on the camera lens. It will be necessary for the host system to
convert this to a true focus value based on the type and particular sample of
lens and camera in use. 
/*