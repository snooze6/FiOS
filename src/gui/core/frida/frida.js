const frida = require('frida');
const path = require('path');
const fs = require('fs');
const plist = require('plist');
const bplist = require('bplist');
const zip = require('node-native-zip');
const machoEntitlements = require('macho-entitlements');
const macho = require('macho');

class application{
    constructor(dev, pid, name, running, ap){
        // Parameters
        this.dev = dev;
        this.pid = pid;
        this.name = name;
        this.icon = (ap) ? ap.largeIcon :  null;

        // Is app running
        this.running = (running === undefined) ? true : running;

        this.operations = null;
        this.agents = [];
    }

    get ready(){
        return this.running || !!(this.operations)
    }

    async setup(){
        const script = await this.createScript(
            path.join(__dirname+'/agents.js')
        );
        const api = await script.getExports();
        let self = this;

        this.operations = {
            filesystem: {
                pwd: api.pwd,
                path: api.path,
                ls: api.ls,
                exists: api.exists,
                _download: api.download,
                _upload: api.upload,
                isFile: api.isFile,
                writable: api.writable,
                readable: api.readable,
                delete: api.delete,
                mkdir: api.mkdir,
                // Recursive upload and download
                download: self._download.bind(self),
                upload: self._upload.bind(self)
            },
            hooking: {
                list_class_methods: api.list_class_methods,
                list_classes: api.list_classes,
                list_modules: api.list_modules,
                list_exports: api.list_exports,
                list_imports: api.list_imports,
                list_methods: api.list_class_methods,
            },
            keychain: {
                clear: api.key_clear,
                dump: api.key_dump,
            },
            memory: {
                dump: self._dump_mem.bind(self),
                _dump: api.dump,
                ranges: self._enumerate_ranges.bind(self),
                dump_range: self._dump_mem.bind(self),
                save: self._save_mem.bind(self),
                save_zipped: self._save_mem_zip.bind(self)
            },
            root: {
                disable: api.disable,
                simulate: api.simulate,
            },
            ui: {
                alert: api.alert,
                uidump: api.uidump,
                pasteboard: api.pasteboard,
                screenshot: api.screenshot,
            },
            misc: {
                env: api.env,
                info: api.info,
                frida: api.frida,
                type: api.type,
                pinning: api.pinning,
                plist: this._info.bind(this),
                flags: this._bin_info.bind(this),
            },
            agents: {
                add_src: this._add_src.bind(this),
                add_agent: this._add_agent.bind(this),
                del_agent: this._del_agent.bind(this),
                get_agents: this._get_agents.bind(this),
                get_agent: this._get_agent.bind(this),
                run_agent: this._run_agent.bind(this),
                stop_agent: this._stop_agent.bind(this)
            }
        };

        return this;
    }
    async _read(path){
        // console.log('[+] - Reading: '+path);
        return fs.readFileSync(path, 'utf-8');
    }
    async createScript(path){
        const script = await this.pid.createScript(await this._read(path));
        script.load();
        return script;
    }

    async run(){
        if (!this.running) {
            // console.log('[+] - <' + this.dev.name + '> - <' + this.name + '> - starting...');
            await this.dev.dev.resume(this.pid.pid);
            this.running = true
        } else {
            throw new Error(this.name+' is already running')
        }
    }
    async stop(){
        if (this.ready) {
            // console.log('[+] - <'+this.dev.name+'> - <'+this.name+'> - stopping...');
            // TODO: Remove agents
            this.pid.detach();
        } else {
            throw new Error(this.name+' is not running')
        }
    }

    // -----------------------------------------------------------------------------------------------------------------

