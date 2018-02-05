module.exports = function(tls_helper, quiet){
    return new Promise(function (resolve, reject) {
        resolve = send;

        if (ObjC.available) {

            /* SSLContextRef SSLCreateContext ( CFAllocatorRef alloc, SSLProtocolSide protocolSide, SSLConnectionType connectionType );*/
            var SSLCreateContext = new NativeFunction(
                Module.findExportByName("Security", "SSLCreateContext"),
                'pointer',
                ['pointer', 'int', 'int']
            );

            /* OSStatus SSLHandshake ( SSLContextRef context ); */
            var SSLHandshake = new NativeFunction(
                Module.findExportByName("Security", "SSLHandshake"),
                'int',
                ['pointer']
            );

            /* OSStatus SSLSetSessionOption ( SSLContextRef context, SSLSessionOption option, Boolean value );*/
            var SSLSetSessionOption= new NativeFunction(
                Module.findExportByName("Security", "SSLSetSessionOption"),
                'int',
                ['pointer', 'int', 'bool']
            );

            var errSSLServerAuthCompvared = -9481;
            var kSSLSessionOptionBreakOnServerAuth = 0;
            var noErr = 0;

            console.log('agent: ssl killer running!');

            Interceptor.replace(SSLHandshake, new NativeCallback(function (context) {
                var result = SSLHandshake(context);
                if (result === errSSLServerAuthCompvared) {
                    console.log('SSLHandshake override: ', result);
                    return SSLHandshake(context);
                } else {
                    //console.log('SSLHandshake(): ', result);
                    return result;
                }
            }, 'int', ['pointer']));

            Interceptor.replace(SSLCreateContext, new NativeCallback(function (alloc, protocolSide, connectionType) {
                    console.log('SSLCreateContext: set break on server auth');
                    var sslContext = SSLCreateContext(alloc, protocolSide, connectionType);
                    SSLSetSessionOption(sslContext, kSSLSessionOptionBreakOnServerAuth, 1);
                    return sslContext;
                }, 'pointer', ['pointer', 'int', 'int'])
            );

            Interceptor.replace(SSLSetSessionOption, new NativeCallback(function (context, option, value) {
                    if (option === kSSLSessionOptionBreakOnServerAuth) {
                        console.log('SSLSetSessionOption: override', option, '=>', value, ' ignored');
                        return noErr;
                    }
                    return SSLSetSessionOption(context, option, value);
                }, 'int', ['pointer', 'int', 'bool'])
            );

            {
                // // This hook attempts many ways to kill SSL pinning and certificate
                // // validations. The first sections search for common libraries and
                // // class methods used in many examples online to demonstrate how
                // // to pin SSL certificates.
                //
                // // As far as libraries and classes go, this hook searches for:
                // //
                // //  - AFNetworking.
                // //      AFNetworking has a very easy pinning feature that can be disabled
                // //      by setting the 'PinningMode' to 'None'.
                // //
                // //  - NSURLSession.
                // //      NSURLSession makes use of a delegate method with the signature
                // //      'URLSession:didReceiveChallenge:completionHandler:' that allows
                // //      developers to extract the server presented certificate and make
                // //      decisions to complete the request or cancel it. The hook for this
                // //      Class searches for the selector and replaces it one that will
                // //      continue regardless of the logic in this method, and apply the
                // //      original block as a callback, with a successful return.
                // //
                // //  - NSURLConnection.
                // //      While an old method, works similar to NSURLSession, except there is
                // //      no completionHandler block, so just the successful challenge is returned.
                //
                // // The more 'lower level' stuff is basically a reimplementation of the commonly
                // // known 'SSL-Killswitch2'[1], which hooks and replaces lower level certificate validation
                // // methods with ones that will always pass. An important note should be made on the
                // // implementation changes from iOS9 to iOS10 as detailed here[2]. This hook also tries
                // // to implement those for iOS10.
                // //  [1] https://github.com/nabla-c0d3/ssl-kill-switch2/blob/master/SSLKillSwitch/SSLKillSwitch.m
                // //  [2] https://nabla-c0d3.github.io/blog/2017/02/05/ios10-ssl-kill-switch/
                //
                // // Many apps implement the SSL pinning in interesting ways, if this hook fails, all
                // // is not lost yet. Sometimes, there is a method that just checks some configuration
                // // item somewhere, and returns a BOOL, indicating whether pinning is applicable or
                // // not. So, hunt that method and hook it :)
                //
                // console.log('weia');
                //
                // // Some base handles
                // var resolver = new ApiResolver('objc');
                // var NSURLCredential = ObjC.classes.NSURLCredential;
                // var ignore_ios10_tls_helper = (!!tls_helper);
                // var quiet_output = (!!quiet);
                //
                // // Helper method to honor the quiet flag.
                // function quiet_send(data) {
                //     if (quiet_output)
                //         return;
                //     else
                //         resolve(data)
                // }
                //
                // // Process the Frameworks and Classes First
                //
                // // AFNetworking
                // if (ObjC.classes.AFHTTPSessionManager && ObjC.classes.AFSecurityPolicy) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: 'Found AFNetworking library'
                //     });
                //
                //     // -[AFSecurityPolicy setSSLPinningMode:]
                //     var AFSecurityPolicy_setSSLPinningMode = {};
                //     resolver.enumerateMatches('-[AFSecurityPolicy setSSLPinningMode:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_setSSLPinningMode.name = match.name;
                //             AFSecurityPolicy_setSSLPinningMode.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_setSSLPinningMode.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy setSSLPinningMode:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_setSSLPinningMode.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for setSSLPinningMode: ' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // -[AFSecurityPolicy setAllowInvalidCertificates:]
                //     var AFSecurityPolicy_setAllowInvalidCertificates = {};
                //     resolver.enumerateMatches('-[AFSecurityPolicy setAllowInvalidCertificates:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_setAllowInvalidCertificates.name = match.name;
                //             AFSecurityPolicy_setAllowInvalidCertificates.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_setAllowInvalidCertificates.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy setAllowInvalidCertificates:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_setAllowInvalidCertificates.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x1) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for setAllowInvalidCertificates:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x1;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // +[AFSecurityPolicy policyWithPinningMode:]
                //     var AFSecurityPolicy_policyWithPinningMode = {};
                //     resolver.enumerateMatches('+[AFSecurityPolicy policyWithPinningMode:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_policyWithPinningMode.name = match.name;
                //             AFSecurityPolicy_policyWithPinningMode.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_policyWithPinningMode.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy policyWithPinningMode:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_policyWithPinningMode.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for policyWithPinningMode:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                //
                //     // +[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]
                //     var AFSecurityPolicy_policyWithPinningModewithPinnedCertificates = {};
                //     resolver.enumerateMatches('+[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]', {
                //         onMatch: function (match) {
                //             AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.name = match.name;
                //             AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address = match.address;
                //         },
                //         onComplete: function () {
                //         }
                //     });
                //
                //     if (AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address) {
                //
                //         resolve({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: 'Found +[AFSecurityPolicy policyWithPinningMode:withPinnedCertificates:]'
                //         });
                //
                //         Interceptor.attach(AFSecurityPolicy_policyWithPinningModewithPinnedCertificates.address, {
                //             onEnter: function (args) {
                //
                //                 // typedef NS_ENUM(NSUInteger, AFSSLPinningMode) {
                //                 //     AFSSLPinningModeNone,
                //                 //     AFSSLPinningModePublicKey,
                //                 //     AFSSLPinningModeCertificate,
                //                 // };
                //
                //                 if (args[2] != 0x0) {
                //
                //                     quiet_send({
                //                         status: 'success',
                //                         error_reason: NaN,
                //                         type: 'ios-ssl-pinning-bypass',
                //                         data: '[AFNetworking] setting AFSSLPinningModeNone for policyWithPinningMode:withPinnedCertificates:' +
                //                         ' (was: ' + args[2] + ')'
                //                     });
                //
                //                     args[2] = 0x0;
                //                 }
                //             }
                //         });
                //     }
                // }
                //
                // // NSURLSession
                // var search = resolver.enumerateMatchesSync('-[* URLSession:didReceiveChallenge:completionHandler:]');
                //
                // if (search.length > 0) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[NSURLSession] Found ' + search.length + ' matches for URLSession:didReceiveChallenge:completionHandler:'
                //     });
                //
                //     for (var i = 0; i < search.length; i++) {
                //
                //         Interceptor.attach(search[i].address, {
                //             onEnter: function (args) {
                //
                //                 // 0
                //                 // 1
                //                 // 2 URLSession
                //                 // 3 didReceiveChallenge
                //                 // 4 completionHandler
                //
                //                 // get handlers on some arguments
                //                 var receiver = new ObjC.Object(args[0]);
                //                 var selector = ObjC.selectorAsString(args[1]);
                //                 var challenge = new ObjC.Object(args[3]);
                //
                //                 quiet_send({
                //                     status: 'success',
                //                     error_reason: NaN,
                //                     type: 'ios-ssl-pinning-bypass',
                //                     data: '[NSURLSession] Got call to -[' + receiver + ' ' + selector + ']. Ensuring pinning passes.'
                //                 });
                //
                //                 // get the original completion handler, and save it
                //                 var completion_handler = new ObjC.Block(args[4]);
                //                 var saved_completion_handler = completion_handler.implementation;
                //
                //                 // ignore everything the original method wanted to do,
                //                 // and prepare the successful arguments for the original
                //                 // completion handler
                //                 completion_handler.implementation = function () {
                //
                //                     // Example handler source
                //
                //                     // SecTrustRef serverTrust = challenge.protectionSpace.serverTrust;
                //                     // SecCertificateRef certificate = SecTrustGetCertificateAtIndex(serverTrust, 0);
                //                     // NSData *remoteCertificateData = CFBridgingRelease(SecCertificateCopyData(certificate));
                //                     // NSString *cerPath = [[NSBundle mainBundle] pathForResource:@"swapi.co" ofType:@"der"];
                //                     // NSData *localCertData = [NSData dataWithContentsOfFile:cerPath];
                //
                //                     // if ([remoteCertificateData isEqualToData:localCertData]) {
                //
                //                     //     NSURLCredential *credential = [NSURLCredential credentialForTrust:serverTrust];
                //                     //     [[challenge sender] useCredential:credential forAuthenticationChallenge:challenge];
                //                     //     completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
                //
                //                     // } else {
                //
                //                     //     [[challenge sender] cancelAuthenticationChallenge:challenge];
                //                     //     completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
                //                     // }
                //
                //                     var credential = NSURLCredential.credentialForTrust_(challenge.protectionSpace().serverTrust());
                //                     challenge.sender().useCredential_forAuthenticationChallenge_(credential, challenge);
                //
                //                     // typedef NS_ENUM(NSInteger, NSURLSessionAuthChallengeDisposition) {
                //                     //     NSURLSessionAuthChallengeUseCredential = 0,
                //                     //     NSURLSessionAuthChallengePerformDefaultHandling = 1,
                //                     //     NSURLSessionAuthChallengeCancelAuthenticationChallenge = 2,
                //                     //     NSURLSessionAuthChallengeRejectProtectionSpace = 3,
                //                     // } NS_ENUM_AVAILABLE(NSURLSESSION_AVAILABLE, 7_0);
                //                     saved_completion_handler(0, credential);
                //                 }
                //             }
                //         });
                //     }
                // }
                //
                // // NSURLConnection
                // var search = resolver.enumerateMatchesSync('-[* connection:willSendRequestForAuthenticationChallenge:]');
                //
                // if (search.length > 0) {
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[NSURLConnection] Found ' + search.length + ' matches for connection:willSendRequestForAuthenticationChallenge:'
                //     });
                //
                //     for (var i = 0; i < search.length; i++) {
                //
                //         Interceptor.replace(search[i].address, new NativeCallback(function (a, b, connection, challenge) {
                //
                //             //TODO: Make sure we run the following method here too:
                //             // [[challenge sender] useCredential:credential forAuthenticationChallenge:challenge];
                //
                //         }, 'void', ['pointer', 'pointer', 'pointer', 'pointer']));
                //     }
                // }
                //
                // // Process the lower level methods, just like SSL-Killswitch2
                // //  https://github.com/nabla-c0d3/ssl-kill-switch2/blob/master/SSLKillSwitch/SSLKillSwitch.m
                // //
                // // iOS9 and below
                //
                // // Some constants
                // var errSSLServerAuthCompared = -9481;
                // var kSSLSessionOptionBreakOnServerAuth = 0;
                // var noErr = 0;
                // var errSecSuccess = 0;
                //
                // // SSLSetSessionOption
                // send({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLSetSessionOption'
                // });
                //
                // var SSLSetSessionOption = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLSetSessionOption'),
                //     'int', ['pointer', 'int', 'bool']);
                //
                // Interceptor.replace(SSLSetSessionOption, new NativeCallback(function (context, option, value) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SSLSetSessionOption] Called'
                //     });
                //
                //     if (option === kSSLSessionOptionBreakOnServerAuth) {
                //
                //         return noErr;
                //     }
                //
                //     return SSLSetSessionOption(context, option, value);
                // }, 'int', ['pointer', 'int', 'bool']));
                //
                // // SSLCreateContext
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLCreateContext'
                // });
                //
                // var SSLCreateContext = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLCreateContext'),
                //     'pointer', ['pointer', 'int', 'int']);
                //
                // Interceptor.replace(SSLCreateContext, new NativeCallback(function (alloc, protocolSide, connectionType) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SSLCreateContext] Called'
                //     });
                //
                //     var sslContext = SSLCreateContext(alloc, protocolSide, connectionType);
                //     SSLSetSessionOption(sslContext, kSSLSessionOptionBreakOnServerAuth, 1);
                //
                //     return sslContext;
                //
                // }, 'pointer', ['pointer', 'int', 'int']));
                //
                // // SSLHandshake
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SSLHandshake'
                // });
                //
                // var SSLHandshake = new NativeFunction(
                //     Module.findExportByName('Security', 'SSLHandshake'),
                //     'int', ['pointer']);
                //
                // Interceptor.replace(SSLHandshake, new NativeCallback(function (context) {
                //
                //     var result = SSLHandshake(context);
                //
                //     if (result == errSSLServerAuthCompared) {
                //
                //         quiet_send({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: '[SSLHandshake] Calling SSLHandshake() again, skipping cert validation.'
                //         });
                //
                //         return SSLHandshake(context);
                //
                //     } else {
                //
                //         return result;
                //     }
                // }, 'int', ['pointer']));
                //
                // // SecTrustEvaluate
                // // Refs:
                // //  https://github.com/vtky/Swizzler2/blob/159a5eaf64bc56d92f823b028fd1c11b71324e90/SSLKillSwitch.js#L92
                // resolve({
                //     status: 'success',
                //     error_reason: NaN,
                //     type: 'ios-ssl-pinning-bypass',
                //     data: 'Hooking lower level method: SecTrustEvaluate'
                // });
                //
                // var SecTrustEvaluate = new NativeFunction(
                //     Module.findExportByName('Security', 'SecTrustEvaluate'),
                //     'int', ['pointer', 'pointer']
                // );
                //
                // Interceptor.replace(SecTrustEvaluate, new NativeCallback(function (trust, result) {
                //
                //     quiet_send({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: '[SecTrustEvaluate] Called SecTrustEvaluate()'
                //     });
                //
                //     return errSecSuccess;
                //
                // }, 'int', ['pointer', 'pointer']));
                //
                // // iOS 10
                //
                // // tls_helper_create_peer_trust
                // var tls_helper_create_peer_trust_export = Module.findExportByName('libcoretls_cfhelpers.dylib',
                //     'tls_helper_create_peer_trust');
                //
                // // In the case of devices older than iOS 10, this export
                // // would not have been found.
                // if (tls_helper_create_peer_trust_export && !ignore_ios10_tls_helper) {
                //
                //     // TODO: This method broke SSL connections as per: https://github.com/sensepost/objection/issues/35
                //     // Figure out why!
                //     //  ref: https://opensource.apple.com/source/coreTLS/coreTLS-121.31.1/coretls_cfhelpers/tls_helpers.c
                //
                //     resolve({
                //         status: 'success',
                //         error_reason: NaN,
                //         type: 'ios-ssl-pinning-bypass',
                //         data: 'Hooking lower level method: tls_helper_create_peer_trust'
                //     });
                //
                //     var tls_helper_create_peer_trust = new NativeFunction(tls_helper_create_peer_trust_export,
                //         'int', ['void', 'bool', 'pointer']);
                //
                //     Interceptor.replace(tls_helper_create_peer_trust, new NativeCallback(function (hdsk, server, SecTrustRef) {
                //
                //         quiet_send({
                //             status: 'success',
                //             error_reason: NaN,
                //             type: 'ios-ssl-pinning-bypass',
                //             data: '[tls_helper_create_peer_trust] Called'
                //         });
                //
                //         return noErr;
                //
                //     }, 'int', ['void', 'bool', 'pointer']));
                // }
            }
        } else if (Java.available) {
            Java.perform(function () {
                // Attempts to bypass SSL pinning implementations in a number of
                // ways. These include implementing a new TrustManager that will
                // accept any SSL certificate, overriding OkHTTP v3 check()
                // method etc.

                const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
                const SSLContext = Java.use('javax.net.ssl.SSLContext');

                // Helper method to honor the quiet flag.
                function quiet_send(data) {
                    if (quiet) {
                        return;
                    }
                    send(data)
                }

                // Implement a new TrustManager
                // ref: https://gist.github.com/oleavr/3ca67a173ff7d207c6b8c3b0ca65a9d8
                var TrustManager = Java.registerClass({
                    name: 'com.sensepost.test.TrustManager',
                    implements: [X509TrustManager],
                    methods: {
                        checkClientTrusted: function (chain, authType) {
                        },
                        checkServerTrusted: function (chain, authType) {
                        },
                        getAcceptedIssuers: function () {
                            return [];
                        }
                    }
                });

                // Prepare the TrustManagers array to pass to SSLContext.init()
                var TrustManagers = [TrustManager.$new()];

                send({
                    status: 'success',
                    error_reason: NaN,
                    type: 'android-ssl-pinning-bypass',
                    data: 'Custom, Empty TrustManager ready'
                });

                // Get a handle on the init() on the SSLContext class
                var SSLContext_init = SSLContext.init.overload(
                    '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');

                // Override the init method, specifying our new TrustManager
                SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {

                    quiet_send({
                        status: 'success',
                        error_reason: NaN,
                        type: 'android-ssl-pinning-bypass',
                        data: 'Overriding SSLContext.init() with the custom TrustManager'
                    });

                    SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
                };

                // OkHTTP v3.x

                // Wrap the logic in a try/catch as not all applications will have
                // okhttp as part of the app.
                try {

                    var CertificatePinner = Java.use('okhttp3.CertificatePinner');

                    send({
                        status: 'success',
                        error_reason: NaN,
                        type: 'android-ssl-pinning-bypass',
                        data: 'OkHTTP 3.x Found'
                    });

                    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function () {

                        quiet_send({
                            status: 'success',
                            error_reason: NaN,
                            type: 'android-ssl-pinning-bypass',
                            data: 'OkHTTP 3.x check() called. Not throwing an exception.'
                        });
                    }

                } catch (err) {

                    // If we dont have a ClassNotFoundException exception, raise the
                    // problem encountered.
                    if (err.message.indexOf('ClassNotFoundException') === 0) {

                        throw new Error(err);
                    }
                }

                // Appcelerator Titanium PinningTrustManager

                // Wrap the logic in a try/catch as not all applications will have
                // appcelerator as part of the app.
                try {

                    var PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');

                    send({
                        status: 'success',
                        error_reason: NaN,
                        type: 'android-ssl-pinning-bypass',
                        data: 'Appcelerator Titanium Found'
                    });

                    PinningTrustManager.checkServerTrusted.implementation = function () {

                        quiet_send({
                            status: 'success',
                            error_reason: NaN,
                            type: 'android-ssl-pinning-bypass',
                            data: 'Appcelerator checkServerTrusted() called. Not throwing an exception.'
                        });
                    }

                } catch (err) {

                    // If we dont have a ClassNotFoundException exception, raise the
                    // problem encountered.
                    if (err.message.indexOf('ClassNotFoundException') === 0) {

                        throw new Error(err);
                    }
                }

                // -- Sample Java
                //
                // "Generic" TrustManager Example
                //
                // TrustManager[] trustAllCerts = new TrustManager[] {
                //     new X509TrustManager() {
                //         public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                //             return null;
                //         }
                //         public void checkClientTrusted(X509Certificate[] certs, String authType) {  }

                //         public void checkServerTrusted(X509Certificate[] certs, String authType) {  }

                //     }
                // };

                // SSLContext sslcontect = SSLContext.getInstance("TLS");
                // sslcontect.init(null, trustAllCerts, null);

                // OkHTTP 3 Pinning Example
                // String hostname = "swapi.co";
                // CertificatePinner certificatePinner = new CertificatePinner.Builder()
                //         .add(hostname, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                //         .build();

                // OkHttpClient client = new OkHttpClient.Builder()
                //         .certificatePinner(certificatePinner)
                //         .build();

                // Request request = new Request.Builder()
                //         .url("https://swapi.co/api/people/1")
                //         .build();

                // Response response = client.newCall(request).execute();

            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};