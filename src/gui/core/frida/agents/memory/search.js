// Searches for a byte pattern in the current process memory.

module.exports = function(exp){
    return new Promise(function (resolve, reject) {

        var ranges = Process.enumerateRangesSync({
            protection: 'rw-', coalesce: true
        });

        var match_addresses = [];

        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            var matches = Memory.scanSync(range.base, range.size, exp);

            if (matches.length > 0) {
                for (var r = 0; r < matches.length; r++) {
                    match_addresses.push(matches[r].address.toString());
                }
            }
        }

        resolve(match_addresses)

    });
};


