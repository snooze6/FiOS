module.exports = function(cmd){
    return new Promise(function (resolve, reject) {
        if (ObjC.available) {
            reject(new Error('Not yet implemented'));

        } else if (Java.available) {
            Java.perform(function () {

                // Execute shell commands on an Android device

                const Process = Java.use('java.lang.Process');
                const Runtime = Java.use('java.lang.Runtime');
                const InputStreamReader = Java.use('java.io.InputStreamReader');
                const BufferedReader = Java.use('java.io.BufferedReader');
                const StringBuilder = Java.use('java.lang.StringBuilder');

                // Run the command
                command = Runtime.getRuntime().exec(cmd);

                // Read 'stderr'
                stderr_input_stream_reader = InputStreamReader.$new(command.getErrorStream());
                buffered_reader = BufferedReader.$new(stderr_input_stream_reader);

                stderr_string_builder = StringBuilder.$new();
                line_buffer = '';

                while ((line_buffer = buffered_reader.readLine()) != null) {
                    stderr_string_builder.append(line_buffer + '\n');
                }

                // Read 'stdout'
                stdout_input_stream_reader = InputStreamReader.$new(command.getInputStream());
                buffered_reader = BufferedReader.$new(stdout_input_stream_reader);

                stdout_string_builder = StringBuilder.$new();
                line_buffer = '';

                while ((line_buffer = buffered_reader.readLine()) != null) {
                    stdout_string_builder.append(line_buffer + '\n');
                }

                var stde = stderr_string_builder.toString();
                var stdo = stdout_string_builder.toString();

                if (stdo){
                    resolve(stdo, stde)
                } else {
                    reject(stde, stdo)
                }

                // -- Sample Java
                //
                // Process command = Runtime.getRuntime().exec("ls -l /");
                // InputStreamReader isr = new InputStreamReader(command.getInputStream());
                // BufferedReader br = new BufferedReader(isr);
                //
                // StringBuilder sb = new StringBuilder();
                // String line = "";
                //
                // while ((line = br.readLine()) != null) {
                //     sb.append(line + "\n");
                // }
                //
                // String output = sb.toString();
            })
        } else {
            reject(new Error('Language not supported'))
        }

    });
};