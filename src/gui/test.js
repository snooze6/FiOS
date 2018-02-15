const manager = require('./core/frida/frida.js').manager;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test_app(app) {
    console.log('[+] ### STARTING TEST ###');
    if (app){
        await app.setup();

        if (!app.running && app.dev.spawnable) {
            console.log('[+] |--- Launching ' + app.name);
            // app.operations.disable();
            await app.run();
        }

        {
            console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - setted up');
            // console.log(app.operations);

            // Testing misc
            {
                // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Env:');
                // console.log(await app.operations.misc.env());
                // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Info:');
                // console.log(await app.operations.misc.info());
                // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Frida:');
                // console.log(await app.operations.misc.frida());
                // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Flags:');
                // console.log(await app.operations.misc.flags());
                console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Pinning:');
                app.operations.misc.pinning(false);
                console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Root:');
                app.operations.root.disable();
                await timeout(120 * 1000);
                console.log('<End>')
            }

            // Testing filesystem
            {
                // console.log('[+] |--- Info:');
                // console.log(await app.info());
                // console.log('[+] |--- Flags:');
                // console.log(await app.flags());

                // console.log('[+] |--- Path:');
                // console.log(await app.operations.filesystem.path());
                // let pwd = await app.operations.filesystem.pwd();
                // console.log('[+] |--- PWD: ' + pwd);
                //
                // // List files
                // let files = await app.operations.filesystem.ls(pwd);
                //
                // // Detect and download a file
                // if (files && files.files){
                //     console.log(files.files['Info.plist']);
                //     console.log('Exists: '+await app.operations.filesystem.exists(pwd+'/Info.plist'));
                //     let data = await app.operations.filesystem.download(pwd+'/Info.plist');
                //     console.log(data.toString("utf-8"));
                // }
                //
                // Writing a file
                {
                    // // console.log(fs.writeFileSync("/tmp/junk", data));
                    // console.log('[+] Writing: '+btoa('Hello world\n'));
                    // console.log('[+] Writing: '+atob(btoa('Hello world')));
                    // console.log('[+] Upload result: '+await app.operations.filesystem.upload(pwd+'/junk.rm', btoa('Hello world\n')));
                    // // See file
                    // console.log('[+] isFile: '+await app.operations.filesystem.isFile(pwd+'/junk.rm'))
                    // console.log(app);

                    // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Delete:');
                    // console.log(
                    //     await app.operations.filesystem.delete(
                    //         '/var/mobile/Containers/Data/Application/7920DD6E-29A4-43C7-BA84-8962DE5E2ACB/caca'
                    //     )
                    // );
                    // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Mkdir:');
                    // console.log(
                    //     await app.operations.filesystem.mkdir(
                    //         '/var/mobile/Containers/Data/Application/7920DD6E-29A4-43C7-BA84-8962DE5E2ACB/asdf'
                    //     )
                    // );
                    // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Uploadr:');
                    // await app.upload(
                    //     '/Users/snooze/Downloads/test',
                    //     '/var/mobile/Containers/Data/Application/7920DD6E-29A4-43C7-BA84-8962DE5E2ACB/caca/')
                    // console.log('[+] - <'+app.dev.name+'> - <' + app.name + '> - Downloadr:');
                    // await app.download(
                    //     '/var/mobile/Containers/Data/Application/7920DD6E-29A4-43C7-BA84-8962DE5E2ACB/.com.apple.mobile_container_manager.metadata.plist',
                    //     '/Users/snooze/Downloads/aca')
                }
                //
                // //Other filesystem operations
                // {
                //     console.log('[+] Readable: '+await app.operations.filesystem.readable(pwd+'/junk.rm'));
                //     console.log('[+] Writable: '+await app.operations.filesystem.writable(pwd+'/junk.rm'))
                // }
                // let dir = (await app.operations.filesystem.path()).bin;
                // console.log('[+] - Download: '+dir);
                // await app.download(dir, '/tmp/dlme')
            }

            // Testing UI
            {
                // console.log('[+] UIDump:');
                // console.log(await app.operations.uidump());
                // await app.operations.alert('0xdeadbeef');
                // console.log('[+] Pasteboard:');
                // console.log(await app.operations.ui.pasteboard());
                // console.log('[+] Pasteboard:');
                // console.log(await app.operations.ui.pasteboard('caca'));
            }

            // Testing root
            {
                // console.log('[+] - Disabling Root: ');
                // console.log(await app.operations.root.disable());
                // await timeout(60000)
            }

            // Test hooking
            {
                // let classes = await app.operations.hooking.list_classes();

                // // // console.log('[+] - List classes: ');
                // // // console.log(apps);
                // //
                // let cl = classes.filter(function (item) {
                //     return item.indexOf('ailbreak') > -1;
                // });
                //
                // console.log('[+] - List jailbreak classes: ');
                // for (let c of cl){
                //     console.log(c)
                // }

                // let mods = await app.operations.hooking.list_modules();
                // console.log('[+] - List modules: ');
                // for (let m of mods){
                //     console.log('     '+m.name)
                // }

                // let exps = await app.operations.hooking.list_exports('TextInput');
                // console.log('[+] - List exports: ');
                // console.log(exps);
                // let imps = await app.operations.hooking.list_imports('TextInput');
                // console.log('[+] - List imports: ');
                // console.log(imps);

                // console.log('[+] |--- Hooking class:');
                // console.log(cl);
                // console.log('[+] |-----  List methods of class [included]: ');
                // console.log(await app.operations.hooking.list_methods(cl, true));
                // console.log('[+] |-----  List methods of class [Own]: ');
                // console.log(await app.operations.hooking.list_methods(cl));

                // console.log('Adding agent');
                // await app.operations.agents.add_src('/Users/snooze/workspace/tfg/udb/files/test_infinite.js');
                // console.log(await app.operations.agents.get_agents());
                // app.operations.agents.run_agent(
                //     '/Users/snooze/workspace/tfg/udb/files/test_infinite.js',
                //     (s)=>{
                //         console.log(s);
                //     }
                // );
                // await timeout(4000);
                // console.log('Stopping script');
                // await app.operations.agents.stop_agent('/Users/snooze/workspace/tfg/udb/files/test_infinite.js');
                //
                // await timeout(10000)
            }

            // Test Memory
            {
                // console.log('[+] - Dumping memory');
                // let dump = await app.dump_mem();
                // let dir = '/tmp/dlme';
                // console.log('[+] - Saving dump to '+dir);
                // await app.save_mem(dir, dump);
                // console.log('[+] - Saving dump to zip in '+dir);
                // await app.save_mem_zip(dir, dump);
            }
        }

        if (!app.running) {
            app.stop()
        }
    }
    console.log('[+] ### END TEST ###');
    return
}
async function test_device(dev){
    if (dev.server){
        console.log('[+] --- Testing {dev: '+dev.id+'}');

        console.log('[+] ----- Show frida information');
        console.log(await dev.frida.operations.misc.frida());
        // console.log('[+] ----- Show type information');
        // console.log(await dev.frida.operations.misc.type());
        // console.log('[+] ----- Show info information');
        // console.log(await dev.frida.operations.misc.info());

        // console.log('[+] ----- Listing arbitrary path');
        // console.log(await dev.frida.operations.filesystem.ls('/var/root'))

        // console.log('[+] ----- List apps');
        // console.log(await dev.get_apps());

        // console.log('[+] ----- Spawn');
        // let app = await (await dev.attach('com.saurik.Cydia')).setup();
        // console.log('[+] ----- Running:   '+app.running);
        // console.log('[+] ----- Ready:     '+app.ready);
        // await timeout(1000);
        // console.log('[+] ----- Launching: '+app.ready);
        // await app.run();
        // await timeout(1000);
        // console.log('[+] ----- Running:   '+app.running);
        // console.log('[+] ----- Ready:     '+app.ready);

        // console.log('[+] ----- Adding agent');
        // await dev.frida.operations.agents.add_agent('D:\\workspace\\tfg\\udb-js\\files\\test.js');
        // console.log('[+] ----- Getting agent');
        // console.log(await dev.frida.operations.agents.get_agent('D:\\workspace\\tfg\\udb-js\\files\\test.js'));
        // console.log('[+] ----- Running agent');
        // console.log(await dev.frida.operations.agents.run_agent('D:\\workspace\\tfg\\udb-js\\files\\test.js'));
        // await timeout(1000);
        // // console.log('[+] ----- Deleting agents');
        // // console.log(await dev.frida.operations.agents.del_agent('D:\\workspace\\tfg\\udb-js\\files\\test.js'));
        // console.log('[+] ----- Agents');
        // console.log(dev.frida.agents)
    }
}

