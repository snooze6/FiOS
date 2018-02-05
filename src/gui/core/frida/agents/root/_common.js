// Contains common paths used in both the root
// disable and simulation hooks. These paths are included
// using the //jinja: directive

var common_paths_android = [
    '/data/local/bin/su',
    '/data/local/su',
    '/data/local/xbin/su',
    '/dev/com.koushikdutta.superuser.daemon/',
    '/sbin/su',
    '/system/app/Superuser.apk',
    '/system/bin/failsafe/su',
    '/system/bin/su',
    '/system/etc/init.d/99SuperSUDaemon',
    '/system/sd/xbin/su',
    '/system/xbin/busybox',
    '/system/xbin/daemonsu',
    '/system/xbin/su',
    '/sbin/launch_daemonsu.sh',
    '/system/xbin/supolicy',
    '/system/lib/libsupol.so',
    '/system/lib(64)/libsupol.so',
    '/system/app/SuperSU/SuperSU.apk',
    '/su/bin/su',
    '/su/bin/daemonsu',
    '/su/bin/supolicy_wrapped',
    '/su/bin/supolicy',
    '/su/bin/sush',
    '/su/bin/app_process',
    '/su/bin/libsupol.so',
    '/data/SuperSU.apk',
    '/cache/SuperSU.apk',
    '/su/bin/sukernel',
];

var common_packages_android = [
    'de.robv.android.xposed.installer',
    'eu.chainfire.supersu',
    'stericson.busybox',
    'stericson.busybox.donate',
    'com.koushikdutta.superuser',
    'com.koushikdutta.rommanager',
    'com.koushikdutta.rommanager.license',
    'com.jmz.soft.twrpmanager',
    'me.twrp.twrpapp',
    'com.dimonvideo.luckypatcher',
    'com.chelpus.lackypatch',
    'com.topjohnwu.magisk',
];

var common_paths_ios = [
    '/Applications/Cydia.app',
    '/Applications/FakeCarrier.app',
    '/Applications/Icy.app',
    '/Applications/IntelliScreen.app',
    '/Applications/MxTube.app',
    '/Applications/RockApp.app',
    '/Applications/SBSetttings.app',
    '/Applications/WinterBoard.app',
    '/Applications/blackra1n.app',

    '/bin/bash',
    '/bin/sh',

    '/etc/apt',
    '/etc/ssh/sshd_config',

    '/Library/MobileSubstrate/DynamicLibraries/Veency.plist',
    '/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',

    '/private/var/stash',
    '/private/var/tmp/cydia.log',
    '/private/var/lib/apt',
    '/private/var/lib/cydia',
    '/private/var/mobile/Library/SBSettings/Themes',

    '/System/Library/LaunchDaemons/com.ikey.bbot.plist',
    '/System/Library/LaunchDaemons/com.saurik.Cy@dia.Startup.plist',

    '/usr/bin/cycript',
    '/usr/bin/ssh',
    '/usr/bin/sshd',
    '/usr/libexec/sftp-server',
    '/usr/libexec/ssh-keysign',
    '/usr/sbin/sshd',

    '/var/cache/apt',
    '/var/lib/apt',
    '/var/lib/cydia',
    '/var/log/syslog',
    '/var/tmp/cydia.log',
];

module.exports = {
    common_paths_android: common_paths_android,
    common_packages_android: common_packages_android,
    common_paths_ios: common_paths_ios
};
