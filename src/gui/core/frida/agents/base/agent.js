rpc.exports = {
    run: function(){
        return new Promise(function (resolve, reject) {

            if (ObjC.available) {
                console.log('Weia')
            } else if (Java.available) {
                Java.perform(function () {
                    console.log('Weia')
                })
            } else {
                reject(new Error('Language not supported'))
            }

        });
    }
};
