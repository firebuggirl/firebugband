"use strict";

var gulp = require('gulp'),
    concat = require('gulp-concat');


gulp.task("concatScripts", function() {
   return gulp.src([
        'js/modernizr.js',
        'js/jquery-2.2.0.min.js',
        'js/main.js',
        'js/preload.js',
        'js/burger.js',
        'js/radiobutton.js',
        'js/popup.js',
        'js/scroll.js',
        'js/slide.js'
         ])
    .pipe(concat("app.js"))
    .pipe(gulp.dest("js"))
});


gulp.task("default", ["hello"], function(){
    console.log('The default task!');
});
