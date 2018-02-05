module.exports = function(){
    // TODO: Simulate this
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            reject(new Error('Not implemented'))
        } else if (Java.available) {
            Java.perform(function () {
                reject(new Error('Not implemented'))
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};