var _ = require('lodash');
var exec = require('child_process').exec;
var gutil = require('gulp-util');
var path = require('path');
var PluginError = gutil.PluginError;
var through = require('through2');
var usedLodashMethods = {};

var PLUGIN_NAME = 'gulp-lodash-custom';

function isLodashMethod(methodName) {
    return typeof _[methodName] === 'function';
};


module.exports = function (options) {
    var defaults = {
        forceMethods: [],
        ignoreMethods: [],
        target: 'lodash-custom.min.js'
    };

    if (!options.lodashCli) {
        var lodashBin = require('lodash-cli/package.json').bin.lodash;
        defaults.lodashCli = require.resolve('lodash-cli/' + lodashBin);
    }

    var settings = _.defaults(options, defaults);
    var lodashRegEx = new RegExp(/_\.\w*\s*\(/g);

    if (settings && settings.forceMethods) {
        settings.forceMethods.forEach(function (method) {
            if (isLodashMethod(method)) {
                usedLodashMethods[method] = 1;
            }
        });
    }

    return through.obj(function (file, encoding, callback) {
        if (!file.isBuffer()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Only Buffers are supported!'));
            return callback();
        } else {
            var content = file.contents.toString();
            var matches;

            do {
                matches = lodashRegEx.exec(content);

                if (matches && matches.length === 2) {
                    var method = matches[1];

                    if (settings.ignoreMethods.indexOf(method) === -1 && isLodashMethod(method)) {
                        usedLodashMethods[method] = 1;
                    }
                }

            } while(matches)

            this.push(file);

            callback();
        }
    }, function (callback) {
        var methods = _.keys(usedLodashMethods).join(',');
        var command = 'node ' + settings.lodashCli + ' include=' + methods + ' -p -o ' + settings.target;
        var execLodashCli = exec(command);

        gutil.log('starting lodash csutom build with following methods: ' + methods);

        execLodashCli.stderr.on('data', function (error) {
            callback(error);
            return;
        });

        execLodashCli.stdout.on('end', function () {
            callback();
            return;
        });
    })
};
