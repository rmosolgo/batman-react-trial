var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var jade = require('gulp-jade');
var batmanTemplates = require("gulp-batman-templates")

gulp.task('default', function(){
  gulp.watch('./**/*', ["build", "html", "finalize"])
});

var appSources = ["./coffee/*.coffee"]

gulp.task("build", function(){
  gulp.src(appSources)
    .pipe(concat('application.coffee'))
    .pipe(coffee())
    .pipe(concat('app.js'))
    .pipe(gulp.dest("./build/"))

  gulp.src(appSources)
    .pipe(concat('./application.coffee'))
    .pipe(gulp.dest("./"))

})

gulp.task("html", function(){
  gulp.src(["./html/**/*.jade"])
    .pipe(jade())
    .pipe(batmanTemplates())
    .pipe(concat('templates.js'))
    .pipe(gulp.dest("./build/"))
})

gulp.task("finalize", function() {
  gulp.src(["./build/app.js", "./build/templates.js"])
    .pipe(concat("application.js"))
    .pipe(gulp.dest("./"))
});