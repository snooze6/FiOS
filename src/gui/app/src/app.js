let app = angular.module('fios',
    ['ui.router',
     'ngMaterial',
     'ui.bootstrap.contextMenu',
     'udb.controllers',
     'udb.directives',
     'udb.filters',
     'ui-notification',
     'shagstrom.angular-split-pane',
     'jsonFormatter',
     'hljs'
    ]);

const electron = require('electron');
    const remote = electron.remote;
    const shell = electron.shell;
    const dialog = remote.dialog;
    const fs = remote.require('fs');
    const md5 = remote.require('md5');

const friman = remote.require('./core/frida/frida.js').manager;

app.service('shared', function () {
    let manager = null;
    let app = null;
    let device = null;
    function debug(msg){
        if (true){
            console.log(msg)
        }
    }
    // TODO: warn and error
    return {
        manager: manager,
        device: device,
        app: app,
        debug: debug
    }
});

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('frida', {
            url: '/frida',
            templateUrl: 'src/views/frida.html',
            controller: 'frida',
        })
            .state('device', {
                url: '/frida/{id}',
                templateUrl: 'src/views/frida_device.html',
                controller: 'frida_device'
            })
                .state('device.general', {
                    url: '/general',
                    templateUrl: 'src/views/device/general/general.html',
                    controller: 'frida_device_tabs'
                })
                    .state('device.general.general', {
                        url: '/general',
                        templateUrl: 'src/views/device/general/dev/general.html',
                        controller: 'frida_device_general_general',
                    })
                        .state('device.general.general.whatever', {
                            url: '/{whatever}',
                            redirectTo: 'device.general.general',
                        })
                    .state('device.general.files', {
                        url: '/files',
                        templateUrl: 'src/views/device/general/dev/files.html',
                        controller: 'frida_device_general_files',
                    })
                        .state('device.general.files.whatever', {
                            url: '/{whatever}',
                            redirectTo: 'device.general.files',
                        })
                .state('device.app', {
                    url: '/{app}',
                    templateUrl: 'src/views/device/general/app.html',
                    controller: 'frida_device_tabs'
                })
                    .state('device.app.general', {
                        url: '/general',
                        templateUrl: 'src/views/device/general/app/general.html',
                        controller: 'frida_device_app_general',
                        
                    })
                    .state('device.app.files', {
                        url: '/files',
                        templateUrl: 'src/views/device/general/app/files.html',
                        controller: 'frida_device_app_files',
                    })
                    .state('device.app.agents', {
                        url: '/agents',
                        templateUrl: 'src/views/device/general/app/agents.html',
                        controller: 'frida_device_app_agents',
                        
                    })
                    .state('device.app.classes', {
                        url: '/classes',
                        templateUrl: 'src/views/device/general/app/classes.html',
                        controller: 'frida_device_app_classes',
                        
                    })
                    .state('device.app.memdump', {
                        url: '/memdump',
                        templateUrl: 'src/views/device/general/app/memdump.html',
                        controller: 'frida_device_app_memdump',
                        
                    })
                    .state('device.app.uidump', {
                        url: '/uidump',
                        templateUrl: 'src/views/device/general/app/uidump.html',
                        controller: 'frida_device_app_uidump',
                        
                    })
        .state('editor', {
            url: '/editor/{file}',
            templateUrl: 'src/views/editor.html',
            controller: 'editor'
        });
        $urlRouterProvider.otherwise('/frida');
        // $urlRouterProvider.otherwise('/editor');
}]);

app.config(function(NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 2000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
    });
});

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function htmlUnescape(str){
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}
