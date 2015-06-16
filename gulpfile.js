//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpSequence, shell, sourceMaps;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp            = require('gulp');
gutil           = require('gulp-util');
concat          = require('gulp-concat');
uglify          = require('gulp-uglify');
sass            = require('gulp-sass');
sourceMaps      = require('gulp-sourcemaps');
imagemin        = require('gulp-imagemin');
minifyCSS       = require('gulp-minify-css');
browserSync     = require('browser-sync');
autoprefixer    = require('gulp-autoprefixer');
gulpSequence    = require('gulp-sequence').use(gulp);
shell           = require('gulp-shell');

gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: "app/"
        },
        options: {
            reloadDelay: 250
        },
        notify: false
    });
});


//compressing images & handle SVG files
gulp.task('images', function(tmp) {
    gulp.src(['app/assets/img/*.jpg', 'app/assets/img/*.png'])
        .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest('app/assets/img'));
});

//compressing images & handle SVG files
gulp.task('images-deploy', function() {
    gulp.src(['app/assets/img/**/*', '!app/assets/img/README'])
        .pipe(gulp.dest('dist/images'));
});

//compiling our Javascripts
gulp.task('scripts', function() {
    //this is where our dev JS scripts are
    return gulp.src(['app/assets/js/src/_includes/**/*.js', 'app/assets/js/src/**/*.js'])
                //this is the filename of the compressed version of our JS
               .pipe(concat('app.js'))
               //catch errors
               .on('error', gutil.log)
               //compress :D
               .pipe(uglify())
               //where we will store our finalized, compressed script
               .pipe(gulp.dest('app/assets/js'))
               //notify browserSync to refresh
               .pipe(browserSync.reload({stream: true}));
});

//compiling our Javascripts for deployment
gulp.task('scripts-deploy', function() {
    //this is where our dev JS scripts are
    return gulp.src(['app/assets/js/src/_includes/**/*.js', 'app/assets/js/src/**/*.js'])
                //this is the filename of the compressed version of our JS
               .pipe(concat('app.js'))
               //compress :D
               .pipe(uglify())
               //where we will store our finalized, compressed script
               .pipe(gulp.dest('dist/assets/js'));
});

//compiling our SCSS files
gulp.task('css', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/assets/scss/init.scss')
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                //include SCSS and list every "include" folder
               .pipe(sass({
                  errLogToConsole: true,
                  includePaths: [
                    'app/assets/scss',
                    'bower_components/bootstrap-sass/assets/stylesheets'
                  ]
               }))
               .pipe(autoprefixer({
                  browsers: autoPrefixBrowserList,
                  cascade:  true
               }))
               //catch errors
               .on('error', gutil.log)
               //the final filename of our combined css file
               .pipe(concat('styles.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
               //where to save our final, compressed css file
               .pipe(gulp.dest('app/assets/css'))
               //notify browserSync to refresh
               .pipe(browserSync.reload({stream: true}));
});

//compiling our SCSS files for deployment
gulp.task('css-deploy', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/assets/scss/init.scss')
                //include SCSS includes folder
               .pipe(sass({
                  includePaths: [
                    'app/assets/scss',
                    'bower_components/bootstrap-sass/assets/stylesheets'
                  ]
               }))
               .pipe(autoprefixer({
                  browsers: autoPrefixBrowserList,
                  cascade:  true
               }))
               //the final filename of our combined css file
               .pipe(concat('styles.css'))
               //minify css
               .pipe(minifyCSS())
               //where to save our final, compressed css file
               .pipe(gulp.dest('dist/assets/css'));
});

//basically just keeping an eye on all HTML files
gulp.task('html', function() {
    //watch any and all HTML files and refresh when something changes
    return gulp.src('app/*.html')
               .pipe(browserSync.reload({stream: true}))
               //catch errors
               .on('error', gutil.log);
});

//migrating over all HTML files for deployment
gulp.task('html-deploy', function() {
    //grab everything, which should include htaccess, robots, etc
    gulp.src('app/*')
        .pipe(gulp.dest('dist'));

    //grab any hidden files too
    gulp.src('app/.*')
        .pipe(gulp.dest('dist'));

    gulp.src('app/assets/font/**/*')
        .pipe(gulp.dest('dist/assets/font'));

    //grab all of the css
    gulp.src(['app/css/*.css', '!app/css/css.css'])
        .pipe(gulp.dest('dist/assets/css'));
});

//cleans our dist directory in case things got deleted
gulp.task('clean', function() {
    return shell.task([
      'rm -rf dist'
    ]);
});

//create folders using shell
gulp.task('scaffold', function() {
  return shell.task([
      'mkdir dist',
      'mkdir dist/assets',
      'mkdir dist/assets/font',
      'mkdir dist/assets/img',
      'mkdir dist/assets/js',
      'mkdir dist/assets/css'
    ]
  );
});

//this is our master task when you run `gulp` in CLI / Terminal
//this is the main watcher to use when in active development
//  this will:
//  startup the web server,
//  start up browserSync
//  compress all scripts and SCSS files
gulp.task('default', ['browserSync', 'scripts', 'css'], function() {
    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('app/assets/js/src/**', ['scripts']);
    gulp.watch('app/assets/js/src/_includes/**', ['scripts']);
    gulp.watch('app/assets/scss/**', ['css']);
    gulp.watch('app/assets/img/**', ['images']);
    gulp.watch('app/*.html', ['html']);
});

//this is our deployment task, it will set everything for deployment-ready files
gulp.task('deploy', gulpSequence('clean', 'scaffold', ['scripts-deploy', 'css-deploy', 'images-deploy'], 'html-deploy'));
