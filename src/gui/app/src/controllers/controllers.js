// const storage = require('electron-json-storage');
// const tmp = require('os').tmpdir();
// storage.setDataPath(tmp);

angular.module('udb.controllers', [])

.controller('main',['shared', '$stateParams', '$scope', '$location', 'Notification', function($shared, $stateParams, $scope, $location, $notification) {
    $scope.main = {
        path: $location.path(),

        section: 'frida',
        modal: false,

        devices: [],
        device: false,
        application: false,

        file: {
            path: null,
            md5: null,
            changed: false
        }
    };

    $scope.data_add={
        ip: null,
        port: null
    };

    $scope.$stateParams = $stateParams;

    // This is for debug
    $man = $shared;

    // Run an application
    $scope.run = async function () {
      if ($shared.device &&
          $scope.device.spawnable &&
          $shared.app &&
          !$shared.app.running) {
              console.log('[+] - Launching '+$shared.app.name);
              //TODO: This should't be done so late
              await $shared.app.setup();
              await $shared.app.run();
      }
    };

    $scope.add = async function(){
        if ($scope.data_add.ip &&
            ($scope.data_add.port > 1 && $scope.data_add.port<65535)){
            await $shared.manager.add($scope.data_add.ip + ':' + $scope.data_add.port)
            await $shared.manager.refresh();
            $scope.main.devices = await $shared.manager.list();
       }
    };

    // Update the url
    $scope.update = async function () {
        let path = $location.path();
        console.log('[+] {url: '+path+'}');

        if ($scope.main.section === 'frida') {
            // Ensure manager is initialized
            if ($shared.manager === null) {

                // Notifications
                async function connected(device) {
                    console.log('[+] {status: {' + device.id + '": "connected"}}');
                    await $shared.manager.refresh();
                    $scope.main.devices = await $shared.manager.list();
                    $notification.success({
                        title: '<a href="#!/frida/' + device.id + '/general">' + device.id + '</a>',
                        message: '<a href="#!/frida/' + device.id + '/general">Device connected!</a>',
                    });
                }

                async function updated() {
                    console.log('[+] {status: "Device changed!"}');
                    $notification.warning({message: 'Device changed'});
                    await $shared.manager.refresh();
                    $scope.main.devices = await $shared.manager.list();
                }

                async function deleted(device) {
                    console.log('[+] {status: {' + device.id + '": "disconnected"}}');
                    $notification.error({title: device.id, message: 'Device disconnected!'});
                    await $shared.manager.refresh();
                    $scope.main.devices = await $shared.manager.list();
                }

                let f = new friman();
                await f.setup();
                f.hook(connected, updated, deleted);
                $shared.manager = f;
                $scope.main.devices = await $shared.manager.list();
                console.log('[+] {status: "manager created"}')
            }

            // Split path
            let barras = path.split('/').length - 1;
            let device = barras > 1 ? path.split('/')[2] : null;
            let app = barras > 2 ? path.split('/')[3] : null;

            // Device
            if (device) {
                let dev = await $shared.manager.get(device);
                console.log('[+] {status: "getting device ' + device + '"}');

                if (dev) {
                    await dev.setup();
                    $scope.main.device = {
                        id: device,
                        name: dev.name,
                        icon: dev.dev.icon,
                        type: await dev.type(),
                        spawnable: dev.spawnable,
                        server: dev.server
                    };
                    $shared.device = dev;

                    // App
                    if (app && app !== 'general') {
                        // Exists app
                        $shared.app = await dev.attach(app);
                        $scope.main.application = {
                            id: app,
                            icon: $shared.app.icon,
                            running: $shared.app.running
                        };
                        console.log('[+] {status: "getting app ' + app + '"}');
                        if ($shared.app && $shared.app.running) {
                            await $shared.app.setup();
                        }
                    } else {
                        // App general or not exists
                        if (app === 'general') {
                            console.log('[+] {status: "going to general"}');
                            {
                                $scope.main.application = null;
                                $shared.app = null;
                                dev.detach();
                            }
                        } else {
                            console.log('[+] {status: "' + app + ' doesn\'t exist"}');
                            // $scope.application = null;
                            // $shared.app = null;
                            // dev.detach();
                        }
                    }
                }
            } else {
                $scope.main.device = null;
                $scope.main.application = null;
                $shared.device = null;
                $shared.app = null;
                $location.path('#!/frida');
            }

            $scope.main.path = path;

            await $scope.$apply();
        }
    };

    $scope.toggleModal = ()=>{
        $scope.main.modal = !$scope.main.modal;
    }

}])
.controller('frida', ['$scope', 'shared', function($scope, $shared) {

    // Load devices
    async function init() {
        $shared.debug('[*] {controller: "frida"}');
        $scope.$parent.section = 'frida';
        await $scope.$parent.update();
    }
    init();

}])
.controller('frida_device', ['$scope', 'shared', function($scope, $shared) {
    $scope.apps = null;
    $scope.selected = 'device';
    $scope.query = '';
    $scope.device = null;

    let device = null;

    async function init(){
        $shared.debug('[*] {controller: "frida_device"}');
        if (!$shared.device)
            await $scope.$parent.update();

        if ($shared.device) {
            device = await $shared.device;
            $scope.device = $scope.$parent.main.device;

            let apps = await device.get_apps();
            if (apps) {
                $scope.apps = [];
                // Processing is needed because $scope limitations
                // If we have all those icons the $scope crashes
                for (let a in apps) {
                    let u = apps[a];
                    $scope.apps.push({
                        name: u.name,
                        identifier: u.identifier,
                        largeIcon: u.largeIcon,
                    });
                }
            }

            $scope.$apply()
        }
    }
    init();
}])
.controller('frida_device_tabs', ['$scope', 'shared', '$location', function($scope, $shared, $location) {
    $scope.path = $location.path();

    $scope.switch = function (str) {
        $scope.section = str;
        $location.path($scope.path + '/' + str);
    };

    async function init(){
        $shared.debug('[*] {controller: "frida_device_tabs"}');
        $scope.switch('general');
        // await $scope.$parent.update();
    }
    init();
}])
.controller('frida_device_general_general', ['$scope', 'shared', function($scope, $shared) {
    $scope.loading = true;
    $scope.info = null;

    async function init(){
        $shared.debug('[*] {controller: "frida_device_app_general"}');
        await $scope.$parent.update();

        if ($shared.device && $shared.device.server){
            $scope.info = {
                frida: await $shared.device.frida.operations.misc.frida(),
                info: await $shared.device.frida.operations.misc.info()
            };
            $scope.loading = false;

            $scope.$apply();
        } else {
            console.log('[-] - No APP?')
        }
    }
    init();
}])
.controller('frida_device_general_files', ['$scope',  '$stateParams', 'shared', '$location', function($scope, $stateParams, $shared, $location) {
    $scope.menuOptions = [
        {
            text: 'Download',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                let file = $scope.path+'/'+$itemScope.file.fileName;
                await $scope.download(file)
            }
        },
        {
            text: 'Delete',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                let file = $scope.path+'/'+$itemScope.file.fileName;
                await $scope.delete(file)
            }
        }
    ];

    $scope.files = [];
    $scope.path = '';
    $scope.loading = true;

    $scope.splitPaneProperties = {};
    $scope.hide = function () {
        $scope.splitPaneProperties.lastComponentSize = 0;
    };
    $scope.show = function () {
        $scope.splitPaneProperties.lastComponentSize = 200;
    };

    async function init() {
        $shared.debug('[*] {controller: "frida_device_app_files"}');
        $scope.hide();
        // await $scope.$parent.update();
        await $scope.go_home();
    }

    $scope.ls = async function (path){
        console.log('Going to '+path);
        if ($shared.device && $shared.device.server) {
            $scope.loading = true;
            let files = await $shared.device.frida.operations.filesystem.ls(path);
            let afiles = [];
            for (let key in files.files){
                if (files.files.hasOwnProperty(key)){
                    afiles.push(files.files[key]);
                }
            }
            $scope.files = afiles;
            // console.log($scope.files);
            $scope.loading = false;
            $scope.$apply();
        }
    };
    $scope.refresh = async function () {
        $scope.ls($scope.path)
    };
    $scope.go_home = async function () {
        if ($shared.device && $shared.device.server){
            $scope.path = '/var/root';
            await $scope.refresh();
        }
    };
    $scope.up = async function(){
        if ($scope.path) {
            let split = $scope.path.split('/');
            split.pop();
            $scope.path = split.join('/');
        }
        await $scope.refresh();
    };
    $scope.double = async function(file) {
        console.log('[+] --- Double clicked: ' + file.fileName);
        if ($shared.device && $shared.device.server) {
            if (file.attributes.NSFileType === 'NSFileTypeDirectory'){
                $scope.path = $scope.path ? $scope.path+'/'+file.fileName : file.fileName;
                await $scope.refresh();
            } else {

            }
        }
    };
    $scope.mkdir = async function(){
        smalltalk.prompt('New folder', 'Plese insert a new folder name', 'New Folder')
            .then(async (value) => {
                console.log('Creating new folder :'+$scope.path+'/'+value);
                if ($shared.device && $shared.device.server)
                    await $shared.device.frida.operations.filesystem.mkdir(
                        $scope.path+'/'+value
                    );
                $scope.refresh();
            }).catch(() => {
        });

    };
    $scope.delete = async function(file){
        console.log('[+] - Deleting: '+file);
        await $shared.device.frida.operations.filesystem.delete(file);
        await $scope.refresh();
    };
    $scope.download = async function(path){
        let file = await dialog.showOpenDialog({
            title: 'Select where to save file',
            properties: ['openDirectory']
        });
        if (!path) path = $scope.path;

        if (file && path){
            console.log('Dowloading: ');
            console.log(' - from: ' + path);
            console.log(' - to:   ' + file.toString());

            await $shared.device.frida.operations.filesystem.download(path, file.toString())
        }
    };
    $scope.upload = async function(){
        let file = await dialog.showOpenDialog({
            title: 'Select a file to upload',
            properties: ['openFile', 'openDirectory']
        });

        if (file){
            if ($shared.device && $shared.device.server) {
                console.log('Uploading: ');
                console.log(' - from: ' + file.toString());
                console.log(' - to:   ' + $scope.path);
                await $shared.device.frida.operations.filesystem.upload(
                    file.toString(),
                    $scope.path
                );

                await $scope.refresh();
            }
        }
    };

    init();
}])
.controller('frida_device_app_general', ['$scope',  '$stateParams', 'shared', '$location', function($scope, $stateParams, $shared, $location) {
    // Some more AngularJS magic
    $scope.query = {query: ''};
    $scope.app = null;
    $scope.plist = null;
    let rawlist = null;
    $scope.loading = true;

    async function init(){
        $shared.debug('[*] {controller: "frida_device_app_general"}');
        await $scope.$parent.update();

        if ($shared.app && $shared.app.ready){
            let path = await $shared.app.operations.filesystem.path();
            let info = (await $shared.app.operations.misc.plist());
            let bin_info = (await $shared.app.operations.misc.flags());
            let flags = bin_info.flags;
            let entilements = bin_info.entilements;

            let schemas = [];
            if (info.hasOwnProperty('CFBundleURLTypes')) {
                for (let type of info.CFBundleURLTypes) {
                    for (let scheme of type.CFBundleURLSchemes) {
                        schemas.push(scheme + '://')
                    }
                }
            }

            $scope.app = {
                identifier: info.CFBundleIdentifier,
                version: info.CFBundleVersion,
                paths:{
                    bin: info.CFBundleExecutable,
                    bundle: path.bin,
                    data: path.data
                },
                protections: {
                    encrypted: flags.encrypted,
                    pie: flags.pie,
                    arc: flags.canary,
                    canary: flags.arc
                },
                schemas: schemas,
                keychain: {
                    groups: entilements['keychain-access-groups'],
                    team: entilements['com.apple.developer.team-identifier'],
                    app: entilements['application-identifier'],
                    task: entilements['get-task-allow']
                },
            };
            await $scope.$apply();
            // Some magic
            rawlist = JSON.parse(JSON.stringify(info));
            $scope.plist = rawlist;
            await $scope.$apply();
            $scope.loading = false;
            await $scope.$apply();
        } else {
            console.log('[-] - No APP?')
        }
    }
    init();

    $scope.$watch('query.query', function (newv, oldv) {
        function filter(item, reg) {
            function findNode(json, reg) {
                let type = typeof json;
                let ret = null;
                if (type === 'object') {
                    for (let key in json) {
                        let data = json[key];

                        if (key.toLowerCase().indexOf(reg) >= 0) {
                            if (!ret) ret = {};
                            ret[key] = data
                        } else {
                            let datatype = typeof data;
                            if (datatype === 'object') {
                                let sh = findNode(data, reg);
                                if (sh) {
                                    if (!ret) ret = {};
                                    ret[key] = sh
                                }
                            } else {
                                if (datatype === 'string' &&
                                    data.toLowerCase().indexOf(reg) >= 0) {
                                    if (ret) ret = {};
                                    ret[key] = data
                                }
                            }
                        }
                    }
                } else {
                    if (type === 'string' &&
                        json.toLowerCase().indexOf(reg) >= 0)
                        ret = json
                }
                return ret;
            }

            let ret;
            if (reg){
                console.log('Searching for: '+reg);
                ret = JSON.parse(JSON.stringify(findNode(item, reg.toLowerCase())));
            } else {
                ret = item;
            }

            return ret
        };
        if (newv) {
            // console.log('--> Searching: '+newv);
            $scope.plist = filter(rawlist, newv)
        } else {
            $scope.plist = rawlist
        }

    })
}])
.controller('frida_device_app_files', ['$scope',  '$stateParams', 'shared', '$location', function($scope, $stateParams, $shared, $location) {
    $scope.menuOptions = [
        {
            text: 'Download',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                console.log($scope.base + '/' + ($scope.path ? $scope.path + '/' : '')+$itemScope.file.fileName);
                await $scope.download($scope.base + '/' + ($scope.path ? $scope.path + '/' : '')+$itemScope.file.fileName)
            }
        },
        {
            text: 'Delete',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                await $scope.delete($scope.base+'/'+($scope.path ? $scope.path+'/' : '')+$itemScope.file.fileName)
            }
        }
    ];

    $scope.files = [];
    $scope.path = '';
    $scope.base = '';
    $scope.selected = '';
    $scope.loading = true;

    $scope.splitPaneProperties = {};
    $scope.hide = function () {
        $scope.splitPaneProperties.lastComponentSize = 0;
    };
    $scope.show = function () {
        $scope.splitPaneProperties.lastComponentSize = 200;
    };

    async function init() {
        $shared.debug('[*] {controller: "frida_device_app_files"}');
        $scope.hide();
        // await $scope.$parent.update();
        await $scope.go_data();
    }

    $scope.ls = async function (path){
        if ($shared.app && $shared.app.ready) {
            $scope.loading = true;
            let files = await $shared.app.operations.filesystem.ls(path);
            let afiles = [];
            for (let key in files.files){
                if (files.files.hasOwnProperty(key)){
                    afiles.push(files.files[key]);
                }
            }
            $scope.files = afiles;
            // console.log($scope.files);
            $scope.loading = false;
            $scope.$apply();
        }
    };
    $scope.refresh = async function () {
        if ($scope.path){
            await $scope.ls($scope.base+'/'+$scope.path)
        } else {
            await $scope.ls($scope.base)
        }
    };
    $scope.go_bin = async function () {
        if ($shared.app && $shared.app.ready){
            $scope.base = (await $shared.app.operations.filesystem.path()).bin;
            $scope.path = null;
            $scope.selected = 'bin';
            await $scope.refresh();
        }
    };
    $scope.go_data = async function () {
        if ($shared.app && $shared.app.ready){
            $scope.base = (await $shared.app.operations.filesystem.path()).data;
            $scope.path = null;
            $scope.selected = 'data';
            await $scope.refresh();
        }
    };
    $scope.up = async function(){
        if ($scope.path) {
            let split = $scope.path.split('/');
            split.pop();
            $scope.path = split.join('/');
        }
        await $scope.refresh();
    };
    $scope.double = async function(file) {
        console.log('[+] --- Double clicked: ' + file.fileName);
        if ($shared.app && $shared.app.ready) {
            if (file.attributes.NSFileType === 'NSFileTypeDirectory'){
                $scope.path = $scope.path ? $scope.path+'/'+file.fileName : file.fileName;
                await $scope.refresh();
            } else {

            }
        }
    };
    $scope.mkdir = async function(){
        smalltalk.prompt('New folder', 'Plese insert a new folder name', 'New Folder')
            .then(async (value) => {
                console.log('Creating new folder');
                console.log($scope.base+'/'+($scope.path ? $scope.path+'/' : '')+value);
                if ($shared.app && $shared.app.ready) await $shared.app.operations.filesystem.mkdir($scope.base+'/'+($scope.path ? $scope.path+'/' : '')+value);
                $scope.refresh();
            }).catch(() => {
            });

    };
    $scope.delete = async function(file){
        console.log('[+] - Deleting: '+file);
        await $shared.app.operations.filesystem.delete(file);
        await $scope.refresh();
    };
    $scope.download = async function(path){
        let file = await dialog.showOpenDialog({
            title: 'Select where to save file',
            properties: ['openDirectory']
        });
        if (!path) path = $scope.base + '/' + ($scope.path ? $scope.path + '/' : '');

        if (file && path){
            console.log('Dowloading: ');
            console.log(' - from: ' + path);
            console.log(' - to:   ' + file.toString());

            await $shared.app.operations.filesystem.download(path, file.toString())
        }
    };
    $scope.upload = async function(){
        let file = await dialog.showOpenDialog({
            title: 'Select a file to upload',
            properties: ['openFile', 'openDirectory']
        });

        if (file){
            if ($shared.app && $shared.app.ready) {
                console.log('Uploading: ');
                console.log(' - from: ' + file.toString());
                console.log(' - to:   ' + $scope.base + '/' + ($scope.path ? $scope.path + '/' : ''));

                await $shared.app.operations.filesystem.upload(
                    file.toString(),
                    $scope.base + '/' + ($scope.path ? $scope.path + '/' : '')
                );

                await $scope.refresh();
            }
        }
    };

    init();
}])
.controller('frida_device_app_agents', ['$scope', 'shared', function($scope, $shared) {
    $scope.query = '';
    $scope.agents = null;
    $scope.dialogs = [];

    //TODO: Delete
    $ang = $scope;

    $scope.output = '';
    function onmsg(req) {
        console.log('[*] {showing: '+req.payload+'}');
        $scope.output += req.payload+'\n';
        $scope.$apply();
    }

    $scope.splitPaneProperties = {};
    $scope.hide = function () {
        $scope.splitPaneProperties.lastComponentSize = 0;
    };
    $scope.show = function () {
        $scope.splitPaneProperties.lastComponentSize = 200;
    };
    $scope.new = async function () {
        window.open('#!/editor/'+btoa('new'))
    };
    $scope.edit = async function(name){
        console.log('[*] {editing: "'+name+'"}');
        if (true || ($scope.dialogs.filter(function(dialog){return dialog.name === name})).length<1) {
            let w = await window.open('#!/editor/' + btoa(name));

            // let w2 = new remote.BrowserWindow({
            //     width: 800,
            //     height: 600,
            //     parent: remote.getCurrentWindow(),
            //     icon: 'img/favicon.ico',
            // });
            // w2.loadURL('./app/index.html#!/editor/' + btoa(name));
            // w2.webContents.openDevTools();
            // console.log(w2);

            $scope.dialogs.push({name: name, window: w});
        } else {
            alert('Agent already opened')
        }
        // $scope.$apply();
    };
    
    $scope.$watchCollection('dialogs', function (nval, oval) {
        console.log('changed')
    }, true);

    $scope.delete = async function(name){
        if ($shared.app && $shared.app.ready){
            await $shared.app.operations.agents.del_agent(name);
            await $scope.refresh_agents();
        }
    };
    $scope.clear = async function(){
        $scope.output = '';
    };

    $scope.run = async function(name){
        console.log('[*] {running: "'+name+'"}');
        if ($shared.app && $shared.app.ready){
            $scope.show();
            $scope.clear();
            $shared.app.operations.agents.run_agent(name, onmsg);
        }
    };
    $scope.stop = async function(name){
        console.log('[*] {stopping: "'+name+'"}');
        if ($shared.app && $shared.app.ready){
            await $shared.app.operations.agents.stop_agent(name);
        }
    };
    $scope.open = async function(){
        let file = await dialog.showOpenDialog({
            title: 'Select a frida-agent script',
            filters: [
                {name: 'JavaScript', extensions: ['js']}
            ]
        });
        if (file) {
            if (file.length === 1) {
                // Read file
                // let content = fs.readFileSync(file[0], 'utf-8');
                await $shared.app.operations.agents.add_src(file[0]);
            } else {
                alert('Please select a script')
            }
        }
        await $scope.refresh_agents()
    };
    $scope.refresh_agents = async function(){
      if ($shared.app && $shared.app.ready){
          $scope.agents = await $shared.app.operations.agents.get_agents();
          // console.log($scope.agents);
          await $scope.$apply()
      }
    };

    async function init(){
        $shared.debug('[*] {controller: "frida_device_app_agents"}');
        if ($shared.app && $shared.app.ready){
            $scope.agents = [];
        }
        $scope.hide();
        await $scope.refresh_agents()
    }
    init();
}])
.controller('frida_device_app_classes', ['$scope', 'shared', function($scope, $shared) {
    $scope.query = {
        query: '',
        regex:'',
        more_regex: '',
        placeholder: 'Search for classes'
    };
    $scope.data = null;
    $scope.more = null;
    // Class or Modules
    $scope.selected = null;
    // Methods, Imports or exports
    $scope.more_selected = null;
    // Item getted
    $scope.getted = null;

    $scope.loading = true;

    $scope.splitPaneProperties = {};
    $scope.hide = function () {
        $scope.splitPaneProperties.lastComponentSize = 0;
    };
    $scope.show = function () {
        $scope.splitPaneProperties.lastComponentSize = 200;
    };

    $scope.search = async function(exp){
        $scope.query.query = '';
        $scope.query.regex = '';
        $scope.query.more_regex = '';

        if ($scope.getted){
            $scope.query.more_regex = exp;
            console.log('[+] {searching: '+exp+', in: '+$scope.more_selected+'}');
        } else {
            $scope.query.regex = exp;
            console.log('[+] {searching: '+exp+', in: '+$scope.selected+'}');
        }
    };

    $scope.get = async function(what){
        $scope.selected = what;
        $scope.query.placeholder = 'Search for '+what;

        console.log('[*] {getting: '+what+'}');
        if ($shared.app && $shared.app.ready) {
            if (what === 'modules') {
                $scope.data = await $shared.app.operations.hooking.list_modules();
            } else {
                $scope.data = await $shared.app.operations.hooking.list_classes();
            }

            // Resetting
            await $scope.search('');
            $scope.more_selected = null;
            $scope.more = null;

            await $scope.hide();
            await $scope.$apply();
        }
    };

    $scope.load_more = async function (what, other) {
        $scope.loading = true;
        if (other)
            $scope.more_selected = other;

        $scope.getted = what;
        await $scope.search('');

        $scope.query.placeholder = 'Searching for '+$scope.more_selected;
        if ($scope.selected === 'modules') {
            if ($scope.more_selected === 'imports'){
                $scope.more = await $shared.app.operations.hooking.list_imports(what);
            } else {
                $scope.more = await $shared.app.operations.hooking.list_exports(what);
            }
        } else {
            $scope.more = await $shared.app.operations.hooking.list_methods(what);
        }

        await $scope.show();
        $scope.loading = false;

        await $scope.$apply();
    };

    $scope.open = async function(what){
        console.log('[*] {getting more info about : '+what+'}');
        if ($shared.app && $shared.app.ready) {

            if ($scope.selected === 'modules') {
                $scope.more_selected = 'exports';
            } else {
                $scope.more_selected = 'methods';
            }
            await $scope.load_more(what);
        }
    };

    async function init(){
        $shared.debug('[*] {controller: "frida_device_app_classes"}');
        await $scope.get('classes');
        $scope.loading = false;
    }
    init();
}])
.controller('frida_device_app_memdump', ['$scope', 'shared', function($scope, $shared) {
    $scope.ranges = [];
    $scope.query = {query: '', found: 0};
    $scope.loading = true;
    $scope.mem = null;
    $scope.indexing = false;
    $scope.indexed = false;
    $scope.menuOptions = [
        {
            text: 'Save',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                let addr = '0x'+$itemScope.range.baseAddress.toString(16);
                $shared.debug('[+] - Saving: '+addr);
                $shared.debug(dumpdata[addr]);

                let path = await dialog.showOpenDialog({
                    title: 'Save memory dump',
                    properties: ['openDirectory']
                });

                if (path && path.length>0 && path[0] && $shared.app && $shared.app.ready){
                    let data = {};
                    data[$itemScope.range.baseAddress.toString(16)] = dumpdata[addr];
                    await $shared.app.save_mem(path[0],data);

                    shell.showItemInFolder(path[0]+'/')
                }
            }
        },
        {
            text: 'Inspect',
            click: async function ($itemScope, $event, modelValue, text, $li) {
                let addr = '0x'+$itemScope.range.baseAddress.toString(16);
                $shared.debug('[+] - Inspecting: '+addr);
                if (!$scope.loading) {
                    // $shared.debug(dumpdata[addr]);
                    $scope.mem = dumpdata[addr];
                    $scope.show();
                } else {
                    alert('Still loading')
                }
            }
        }
    ];
    $scope.splitPaneProperties = {};
    let dumpdata = null;
    let strdata = null;

    $scope.hide = function () {
        $scope.splitPaneProperties.lastComponentSize = 0;
    };
    $scope.show = function () {
        $scope.splitPaneProperties.lastComponentSize = 200;
    };

    async function init() {
        $shared.debug('[*] {controller: "frida_device_app_memdump"}');
        await $scope.refresh();
    }
    async function dump(ranges){
        ranges = ranges || $scope.ranges;
        if ($shared.app && $shared.app.ready){
            dumpdata = await $shared.app.operations.memory.dump(ranges);

            await $scope.index();
        }
    }

    $scope.index = async function(){
        $scope.indexing = true;
        $shared.debug('{state: "indexing"}');
        if (dumpdata){
            strdata = {};
            for (let d in dumpdata){
                strdata[d] = dumpdata[d].toString('utf-8')
            }
            for (let i of $scope.ranges){
                i['active'] = false;
            }
        }
        $scope.indexing = false;
        $scope.indexed = true;
    };

    $scope.refresh = async function () {
        $scope.loading = true;
        if ($shared.app && $shared.app.ready){
            $scope.ranges = await $shared.app.operations.memory.ranges();
            await dump();
            $scope.loading = false;
            $scope.$apply()
        }
    };

    $scope.save_zip = async function(){
        let path = await dialog.showOpenDialog({
            title: 'Save memory dump compressed as .zip',
            properties: ['openDirectory']
        });
        if (path && path.length>0 && path[0] && $shared.app && $shared.app.ready){
            console.log(path[0]);
            await $shared.app.save_mem_zip(path[0], await $shared.app.operations.memory.dump());
            shell.showItemInFolder(path[0]+'/')
        }
    };

    $scope.save = async function(){
        let path = await dialog.showOpenDialog({
            title: 'Save memory dump',
            properties: ['openDirectory']
        });
        if (path && path.length>0 && path[0] && $shared.app && $shared.app.ready){
            if (!ranges){
                console.log(path[0]);
                await $shared.app.save_mem(path[0], await $shared.app.operations.memory.dump());
                shell.showItemInFolder(path[0]+'/')
            }
        }
    };

    $scope.search = function(newval){
        if (!$scope.loading) {
            if ($scope.indexed) {
                console.log('{query: "' + newval + '"}');
                let reg = new RegExp('(' + newval + ')', 'gi');

                for (let i of $scope.ranges) {
                    i['active'] = false;
                }
                $scope.query.found = 0;

                for (let d in strdata) {
                    let r = (reg.test(strdata[d]));
                    if (r) {
                        let c = $scope.ranges.find(x => {
                            return ('0x' + x.baseAddress.toString(16)) === d
                        });
                        if (c) c['active'] = r;
                        $scope.query.found = (r) ? $scope.query.found + 1 : $scope.query.found;
                    }
                }

                $scope.mem = null;
            } else {
                alert('Data should be indexed before searching')
            }
        } else {
            alert('Please be patient, data is still loading')
        }
    };

    init();

}])
.controller('frida_device_app_uidump',  ['$scope', 'shared', function($scope, $shared) {

    $scope.uidump = [];
    $scope.modalpasteboard = false;
    $scope.modalalert = false;
    $scope.message = '';
    $scope.pasteboard = '';
    $scope.loading = true;
    $scope.image = null;
    $scope.query = '';

    async function init(){
        $scope.loading = true;
        $shared.debug('[*] {controller: "frida_device_app_uidump"}');
        await $scope.$parent.update();
        await $scope.reload();
    }

    $scope.reload = async function(){
        $scope.loading = true;
        if ($shared.app && $shared.app.ready){
            $scope.uidump = htmlEscape(await $shared.app.operations.ui.uidump()).split('\n');
            // $shared.debug($scope.uidump);
            $scope.$apply();

            await $scope.updatePasteboard();
        }
        $scope.loading = false;
        $scope.$apply();
    };

    $scope.toggleModal = async function (modal) {
        switch (modal){
            case 'Pasteboard':
                $scope.modalpasteboard = !$scope.modalpasteboard;
                await $scope.updatePasteboard();
                break;
            case 'Alert':
                $scope.modalalert = !$scope.modalalert;
                break
        }
    };

    $scope.updatePasteboard = async function(){
      if ($shared.app && $shared.app.ready){
          $scope.pasteboard = await $shared.app.operations.ui.pasteboard();
      }
    };

    $scope.setPasteboard = async function(msg) {
        if ($shared.app && $shared.app.ready) {
            console.log($scope.pasteboard);
            await $shared.app.operations.ui.pasteboard(msg);
            await $scope.updatePasteboard()
        }
    };

    $scope.alert = async function (mesage) {
        if ($shared.app && $shared.app.ready){
            $shared.app.operations.ui.alert(mesage);
            $scope.modalalert = false;
        }
    };

    $scope.screenshot = async function(){
        if ($shared.app && $shared.app.ready){
            let image = await $shared.app.operations.ui.screenshot();
            $scope.image = {
                raw: image,
                text: image.toString("utf-8"),
                base64: image.toString("base64")
            };
            console.log($scope.image);
            $scope.$apply()
        }
    };

    $scope.save_screenshot = async function(){
        // Get filename
        let file = await dialog.showSaveDialog({
                title: 'Save screenshot',
                filters: [
                    {name: 'PNG', extensions: ['png']}
                ]
            });
        // Actually save the file
        if (file){
            await fs.writeFileSync(file, $scope.image.base64, 'utf-8');
        } else {
            alert('Please introduce a valid filename')
        }
    };

    init();

}])

