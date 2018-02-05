module.exports = function(base, size){
    return new Promise(function (resolve, reject) {

        var buf = Memory.readByteArray(ptr(base.toString(16)), size);
        // console.log(buf);
        resolve(buf)
    });
};