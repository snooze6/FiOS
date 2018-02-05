# FiOS

<center><img src=img/icons/icon-white.png></center>

<br>

This manual will show how to execute the application, the usage of its main features and how to setup a development environment in order to expand its features. It will be divided in the following sections:

1. Requirements
2. Usage
3. Development
4. Troubleshooting and feature request
5. License

<div class="page-break"></div>

### 9.1.1 - Requirements

In order to execute this tool, the only requirement is to have a computer running either linux, osx or windows, although in order to use its features it is required to have an iOS device running Frida.

There are two ways of running Frida on a device: As a dydl or as frida-server. When loading Frida as a dydl not all features are available so for the purpose of this document we will use an iOS device with frida-server running listening to localhost.

The installation of frida-server requires the iDevice to be jailbroken; this is a risky operation that won't be covered in this manual but more information can be obtained in [https://canijailbreak.com/](https://canijailbreak.com/).

For the purpose of installing Frida, a new source must be added to either sources.list or in the Cydia application:

```
https://build.frida.re
```

Once the source is added and after a repository refresh, the frida-server package should be available to install by using Cydia or "apt-get install".

After the installation it is possible to check that the frida-server is running by SSHing to the iDevice.

<center><img src=img/manual_01.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 1</b>: frida-server running on the device.
  </span>
</center>

