module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Deletes all of the keychain items available to the current application.

            var NSMutableDictionary = ObjC.classes.NSMutableDictionary;
            var SecItemDelete = new NativeFunction(
                ptr(Module.findExportByName('Security', 'SecItemDelete')), 'pointer', ['pointer']);

            // the base query dictionary to use for the keychain lookups
            var search_dictionary = NSMutableDictionary.alloc().init();

            // constants
            var kSecClass = 'class',
                kSecClassKey = 'keys',
                kSecClassIdentity = 'idnt',
                kSecClassCertificate = 'cert',
                kSecClassGenericPassword = 'genp',
                kSecClassInternetPassword = 'inet';

            // keychain item times to query for
            var item_classes = [
                kSecClassKey,
                kSecClassIdentity,
                kSecClassCertificate,
                kSecClassGenericPassword,
                kSecClassInternetPassword
            ];

            for (var item_class_index in item_classes) {

                var item_class = item_classes[item_class_index];

                // set the class-type we are querying for now
                search_dictionary.setObject_forKey_(item_class, kSecClass);

                // delete the classes items.
                SecItemDelete(search_dictionary);
            }

            resolve('ok');

        } else if (Java.available) {
            Java.perform(function () {
                // Delete all entries in the Android Keystore
                //
                // Ref: https://developer.android.com/reference/java/security/KeyStore.html#deleteEntry(java.lang.String)

                var KeyStore = Java.use('java.security.KeyStore');

                // Prepare the AndroidKeyStore keystore provider and load it.
                // Maybe at a later stage we should support adding other stores
                // like from file or JKS.
                var ks = KeyStore.getInstance('AndroidKeyStore');
                ks.load(null, null);

                // Get the aliases and loop through them. The aliases() method
                // return an Enumeration<String> type.
                var aliases = ks.aliases();

                while (aliases.hasMoreElements()) {

                    ks.deleteEntry(aliases.nextElement());
                }

                resolve('ok');

                // - Sample Java
                //
                // KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                // ks.load(null);
                // Enumeration<String> aliases = ks.aliases();
                //
                // while(aliases.hasMoreElements()) {
                //     ks.deleteEntry(aliases.nextElement());
                // }

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};