var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var shell = require('gulp-shell');
var batmanTemplates = require("gulp-batman-templates");


gulp.task('default', ['server'], function(){
  gulp.watch(['./**/*.coffee', './**/*.html'], ["build", "build_html", "finalize"])
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
  gulp.src(["./build/app.js", "./build/templates.js"])
    .pipe(concat("application.js"))
    .pipe(gulp.dest("./"))
});

gulp.task("build_html", function(){
  var stream = gulp.src(["./html/**/*.html"])
    .pipe(batmanTemplates())
    .pipe(concat('templates.js'))
    .pipe(gulp.dest("./build/"))
  return stream
})

// gulp.task("cjsx", shell.task(["cjsx -cbw -o build/ cjsx/"]))

// HARPJS DEVELOPMENT SERVER
var nodePath = require("path")
var harp = require("harp")
var pkgv = require("./node_modules/harp/package.json").version
var HARP_PORT = 9000

var startHarp = function(port){
  var path = nodePath.resolve(process.cwd())
  harp.server(path, {port: port}, function(){
    console.log(" Harp v" + pkgv + " running on http://localhost:" + port)
  })
}

gulp.task("server", function(){
  startHarp(HARP_PORT)
  true
})