    async _enumerate_ranges(perms){
        if (!perms){
            perms = 'rw-'
        } else {
            if (perms.length > 3
                || perms[0] !== 'r'
                || !(perms[1] === 'w' || perms[1] === '-')
                || !(perms[2] === 'x' || perms[2] === '-'))
                throw new Error('Invalid perms');
        }

        console.log('[+] --- Dumping ranges - {perms: '+perms+'}');
        return await this.pid.enumerateRanges(perms);
    }
    async _dump_mem(ranges, perms){
        ranges = ranges || await this._enumerate_ranges(perms);
        perms = perms || 'rw-';
        console.log('[+] --- Dumping memory - {perms: '+perms+'}');

        let data = {};
        for (let range of ranges){
            let d = '0x'+range.baseAddress.toString(16);
            // console.log('  -- Dumping: {Base: '+d+' - Size: '+range.size+'}');
            let bytes = await this.operations.memory._dump(range.baseAddress, range.size);
            data[d] = bytes
        }

        return data;
    }
    async _save_mem(dir, dump) {
        if (!dump){
            dump = this.dump_mem();
        }
        console.log('[+] --- Saving dump {dir: '+dir+'}');
        if (dir) {
            let exists = fs.existsSync(dir);
            if (exists && !fs.lstatSync(dir).isDirectory()) throw new Error('File exists and is not a directory');
            if (!exists) mkdirp(dir);

            for (let key in dump) {
                // console.log('  -- Saving: {Base: '+key+'}');
                fs.writeFileSync(dir+'/0x'+key+'_dump.data', dump[key])
            }
        } else throw Error('No directory specified')
    }
    async _save_mem_zip(dir, dump){
        if (!dump){
            dump = this.dump_mem();
        }
        let timestamp = new Date();
        let filename = this.name
            +' '
            +timestamp.getFullYear()
            +'-'+(timestamp.getMonth()+1)
            +'-'+timestamp.getDate()
            +' '+timestamp.getHours()
            +':'+timestamp.getMinutes();
        console.log('[+] --- Saving dump compressed {filename: '+filename+'}');
        if (dir) {
            let exists = fs.existsSync(dir);
            if (exists && !fs.lstatSync(dir).isDirectory()) throw new Error('File exists and is not a directory');
            if (!exists) mkdirp(dir);

            let archive = new zip();

            for (let key in dump) {
                // console.log('  -- Saving: {Base: '+key+'}');
                archive.add('0x'+key+'_dump.data', dump[key])
            }

            fs.writeFileSync(dir+'/'+filename+'.zip', archive.toBuffer());
        } else throw Error('No directory specified')
    }
    async _info(){
        function help(app) {
            return new Promise(async function (resolve, reject) {
                let pwd = await app.operations.filesystem.pwd();
                if (await app.operations.filesystem.exists(pwd + '/Info.plist')) {
                    let info = await app.operations.filesystem._download(pwd + '/Info.plist');
                    bplist.parseBuffer(info, function (err, result) {
                        if (err) {
                            try {
                                resolve(plist.parse(info.toString('utf-8')))
                            } catch (e) {
                                reject (new Error('Cannot parse plist'))
                            }
                        } else {
                            resolve(result[0])
                        }
                    });
                } else {
                    return null
                }
            });
        }
        return await help(this)
    }
    async _bin_info(){
        function help(app) {
            return new Promise(async function (resolve, reject) {
                let pwd = await app.operations.filesystem.pwd();
                let bin = (await app._info()).CFBundleExecutable;
                if (await app.operations.filesystem.exists(pwd + '/' + bin)) {
                    console.log(pwd + '/' + bin);

                    let info = await app.operations.filesystem._download(pwd + '/' + bin);
                    let modules = await app.operations.hooking.list_modules();
                    let red = modules.reduce(function(names,imp){
                        names.add(imp.name);
                        return names
                    }, new Set());

                    let entilements = plist.parse(machoEntitlements.parse(info).toString());
                    let headers = null;
                    try {
                         headers = macho.parse(info);
                    } catch (e){
                        console.log('[-] Error parsing Mach0')
                    }

                    resolve({
                        entilements: entilements,
                        flags: {
                            pie: headers ? !!(headers.flags.pie) : null,
                            encrypted: headers ? headers.cmds.some(function (cmd) {
                                return /^encryption_info_(32|64)$/.test(cmd.type) && cmd.id === 1
                            }) : null,
                            canary: red.has('__stack_chk_guard'),
                            arc: red.has('objc_release')
                        }
                    })
                } else {
                    throw new Error('Binary file not found')
                }
            });
        }
        return await help(this)
    }
    async _download(apath, dest){
        let _0777 = parseInt('0777', 8);
        function mkdirp (p, opts, f, made) {
            if (typeof opts === 'function') {
                f = opts;
                opts = {};
            }
            else if (!opts || typeof opts !== 'object') {
                opts = { mode: opts };
            }

            let mode = opts.mode;
            const xfs = opts.fs || fs;

            if (mode === undefined) {
                mode = _0777 & (~process.umask());
            }
            if (!made) made = null;

            let cb = f || function () {
            };
            p = path.resolve(p);

            xfs.mkdir(p, mode, function (er) {
                if (!er) {
                    made = made || p;
                    return cb(null, made);
                }
                switch (er.code) {
                    case 'ENOENT':
                        mkdirp(path.dirname(p), opts, function (er, made) {
                            if (er) cb(er, made);
                            else mkdirP(p, opts, cb, made);
                        });
                        break;

                    // In the case of any other error, just see if there's a dir
                    // there already.  If so, then hooray!  If not, then something
                    // is borked.
                    default:
                        xfs.stat(p, function (er2, stat) {
                            // if the stat fails, then that's super weird.
                            // let the original error be the failure reason.
                            if (er2 || !stat.isDirectory()) cb(er, made)
                            else cb(null, made);
                        });
                        break;
                }
            });
        }
        async function _download(app, apath, dest) {
            if (await app.operations.filesystem.isFile(apath)){
                let data = await app.operations.filesystem._download(apath);
                fs.writeFileSync(dest,data)
            } else {
                mkdirp(dest);
                let ls = await app.operations.filesystem.ls(apath);
                // console.log(ls.files);
                for (let dir in ls.files){
                    let n = '/'+ls.files[dir].fileName;
                    await _download(app, apath+n, dest+n)
                }
            }
        }

        if (apath && dest && fs.existsSync(dest) && fs.lstatSync(dest).isDirectory()){
            if (await this.operations.filesystem.exists(apath)){
                if (await this.operations.filesystem.isFile(apath)){
                    console.log('[+] --- Downloading {from: ' + apath + ', to: ' + dest + '}');
                    let data = await this.operations.filesystem._download(apath);
                    let split = apath.split('/');
                    fs.writeFileSync(dest+'/'+split[split.length-1],data)
                } else {
                    console.log('[+] --- Downloading {from: ' + apath + ', to: ' + dest + '}');
                    await _download(this, apath, dest)
                }
            } else {
                throw new Error('File not exists in remote')
            }
        } else {
            throw new Error('Invalid arguments')
        }
    }
    async _upload(apath, dest){
        async function _upload(app, apath, dest) {
            if (fs.lstatSync(apath).isDirectory()){
                await app.operations.filesystem.mkdir(dest, true);
                for (let f of fs.readdirSync(apath)){
                    let n = '/'+f;
                    await _upload(app, apath+n, dest+n);
                }
            } else {
                let data = fs.readFileSync(apath).toString('base64');
                await app.operations.filesystem._upload(dest, data)
            }
        }

        if (apath && dest){
            if (!await this.operations.filesystem.exists(dest)){
                await this.operations.filesystem.mkdir(dest, true);
            }
            if (!fs.existsSync(apath)){
                throw new Error('Not found file to upload')
            }

            if (await this.operations.filesystem.isFile(dest)){
                throw new Error('Destination is a file not a folder')
            } else {
                if (await this.operations.filesystem.writable(dest)){
                    console.log('[+] --- Uploading {from: '+apath+', to: '+dest+'}');
                    if (fs.lstatSync(apath).isDirectory())
                        await this.operations.filesystem.mkdir(dest+'/'+path.basename(apath), true);
                    await _upload(this, apath, dest+'/'+path.basename(apath))
                } else {
                    throw new Error('Folder not writable')
                }
            }
        } else {
            throw new Error('Invalid arguments {path:'+apath+',dest:'+dest+'}')
        }
    }

