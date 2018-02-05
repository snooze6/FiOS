async function main () {
    console.log('<  Info >');
    console.log('  Node version: '+process.version);
    console.log('  ABI version:  '+process.versions.modules);
    console.log('  Arch:         '+process.arch);
    console.log('  Platform:     '+process.platform);
    console.log('< /Info >');
}

// this is the main module
main().then(() => {console.log('Finished succesfully'); process.exit(0)}, (error) => {console.error(error.stack); process.exit(-1)})