More information about the process of installing Frida on iOS is available in the official documentation ([https://www.frida.re/docs/ios/](https://www.frida.re/docs/ios/))

<div class="page-break"></div>

### 9.1.2 - Usage

Simply double-click on the application executable and it should start the GUI. Local devices are shown as they are planned to be supported on the future.

<center><img src=img/gui_01.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 2</b>: First view.
  </span>
</center>

The tool must be able to detect connected devices; plug and play works as expected and it shows a green notification when the device is connected and a red one when it's disconnected.

If frida-server is listening on the network interface, it is possible to add the device as a remote device and attach to it wirelessly knowing the ip address and the port in which frida-server is listening. This is not recommended because of security reasons as frida-server doesn't implement any security restrictions.

After selecting one device, the tool will show basic information about the device:

<center><img src=img/gui_03.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 3</b>: Device overview
  </span>
</center>

The files tab makes the user able to easily manage the iDevice filesystem, allowing to upload, download or delete any file.

On the left bar installed applications are listed; by clicking in one of them, the tool will get attached to that process showing basic information of the application.

<center><img src=img/gui_05.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 4</b>: Basic information from a given application.
  </span>
</center>

The view is adjustable by sliding the separator allowing the user to see more clearly the Info.plist contents which are parsed on the right panel. Both the application search and the Info.plist search are in real time as it is a fast search.

In the agents view the user can examine JavaScript files that contain the agents, in order to run it.

Those agents can be deleted, executed, stopped and edited with the integrated editor. The results of the executed agents are shown on the bottom panel which can be resized.

<center><img src=img/gui_07.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 4</b>: Agent execution.
  </span>
</center>

The basic anatomy of an agent is simple:

```JavaScript
rpc.exports = {
    run: function(){
        return new Promise(function (resolve, reject) {
            if (ObjC.available) {
                send('ObjC');
                // Do stuff on iOS
            } else if (Java.available) {
                Java.perform(function () {
                    send('Java');
                    // Do stuff on Android
                })
            } else {
                reject(new Error('Language not supported'))
            }
        });
    }
};
```

It should export a function called run that returns a Promise. Inside that function the user is allowed to write any JavaScript code, but the interesting part is accessing the application classes, methods and objects. This can be achieved by using ObjC and Java objects.

__ObjC__ is an object available on iDevices whereas __Java__ is available on Android devices, at this time the only platform that is compatible to all the agents is iOS so the following instruction are iOS specific.

__send__ function is used to log information instead the usual console.log because the agent is executed on the process context on the iDevice and it needs to return the information to the tool.

In order to override the behavior of one method in the application, the agent must Intercept it using the Interceptor object as shown:

```JavaScript
// Hook schema
Interceptor.attach(ObjC.classes.UIApplication['- canOpenURL:'].implementation,{
    onEnter: function(args){
        // Use a marker to check onExit if we need to manipulate the response.
        this.cydia = false;
        // Extract the url
        this.url = ObjC.Object(args[2]).toString();
        // check if the url is cydia://
        if (this.url.indexOf('cydia://') >= 0) {
            // Mark this path as one that should have its response modified if needed.
            this.cydia = true;
        }
    }, onLeave: function (retval) {
        // check if the method call matched a common_path. If that's the case, respond with a failure instead if needed.
        if (this.cydia) {
            if (retval != 0x0) {
                send('[+] --- URL: '+this.url);
                retval.replace(0x0);
            }
        }
    }
})
```

This code will return 0 (false) if the application checks for the "cydia://" schema by overriding the "- canOpenURL:" method of the UIApplication class. Notice the two functions on the second argument of the Interceptor attach method: __onEnter__ is called before the method is executed and __onLeave__ after the execution of the method.

The __onEnter__ arguments are first the method itself and then the parameters with which the program was called. __onLeave__ receives the returned value.

More information about the available functions is found in the Frida's official documentation ([https://www.frida.re/docs/javascript-api/#objc](https://www.frida.re/docs/javascript-api/#objc))

The classes/exports view shows each class and each exported method in a friendly way. It is useful in order to find important methods that can be hooked using agents.

<center><img src=img/gui_09.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 6</b>: Exported modules with its functions.
  </span>
</center>

The search field doesn't search in real-time because depending on the number of classes/exports it can take a long time; the search starts when pressing the intro key finishing the query.

In the memory view an user is able to see the contents of the application memory. The memory dump can take up to a minute depending on the size of the memory. Once the dump is finished the memory is automatically converted to strings and indexed; during this operation the CPU of the computer will experience a hard use.

<center><img src=img/gui_10.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 7</b>: Memory view.
  </span>
</center>

The memory view shows the different ranges of memory in the application with its permissions and contents; that memory can be saved into a .zip file to further inspection. If a determined range is interesting is possible to show or save it by right-clicking on the desired range.

The last view is the ui-view in which the ui-contents are shown:

<center><img src=img/gui_11.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 8</b>: Memory view.
  </span>
</center>

This view shows the contents of the ui including hidden elements which can hide interesting information. It allows to control the iDevice pasteboard and show an alert on the iDevice.

<div class="page-break"></div>

### 9.1.3 - Development

The project uses npm to manage its dependencies so it is mandatory to install NodeJS and npm in order to improve the tool, any version is supported as the ".npmrc" specifies the correct electron version to use.

In order to make the process of setting up a development environment easier, a makefile is available with a small preset of targets.

* __clean__: It removes all dependencies, compiled agents and generated files.
* __clean-agents__: It removes all compiled agents.
* __dist__: It generates a release of the tool.
* __frida-compile__: It compiles the agents.
* __frida-compile-watch__: It recompiles the agent every time a file is changed.
* __install-dependencies__: Must be executed at first and its main purpose is to install the dependencies of the tool using npm and bower.
* __run-gui__: It executes the gui.
* __run-test__: It executes the test-file.
* __update__: It updates the installed dependencies to its latest version. __CAUTION: THIS CAN BE DANGEROUS.__

<center><img src=img/dev_04.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 10</b>: Methods of the makefile
  </span>
</center>

To easily develop new features it is a good idea to configure a JavaScript IDE in order to automatize all the repetitive tasks that need to be made in each execution of the program.

The recommended IDE is WebStorm by JetBrains but every other IDE with NodeJS support can be used.

<center><img src=img/dev_03.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 11</b>: Opening the project in WebStorm
  </span>
</center>

After opening the project in the IDE it should be recognized as a NodeJS project and a run-configuration can be added.

<center><img src=img/dev_02.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 12</b>: Setting up the main run task
  </span>
</center>

The important arguments are:

* __Node interpreter__: Should be the electron binary that is inside node_modules after installing the dependencies.
* __Working dir__: The directory where are located the source files.
* __JavaScript file__: The file that we want to execute. "main.js" for the GUI and "test.js" for the tests
* __Tasks before launch__: In order to re-compile the agents on each execution, a new task can be configured doing "npm run compile"

<center><img src=img/dev_05.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 13</b>: Npm run compile
  </span>
</center>

In accordance with the usual rules of procedure on other open-source projects, for publishing the new features or bugfixes a pull-request should be made to [https://github.com/snooze6/FiOS](https://github.com/snooze6/FiOS)

<div class="page-break"></div>

### 9.1.4 - Troubleshooting and feature request

If a bug is found in the tool, a issue can be filled in GitHub so it can be fixed.

<center><img src=img/manual_02.png></center>
<center>
  <span style="font-size: 0.8em;">
  <b>Figure 9</b>: Issues support on GitHub.
  </span>
</center>

New ideas or features are also welcomed.

<div class="page-break"></div>

## 9.1.5 - License

Copyright 2018 Armando Nogueira Rio (@snooze6)

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

</div>