    async _add_agent(name, src){
        this.agents.push({
            name: name,
            script: null,
            src: src,
            api: null
        });

        return true
    }
    async _add_src(path){
        return this._add_agent(path, await this._read(path))
    }
    async _get_agents(){
        return this.agents;
    }
    async _del_agent(name){
        let agent = null;
        this.agents = this.agents.filter(a => {
            if (a.name!==name) {return true} else {agent = a; return false}
        });
        if (agent && agent.script) await this.operations.agents.stop_agent(name);
    }
    async _get_agent(name){
        return this.agents.filter(a => { return a.name===name })[0]
    }
    async _run_agent(name, onmsg){
        let agent = await this._get_agent(name);
        if (agent) {
            const script = await this.pid.createScript(await this._read(agent.name));
            script.events.listen('message', onmsg);
            agent.script = script;
            agent.script.load();
            agent.api = await script.getExports();

            await agent.api.run();
        } else
            throw new Error('Agent not found');
        return true;
    }
    async _stop_agent(name){
        let agent = await this._get_agent(name);
        if (agent) {
            await agent.script.unload()
        }
        return true
    }
}

class device{
    constructor(dev){
        this.dev = dev;
        this.name = this.dev.name;
        this.id = this.dev.id;

        this.app = null;
        this.frida = null;
        this.spawn = false;
    }

