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
    let id    =    arrByte[1];
    let pan   = (((arrByte[2]  << 24) | (arrByte[3]  << 16) | (arrByte[4]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let tilt  = (((arrByte[5]  << 24) | (arrByte[6]  << 16) | (arrByte[7]  << 8)) >> 8) / 32768; // 1/900 of a degree
    let roll  = (((arrByte[8]  << 24) | (arrByte[9]  << 16) | (arrByte[10] << 8)) >> 8) / 32768; // 1/900 of a degree
    let x     = (((arrByte[11] << 24) | (arrByte[12] << 16) | (arrByte[13] << 8)) >> 8) / 32768; // getting rid of some unused resolution
    let y     = (((arrByte[14] << 24) | (arrByte[15] << 16) | (arrByte[16] << 8)) >> 8) / 32768; // getting rid of some unused resolution
    let z     = (((arrByte[17] << 24) | (arrByte[18] << 16) | (arrByte[19] << 8)) >> 8) / 32768; // getting rid of some unused resolution
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
<<<<<<< HEAD
    }, settings.IP, settings.port);
=======
    }, settings.OSCSendingIP, settings.OSCSendingPort);
>>>>>>> 9d08b412efa77b3d984d71ae141244f5333e0322
}
