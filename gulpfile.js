const gulp = require("gulp");
const plugins = require("gulp-load-plugins")({
  scope: ["devDependencies"],
  pattern: ["*"],
});

const browserSync = plugins.browserSync.create();
const pkg = require("./package.json");

function sass() {
  plugins.fancyLog(
    "Transpiling SASS Files -->" + pkg.paths.build.css + "style.css"
  );
  return gulp
    .src(pkg.paths.src.sass + pkg.vars.sassName)
    .pipe(plugins.plumber({}))
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(
      plugins
        .sass({ includePaths: pkg.paths.sass })
        .on("error", plugins.sass.logError)
    )
    .pipe(plugins.cached("sass_compile"))
    .pipe(plugins.postcss([plugins.autoprefixer()]))
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(plugins.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.build.css));
}
exports.sass = sass;

function css() {
  plugins.fancyLog(
    "Building CSS Files -->" + pkg.paths.dist.css + "style.min.css"
  );
  return gulp
    .src(pkg.globs.distCss)
    .pipe(plugins.plumber({ errorHandler: true }))
    .pipe(plugins.newer({ dest: pkg.paths.dist.css + pkg.vars.siteCssName }))
    .pipe(plugins.print.default())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.concat(pkg.vars.siteCssName))
    .pipe(plugins.postcss([plugins.cssnano()]))
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(plugins.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.dist.css))
    .pipe(plugins.filter("**/*.css"))
    .pipe(browserSync.stream());
}
exports.css = gulp.series(sass, css);

function rtl() {
  plugins.fancyLog(
    "Building RTL Layout Files -->" + pkg.paths.dist.css + "style.min-rtl.css"
  );
  return gulp
    .src(pkg.globs.distCss)
    .pipe(plugins.newer({ dest: pkg.paths.dist.css + pkg.vars.siteCssRtlName }))
    .pipe(plugins.plumber({ errorHandler: true }))
    .pipe(plugins.print.default())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat(pkg.vars.siteCssName))
    .pipe(plugins.postcss([plugins.cssnano()]))
    .pipe(plugins.rtlcss())
    .pipe(plugins.rename({ suffix: "-rtl" }))
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(plugins.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.dist.css))
    .pipe(plugins.filter("**/*.css"))
    .pipe(browserSync.stream());
}
exports.rtl = gulp.series(css, rtl);

function image() {
  plugins.fancyLog("Minifying Images -->" + pkg.paths.dist.img);
  return gulp
    .src(pkg.paths.src.img + "**/*.{png,jpg,jpeg,gif,svg}")
    .pipe(plugins.image())
    .pipe(gulp.dest(pkg.paths.dist.img));
}
exports.image = image;

function iconfont() {
  plugins.fancyLog(`Building Icon Fonts --> ${pkg.paths.src.font}`);
  return gulp
    .src(pkg.paths.src.icons + "**/*.svg", { base: pkg.paths.src.base })
    .pipe(
      plugins.iconfontCss({
        fontName: "iconfont",
        path: pkg.paths.src.sass + "mixins/_icons-template.scss",
        targetPath: "../../" + pkg.paths.src.sass + "mixins/_icons.scss",
        fontPath: "../." + pkg.paths.dist.fonts,
      })
    )
    .pipe(
      plugins.iconfont({
        fontName: "iconfont",
        prependUnicode: true,
        fontHeight: 1000,
        normalize: true,
      })
    )
    .pipe(gulp.dest(pkg.paths.src.fonts));
}
exports.iconfont = iconfont;

function font() {
  plugins.fancyLog(`Pushing Icon Fonts Into Dist --> ${pkg.paths.dist.font}`);
  return gulp
    .src(pkg.paths.src.fonts + "**/*.{ttf,woff,svg,woff2,eot}")
    .pipe(gulp.dest(pkg.paths.dist.fonts));
}
exports.font = gulp.series(iconfont, font);

function buildjs() {
  plugins.fancyLog(`Building Javascript Files --> ${pkg.paths.build.js}`);
  return gulp
    .src(`${pkg.paths.src.js}**/*.js`)
    .pipe(plugins.plumber({}))
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.cached("js_compile"))
    .pipe(
      plugins.babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(plugins.concat(pkg.vars.siteJsName))
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(plugins.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.build.js));
}
exports.buildjs = buildjs;

function js() {
  plugins.fancyLog(
    `Minifying and Uglifying Javascript Files --> ${pkg.paths.dist.js}`
  );
  return gulp
    .src(`${pkg.paths.build.js}**/*.js`)
    .pipe(plugins.rename(pkg.vars.siteBundledJsName))
    .pipe(plugins.plumber({}))
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.uglifyEs.default())
    .pipe(plugins.sourcemaps.write("./"))
    .pipe(plugins.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(pkg.paths.dist.js));
}
exports.js = gulp.series(buildjs, js);

function watch() {
  browserSync.init({ server: { baseDir: "./" } });

  gulp.watch(
    ["./src/scss/**/*.scss", "!./src/scss/mixins/_icons-template.scss"],
    sass
  );
  gulp.watch("./build/css/**/*.css", css);
  gulp.watch(["./src/js/**/*.js", "!./dist/js/**/*.js"], buildjs);
  gulp.watch(["./dist/js/**/*.js"], js).on("change", browserSync.reload);
  gulp
    .watch(["./src/img/**/*.{png,jpg,jpeg,gif,svg}"], image)
    .on("change", browserSync.reload);
  gulp.watch(["./src/icons/**/*.svg"], iconfont)
  gulp.watch(["./src/fonts/**/*.{svg,ttf,woff,woff2,eot}"], font).on("change", browserSync.reload)
  gulp.watch("./**/*.html").on("change", browserSync.reload);
}
exports.watch = watch;

exports.default = exports.build = gulp.series(
  sass,
  css,
  rtl,
  buildjs,
  js,
  image,
  iconfont,
  font
);