// Editor
.controller('editor', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.$parent.main.section = 'editor';

        // Monaco-editor object
        $scope.editor = null;

        function set_wrap(width) {
            return Math.floor(
                ((188/1440) * window.innerWidth) - 0.008*(1440-window.innerWidth)
            );
        }

        async function init() {
            await $scope.$parent.update();

            let file = null;
            if ($scope.$parent.main.file && $scope.$parent.main.file.path){
                file = $scope.$parent.main.file;
                console.log('[*] {"reading from parent": "'+file+'"}')
            } else {
                if ($stateParams.file){
                    file = atob($stateParams.file);
                    if (file !== 'new') {
                        console.log('[*] {"reading from URL": "'+file+'"}')
                    } else {
                        console.log('[*] {"new file"}')
                    }
                }
            }
            if (file){
                await init_editor('');
                await $scope.$parent.open_file(file)
            } else {
                await init_editor();
            }

            // // Weia
            // let w = remote.getCurrentWindow();
            // w.webContents.openDevTools();
            // console.log('Weia');
            // console.log(w);



            $(window).resize(function(){
                $scope.editor.layout();
                $scope.editor.updateOptions({
                    wrappingColumn: set_wrap(window.innerWidth)
                })
            });
        }

        /**
         * Init the monaco-editor with data as text
         * @param data
         */
        async function init_editor(data){
            if (!data){
                data =
`//Create a new script
module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {

        } else if (Java.available) {
            Java.perform(function () {

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};
`
            }
            // Load editor
            let loader = require('monaco-loader');
            let monaco = await loader();
            $scope.editor = monaco.editor.create(
                document.getElementById('container'), {
                    language: 'javascript',
                    // theme: 'vs-dark',
                    // automaticLayout: true,
                    value: data,
                    wrappingColumn: set_wrap(window.innerWidth)
                });
            // If data is changed then save button is blue
            $scope.editor.addListener('contentChanged', () => {
                $scope.$parent.main.file.changed =
                    !($scope.$parent.main.file.md5 === md5($scope.editor.getValue()));
                $scope.$parent.$apply()
            });
        }
        init();

        $scope.$parent.open_file = async function (file){
            if (!file)
                file = await dialog.showOpenDialog({
                    title: 'Select a frida-agents script',
                    filters: [
                        {name: 'JavaScript', extensions: ['js']}
                    ]
                });
            else
                file = [file];

            if (file) {
                if (file.length === 1) {
                    // Read file
                    let content = fs.readFileSync(file[0], 'utf-8');
                    $scope.editor.setValue(content);
                    $scope.$parent.main.file = {
                        path: file[0],
                        md5: md5(content),
                        changed: false
                    };
                    $scope.$parent.$apply();
                } else {
                    alert('Please select a script')
                }
            }
        };
        $scope.$parent.save_file = async function () {
            // Get filename
            let file = $scope.$parent.main.file.path;
            if (!file){
                file = await dialog.showSaveDialog({
                    title: 'Save frida-agents script',
                    filters: [
                        {name: 'JavaScript', extensions: ['js']}
                    ]
                })
            }
            // Actually save the file
            if (file){
                let content = $scope.editor.getValue();
                await fs.writeFileSync(file, content, 'utf-8');
                // Update content and md5
                $scope.editor.setValue(content);
                $scope.$parent.main.file.changed = false;
                $scope.$parent.main.file.md5 = md5(content);
                $scope.$parent.$apply();
            } else {
                alert('Please introduce a valid filename')
            }
        };
        $scope.$parent.close_win = function(){
            let w = remote.getCurrentWindow();
            w.close();
        }
}]);