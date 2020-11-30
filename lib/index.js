// rf 2020
const settings      = require('./settings.json'),
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
        let    udpPortDiMerda       = new osc.UDPPort(
            {
                localPort: 57121,
                metadata: true,
                broadcast: true
            });
udpPortDiMerda.open();
try 
{
udpPort.open();
}
catch(ero)
{
    console.log('can\'t open this fancy %s port of yours', settings.localPort);
}

udpPort.on("ready", function () { isOSCReady == true; });
server.bind(settings.receivingPort, settings.receivingIP);
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
    }, settings.IP, settings.port);
}
