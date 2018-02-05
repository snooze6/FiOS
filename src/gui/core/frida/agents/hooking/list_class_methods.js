module.exports = function(clas, include){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Lists the methods available in an Objective-C class.
            // Based on the value of the include_parents Jinja template
            // variable, the return will either be the classes *own*
            // methods, or all of the methods including the parents'.

            var methods = [];

            if (include) {
                methods = ObjC.classes[clas].$methods;
                // console.log('caca: '+ObjC.classes[clas]['scheme_jailbreak:']())
                // methods = Object.keys(ObjC.classes[clas])
                // console.log(ObjC.classes[clas].$ivars);
                // console.log(ObjC.classes[clas].$protocols);
            } else {
                methods = ObjC.classes[clas].$ownMethods
            }

            resolve(methods)

        } else if (Java.available) {
            Java.perform(function () {
                // Gets the declared methods for a Java class.

                var class_name = Java.use(clas);
                var methods = class_name.class.getDeclaredMethods().map(function(method) {
                    return  method.toGenericString();
                });

                resolve(methods)
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};