clean: clean-agents
	rm -rf src/gui/node_modules
	rm -rf src/gui/app/bower_components

clean-agents:
	rm -rf src/gui/core/frida/agents.js

install-dependencies:
	cd src/gui && npm install
	cd src/gui/app && ../node_modules/.bin/bower install

update: clean clean-agents install-dependencies frida-compile

frida-compile: clean-agents
	cd src/gui && node_modules/.bin/frida-compile core/frida/agents -o core/frida/agents.js

frida-compile-watch: clean-agents
	cd src/gui && node_modules/.bin/frida-compile core/frida/agents -o core/frida/agents.js -w

run-gui:
	./src/gui/node_modules/.bin/electron ./src/gui/main.js

run-test:
	./src/gui/node_modules/.bin/electron ./src/gui/test.js

dist:
	mkdir -p out

	./src/gui/node_modules/.bin/electron-packager src/gui FiOS --platform=win32 --arch=x64 --out out
	#.\src\gui\node_modules\.bin\electron-packager.cmd src\gui FiOS --platform=win32 --arch=x64 --out out
	./src/gui/node_modules/.bin/electron-packager src/gui FiOS --platform=darwin --arch=x64 --out out
	#.\src\gui\node_modules\.bin\electron-packager src\gui FiOS --platform=darwin --arch=x64 --out out
	./src/gui/node_modules/.bin/electron-packager src/gui FiOS --platform=linux --arch=x64 --out out
	#.\src\gui\node_modules\.bin\electron-packager src\gui FiOS --platform=linux --arch=x64 --out out