    get spawnable(){
        return this.spawn
    }
    get attached(){
        return this.app ? this.app.name : false
    }
    get server(){
        return !!(this.frida);
    }

    /**
     * Attach to the frida-server
     * @returns {Promise.<void>}
     */
    async setup(){
        if (!this.frida) {
            let ps = await this.dev.enumerateProcesses();
            // Frida server can be renamed
            let p = await ps.find(o => o.name === 'frida-server' || o.name === 'frida');

            if (p) {
                let pid = await this.dev.attach(p.pid);
                let app = new application(this.dev, pid, p.name, true, p.largeIcon);
                if (app) {
                    await app.setup();
                    this.frida = app;
                }

                this.spawn = await this._spawnable();
            }
        }
        return this
    }
    async get_apps(){
        return await this.dev.enumerateApplications();
    }
    async attach(apid){
        let apps = await this.get_apps();

        for (let i in apps){
            let ap = apps[i];
            if (ap.identifier === apid){
                // console.log(ap);
                if (ap.pid !== 0) {
                    console.log('[+] - <'+this.name+'> - <'+apid+'> - attached');
                    let pid = await this.dev.attach(ap.pid);
                    this.app = new application(this, pid, apid, true, ap);
                    return this.app
                } else {
                    // TODO: Why this crashes in iOS? (https://github.com/frida/frida/issues/373)
                    if (await this.spawnable) {
                        console.log('[+] - <'+this.name+'> - <'+apid+'> - spawned');
                        let pid = await this.dev.attach(await this.dev.spawn([apid]));
                        this.app = new application(this, pid, apid, false, ap);
                        return this.app
                    } else {
                        console.log('[+] - <'+this.name+'> - <'+apid+'> - [Not] spawned ('+await this.type()+')');
                        this.app = new application(this, null, apid, false, ap);
                        return this.app
                    }
                }
            }
        }
        throw Error('App '+apid+' not installed');
        return null
    }
    async type(){
        if (this.frida && this.frida.running){
            let frinfo = await this.frida.operations.misc.frida();
            return await this.frida.operations.misc.type()
                +'_'+
                (
                    (
                        frinfo &&
                        frinfo.process_arch &&
                        frinfo.process_arch.indexOf('arm64') < 0
                    ) ? '32' : '64'
                )
        }
    }
    async _spawnable(){
        let type = await this.type();
        return (type) ? (type !== 'iOS_32') : false
        // return true
    }
    async detach(stop){
        if (stop)
            await this.app.stop();
        this.app = null;
    }
}

class manager{
    constructor(dev){
        this.devs = [];
    }

    async setup() {
        this.mgr = await frida.getDeviceManager();
        await this.refresh();
        // this.devs.push(await this.add('192.168.1.3:1337'));
        return this
    }

    /**
     *
     * @param onAdd function(device)
     * @param onDel function(device)
     * @param onChg function(device)
     * @returns {Promise.<void>}
     */
    async hook(onAdd, onChg, onDel){
        if (onAdd) {
            this.mgr.events.listen('added', onAdd);
        }
        if (onDel) {
            this.mgr.events.listen('removed', onDel);
        }
        if (onChg){
            this.mgr.events.listen('changed', onChg);
        }
    }

    async list(){
        return this.devs;
    }

    async refresh(){
        let d = await this.mgr.enumerateDevices();
        this.devs = [];
        for (let i of d){
            this.devs.push(new device(i))
        }
        return this.devs;
    }

    async get(id){
        let d = this.devs.filter(function (obj) {
            return obj.id === id;
        })[0];
        // d ? console.log(d) : console.log('null');
        return d ? d : null
    }

    async add(str){
        await this.mgr.addRemoteDevice(str)
    }
}

// ---------------------------------------------------------------------------

module.exports = {
    application: application,
    device: device,
    manager: manager
};