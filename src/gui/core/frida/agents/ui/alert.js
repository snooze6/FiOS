module.exports = function(msg, timeout){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // ref: https://www.frida.re/docs/examples/ios/

            // Import ObjC classes
            var UIAlertController = ObjC.classes.UIAlertController;
            var UIAlertAction = ObjC.classes.UIAlertAction;
            var UIApplication = ObjC.classes.UIApplication;
            var pressed = false;

            // Defining a Block that will be passed as handler parameter
            // to +[UIAlertAction actionWithTitle:style:handler:]
            var handler = new ObjC.Block({
                retType: 'void',
                argTypes: ['object'],
                implementation: function () {
                    pressed = true;
                    resolve('ok')
                }
            });

            // Using Grand Central Dispatch to pass messages (invoke methods) in application's main thread
            ObjC.schedule(ObjC.mainQueue, function () {
                // Using integer numerals for preferredStyle which is of type enum UIAlertControllerStyle
                var alert = UIAlertController.alertControllerWithTitle_message_preferredStyle_(
                    msg, '', 1);

                // Again using integer numeral for style parameter that is enum
                var ok_button = UIAlertAction.actionWithTitle_style_handler_('OK', 0, handler);
                alert.addAction_(ok_button);

                // Instead of using `ObjC.choose()` and looking for UIViewController instances
                // on the heap, we have direct access through UIApplication:
                UIApplication
                    .sharedApplication()
                    .keyWindow()
                    .rootViewController()
                    .presentViewController_animated_completion_(alert, true, NULL);
            });

            function end() {
                if (!pressed)
                    resolve('timeout');
            }
            if (timeout) {
                setTimeout(end, timeout)
            }

        } else if (Java.available) {
            Java.perform(function () {

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};