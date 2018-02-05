module.exports = function(){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            // Watches for invocations of a specific Objective-C method.

            var resolver = new ApiResolver('objc');
            var argument_count = parseInt('{{ argument_count }}');
            var dump_args = ('{{ dump_args }}'.toLowerCase() === 'true')
            var dump_return = ('{{ dump_return }}'.toLowerCase() === 'true')
            var dump_backtrace = ('{{ dump_backtrace }}'.toLowerCase() === 'true')

            var method = {};

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
                    type: 'watch-class-method',
                    data: 'Found address for: {{ selector }} at ' + method.address
                });

                Interceptor.attach(method.address, {
                    onEnter: function (args) {

                        var receiver = new ObjC.Object(args[0]);
                        var message = '[' + receiver.$className + ' ' + ObjC.selectorAsString(args[1]) +
                            '] (Kind: ' + receiver.$kind + ') (Super: ' + receiver.$superClass + ')';

                        // if we should include a backtrace to here, do that.
                        if (dump_backtrace) {

                            message = message + '\nBacktrace:\n\t' +
                                Thread.backtrace(this.context, Backtracer.ACCURATE)
                                    .map(DebugSymbol.fromAddress).join('\n\t')
                        }

                        send({
                            status: 'success',
                            error_reason: NaN,
                            type: 'watch-class-method',
                            data: 'Called: ' + message
                        });

                        if (dump_args) {

                            if (argument_count > 0) {

                                var split_method = ObjC.selectorAsString(args[1]).split(':');

                                // As this is an ObjectiveC method, the arguments are as follows:
                                // 0. 'self'
                                // 1. The selector (object.name:)
                                // 2. The first arg
                                //
                                // For this reason do we adjust it by 2 positions
                                for (var i = 0; i < argument_count; i++) {

                                    var obj = ObjC.Object(args[i + 2]);
                                    var selector = split_method[i];

                                    selector = selector + ':"' + obj.toString() + '"';
                                    split_method[i] = selector;
                                }

                                send({
                                    status: 'success',
                                    error_reason: NaN,
                                    type: 'watch-class-method',
                                    data: 'Argument dump: [' + receiver.$className + ' ' + split_method.join(' ') + ']'
                                });
                            }
                        }
                    },

                    onLeave: function (retval) {

                        if (dump_return) {

                            send({
                                status: 'success',
                                error_reason: NaN,
                                type: 'watch-class-method',
                                data: 'Retval: ' + retval.toString()
                            });
                        }
                    }
                });

            } else {

                send({
                    status: 'error',
                    error_reason: 'Unable to find address for {{ selector }}. Is the selector valid?',
                    type: 'watch-class-method',
                    data: NaN
                });
            }
        } else if (Java.available) {
            Java.perform(function () {
// Watches a Java class method and reports on invocations.
// All of the matching overloads of the method in question
// is also watched.

                var Throwable = Java.use('java.lang.Throwable');
                var target_class = Java.use('{{ target_class }}');

                var target_method = '{{ target_method }}';
                var overload_count = target_class[target_method].overloads.length;
                var dump_args = ('{{ dump_args }}'.toLowerCase() === 'true');
                var dump_return = ('{{ dump_return }}'.toLowerCase() === 'true');
                var dump_backtrace = ('{{ dump_backtrace }}'.toLowerCase() === 'true');

                send({
                    status: 'success',
                    error_reason: NaN,
                    type: 'watch-class-method',
                    data: 'Found class with ' + overload_count + ' overloads for ' + target_method
                });

// Hook all of the overloads found for this class.method
                for (var i = 0; i < overload_count; i++) {

                    send({
                        status: 'success',
                        error_reason: NaN,
                        type: 'watch-class-method',
                        data: 'Hooking overload: ' + (i + 1)
                    });

                    // Hook the overload.
                    target_class[target_method].overloads[i].implementation = function () {

                        var message = 'Called ' + target_class + '.' + target_method + ' (args: ' + arguments.length + ')';

                        // if we should include a backtrace to here, do that.
                        if (dump_backtrace) {

                            message += '\nBacktrace:\n\t' + Throwable.$new().getStackTrace()

                                .map(function (stack_trace_element) {

                                    return stack_trace_element.toString() + '\n\t';
                                }).join('');
                        }

                        send({
                            status: 'success',
                            error_reason: NaN,
                            type: 'watch-class-method',
                            data: message
                        });

                        if (dump_args) {

                            // Loop the arguments and dump the values.toString()
                            for (var h = 0; h < arguments.length; h++) {

                                send({
                                    status: 'success',
                                    error_reason: NaN,
                                    type: 'watch-class-method',
                                    data: target_method + ' - Arg ' + h + ': ' + (arguments[h] || '(none)').toString()
                                });
                            }
                        }

                        // continue with the original method and capture the return value
                        var return_value = this[target_method].apply(this, arguments);

                        if (dump_return) {

                            send({
                                status: 'success',
                                error_reason: NaN,
                                type: 'watch-class-method',
                                data: target_method + ' - Returned : ' + (return_value || '(none)').toString()
                            });
                        }

                        // finally, return
                        return return_value;
                    }
                }

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};