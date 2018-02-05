module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Attempts to find a method, and set its return value.

            var resolver = new ApiResolver('objc');
            var method = {};
            var return_values = {
                'True': 0x1,
                'False': 0x0
            };

            resolver.enumerateMatches('{{ selector }}', {
                onMatch: function (match) {
                    method.name = match.name;
                    method.address = match.address;
                },
                onComplete: function () { }
            });

            if (method.address) {

                send({
                    status: 'success',
                    error_reason: NaN,
                    type: 'set-return-value',
                    data: 'Found address for: {{ selector }} at ' + method.address
                });

                Interceptor.attach(method.address, {
                    onLeave: function (retval) {

                        if (retval != return_values['{{ retval }}']) {

                            send({
                                status: 'success',
                                error_reason: NaN,
                                type: 'set-return-value',
                                data: 'Return value was not {{ retval }}, making it so.'
                            });

                            retval.replace(return_values['{{ retval }}']);
                        }
                    }
                });

            } else {

                send({
                    status: 'error',
                    error_reason: 'Unable to find address for {{ selector }}. Is the selector valid?',
                    type: 'set-return-value',
                    data: NaN
                });
            }

        } else if (Java.available) {
            Java.perform(function () {
                // Attempts to find a method, and set its return value.

                var target_class = Java.use('{{ class_name }}');

                send({
                    status: 'success',
                    error_reason: NaN,
                    type: 'set-return-value',
                    data: 'Found instance of: {{ class_name }}. Hooking {{ method_name }}...'
                });

                eval('target_class.{{ method_name }}').implementation = function () {

                    send({
                        status: 'success',
                        error_reason: NaN,
                        type: 'set-return-value',
                        data: 'Response to {{ class_name }}.{{ method_name }} set to {{ retval }}'
                    });

                    return '{{ retval }}' == 'True' ? true : false
                };

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};