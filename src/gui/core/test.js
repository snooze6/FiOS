class A{
    constructor (name){
        this.name = name
    }

    string(){
        return this.name
    }

    obj(){
        return {string: this.string.bind(this)}
    }
}

async function main() {

    let a = new A('caca');
    console.log(a.obj());
    console.log(a.obj().string())

    // let iOS = require('./model/devices/device_ios');
    // let Android = require('./model/devices/device_android');
    //
    // iOS = new iOS({
    //     host: '127.0.0.1',
    //     port: '2222',
    //     pass: 'alpine'
    // });
    // await iOS.setup();
    //
    // const fs = require('fs'),
    //     path = require('path');
    // const dirString = path.dirname(fs.realpathSync(__filename));
    // console.log(dirString);
    //
    // await iOS.syncapp('sg.vp.UnCrackable1', '/Users/snooze/workspace/tfg/udb/del/uncrackable')

    // console.log('<  Info >');
    // console.log('  Node version: ' + process.version);
    // console.log('  ABI version:  ' + process.versions.modules);
    // console.log('  Arch:         ' + process.arch);
    // console.log('  Platform:     ' + process.platform);
    // console.log('< /Info >');
    // console.log('Requiring frida...');
    // const frida = require('src/gui/core/frida');
    // console.log(frida);
    // console.log(await frida.enumerateDevices());
}
main().catch((error)=>{console.log(error)});