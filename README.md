# gulp-lodash-custom
gulp tasks that search for used lodash methods in codebase to do a custom build of lodash

## Install

```shell
$ npm install gulp-lodash-custom --save-dev
```

## Usage

```javascript
var concat = require('gulp-concat');
var customLodash = require('gulp-lodash-custom');
var path = require('path');
var runSequence = require('run-sequence');

var config = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist')
};

gulp.task('lodash-custom', function () {
    return gulp.src(path.join(config.src, 'js', '**', '*.js'))
        .pipe(customLodash({target: path.join(config.src, 'tmp', 'lodash-custom.js')}));
});

gulp.task('concatApp', function () {
    return gulp.src(config.src, 'js', '**', '*.js')
        .pipe(concat('app.js'))
        .pipe(gulp.dest(config.dist));
});

// because of asynchronous tasks in gulp we need to make the concat taks wait for the lodash custom build task
gulp.task('build', function (callback) {
    runSequence('lodash-custom', 'concatApp', callback);
});
```

## Options
### forceMethods
* `Array`
* force to include lodash methods, event if they are not found in the code base
* Default: `[]`

### ignoreMethods
* `Array`
* exclude methods of build
* Default: `[]`

### target
* `String`
* filepath of generated lodash custom build
* Default: `lodash-custom.min.js`

## TODO
* Testing