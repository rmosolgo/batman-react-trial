var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var shell = require('gulp-shell');

gulp.task('default', ['server'], function(){
  gulp.watch('./**/*', ["build", "finalize"])
});

var appSources = ["./coffee/bindings/*.coffee","./coffee/react/*.coffee", "./coffee/*.coffee"]

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

gulp.task("finalize", function() {
  gulp.src(["./build/app.js"])
    .pipe(concat("application.js"))
    .pipe(gulp.dest("./"))
});

// gulp.task("cjsx", shell.task(["cjsx -cbw -o build/ cjsx/"]))

gulp.task("server", function(){
  gulp.src("")
    .pipe(shell(["harp server"]))
  return true
})
