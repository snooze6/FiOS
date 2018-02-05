// Writes arbitrary bytes to a memory address.

module.exports = function(content, addr){
    return new Promise(function (resolve, reject) {
        Memory.writeByteArray(ptr(addr), content);
        resolve({status: 'ok'})
    });
};


