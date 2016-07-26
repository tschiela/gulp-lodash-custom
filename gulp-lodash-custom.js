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
        target: 'lodash-custom.min.js'
    };

    if (!options.lodashCli) {
        var lodashBin = require('lodash-cli/package.json').bin.lodash;
        defaults.lodashCli = require.resolve('lodash-cli/' + lodashBin);
    }

    var settings = _.extend({}, defaults, options);
    var lodashRegEx = new RegExp(/_\.(\w*)\(/g);

    if (settings && settings.forceMethods) {
        settings.forceMethods.forEach(function (method) {
            if (isLodashMethod(method)) {
                usedLodashMethods[method] = 1;
            }
        });
    }

    return through.obj(function (file, encoding, callback) {
        if (file.isBuffer()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Buffers not supported!'));
            return callback();
        } else if (!file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Only Streams are supported!'));
            return callback();
        } else {
            var content = file.contents.toString();
            var matches = lodashRegEx.exec(content);

            if (matches && matches.length === 2) {
                var method = matches[1];

                if (isLodashMethod(method)) {
                    usedLodashMethods[method] = 1;
                }
            }

            this.push(file);

            callback();
        }
    }, function (callback) {
        var methods = _.keys(usedLodashMethods).join(',');
        var command = 'node ' + settings.lodashCli + ' include=' + methods + ' -p -o ' + settings.target;
        var execLodashCli = exec(command);

        gutil.log('starting lodash csutom build with following methods: ' + methods);

        execLodashCli.stdout.on('data', function (data) {
            gutil.log(data);
        });

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