import gulp from 'gulp';

import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();

import browserSync from 'browser-sync';
import runSequence from 'run-sequence';

import del from 'del';
import path from 'path';

import paths from './app/server/paths.js';

// Options

const options = {
    server: {
        path: path.join(paths.app.server, 'index.js'),
        env: {
            NODE_ENV: 'development'
        }
        // , execArgv: ['--harmony']
    },
    browserSync: {
        proxy: 'http://localhost:8000', // where server is running
        port: 3000, // where browser sync is running
        // https: false,
        // ghostMode: {
        //     clicks: false,
        //     forms: false,
        //     scroll: false
        // },
        notify: true, // The small pop-over notifications in the browser are not always needed/wanted.
        open: false // Decide which URL to open automatically when Browsersync starts. Defaults to "local" if none set. Can be true, local, external, ui, ui-external, tunnel or false
    },
    autoprefixer: {
        browsers: [
            '> 2%',
            'last 2 versions',
            'Firefox ESR',
            'ie >= 9'
        ],
        cascade: false
    },
    htmlmin: {
        removeComments: true,
        collapseWhitespace: true
    },
    imagemin: {
        progressive: true,
        svgoPlugins: [
            {removeViewBox: false}
        ],
        use: []
    }
};

var compileJs = function(origin, destination) {
    return gulp.src([].concat(origin))
        .pipe($.sourcemaps.init())
        .pipe($.babel({ optional: [
            'runtime',
            'es7.asyncFunctions'
        ] }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(destination));
}

var ttt = function(origin, destination) {
    return gulp.src([].concat(origin))
        .pipe(gulp.dest(destination));
}

// Main tasks

gulp.task('xxx', () => {
    runSequence(
        ['clear:dist', 'lint:js'],
        ['compile:server', 'compile:scripts', 'templ', 'public']
        // ['scripts', 'styles', 'fonts', 'icons', 'images']
    );
});

gulp.task('compile:server', () => compileJs(paths.app.server + '/**', paths.dist.server));
gulp.task('compile:scripts', () => compileJs('./app/scripts/**', './dist/scripts'));
gulp.task('templ', () => ttt('./app/templates/**', './dist/templates'));
gulp.task('public', () => ttt('./app/public/**', './dist/public'));

// linters

gulp.task('lint:js', () => {
    return gulp.src([
            paths.app.scripts + '/**',
            paths.app.server + '/**',
            paths.gulpfile
        ])
        .pipe($.eslint())
        .pipe($.eslint.format());
        // .pipe($.eslint.failOnError());
});

// clear

gulp.task('clear:dist', () => {
    return del([
        paths.distDirectory + '/*'
    ]);
});

// compile

gulp.task('compile', () => {
    let assets = $.useref.assets();

    return gulp.src(paths.app.html)
        .pipe(assets)
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.autoprefixer(options.autoprefixer)))
        .pipe($.if('*.css', $.csso()))
        .pipe($.rev())
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe($.if('*.html', $.htmlmin(options.htmlmin)))
        .pipe(gulp.dest(paths.distDirectory));
});

gulp.task('scripts', () => {
    return gulp.src(paths.app.scripts + '/**')
        // .pipe($.imagemin(options.imagemin))
        .pipe(gulp.dest(paths.dist.scripts));
});

gulp.task('styles', () => {
    return gulp.src(paths.app.styles + '/**')
        // .pipe($.imagemin(options.imagemin))
        .pipe(gulp.dest(paths.dist.styles));
});

// Images

gulp.task('images', ['images:public', 'images:articles']);

gulp.task('images:public', () => {
    let src = [
        paths.app.images + '/**'
    ];

    return gulp.src(src)
        // .pipe($.imagemin(options.imagemin))
        .pipe(gulp.dest(paths.dist.images));
});

gulp.task('images:articles', () => {
    let src = [
        paths.app.articles + '/*/article.png',
        paths.app.articles + '/*/images/*.{png,jpg,jpeg,gif,bmp}'
    ];

    return gulp.src(src)
        // .pipe($.imagemin(options.imagemin))
        .pipe(gulp.dest(paths.dist.articles));
});

// Templates

gulp.task('templates', ['templates:server', 'templates:articles']);

gulp.task('templates:server', () => {
    let src = [
        paths.app.templates + '/**'
    ];

    return gulp.src(src)
        .pipe(gulp.dest(paths.dist.templates));
});

// Main gulp tasks

gulp.task('server:start', () => {
    $.developServer.listen(options.server, (error) => {
        if (error) return;
        browserSync(options.browserSync);
    });
});

// If server scripts change, restart the server and then browser-reload.
gulp.task('server:restart', () => {
    $.developServer.restart((error) => {
        if (error) return;
        browserSync.reload();
    });
});

// runs from app directory
gulp.task('dev', ['server:start'], () => {
    $.watch([
        paths.appDirectory + '/**'
    ], () => {
        runSequence(
            ['server:restart']
        );
    });
});