async function main () {
    let man = await new manager().setup();
    let devices = await man.list();

    {
        console.log('[+] - Devices');
        for (let dev of devices) {
            console.log("[+] |-- " + dev.id)
        }
    }

    let android = null, iOS=null;

    android =
        await man.get('0486a2e843886fba') || // Moto G4 plus
        await man.get('0271de74185714b9'); // Nexus 5X
    iOS =
        await man.get('6835ce9eb6496206ac817055ce212a99cbbb2d2e') || // iPhone 4S
        await man.get('8e38e87af4d142cc0ebb5787b7acdf20962a7d4d') || // iPhone 6S plus
        await man.get('1a0db7422d352ad2eda24779112d67373b30380e'); // iPad mini
    {
        if (iOS){
            await iOS.setup();

            console.log('[+] - <'+iOS.name+'> - connected! ');
            console.log('      Arch:      '+await iOS.type());
            console.log('      Spawnable: '+await iOS.spawnable);
            console.log('      Server:    '+await iOS.server);
            console.log('      Attached:  '+await iOS.attached);

            // await test_device(iOS);

            // await test_app(await iOS.attach('sg.vp.UnCrackable1'));
            // await test_app(await iOS.attach('com.rootcheck'));
        }
        if (android){
            await android.setup();

            console.log('[+] - <'+android.name+'> - connected!');
            console.log('      Arch:      '+await android.type());
            console.log('      Spawnable: '+await android.spawnable);
            console.log('      Server:    '+await android.server);
            console.log('      Attached:  '+await android.attached);
            console.log('      ---  ---  -  ---  ---');

            // await test_device(android);

            // await test_app(await android.attach('com.amphoras.hidemyroot'));
            // await test_app(await android.attach('sg.vantagepoint.uncrackable1'));
            // await test_app(await android.attach('com.joeykrim.rootcheck'));
            let app = await android.attach('com.bankinter.empresas');
            if (app)
                await test_app(app);
            else
                console.log('[!] - ERROR: App not attached')
        }
    }
}

if (!module.parent || (process.versions['electron'] && process.mainModule.filename.indexOf('test.js') !== -1)) {
    console.log('<  Info >');
    console.log('  Node version: '+process.version);
    console.log('  ABI version:  '+process.versions.modules);
    console.log('  Arch:         '+process.arch);
    console.log('  Platform:     '+process.platform);
    console.log('< /Info >');

    // this is the main module
    main().then(() => {console.log('Finished succesfully'); process.exit(0)}, (error) => {console.error(error.stack); process.exit(-1)})
}

// server.listen(port, hostname, () => {
//     console.log(`Server running at http://${hostname}:${port}/`);
// });