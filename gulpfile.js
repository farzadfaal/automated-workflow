const gulp = require("gulp");
const plugins = require("gulp-load-plugins")({
  scope: ["devDependencies"],
  pattern: ["*"],
});

const browserSync = plugins.browserSync.create();

const pkg = require("./package.json");

function sass() {
  plugins.fancyLog(
    "-> Transpiling SASS Files: " + pkg.paths.dist.css + "style.css"
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
  plugins.fancyLog("-> Building CSS");
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
    .pipe(gulp.dest(pkg.paths.dist.css))
    .pipe(plugins.filter("**/*.css"))
    .pipe(browserSync.stream());
}
exports.rtl = gulp.series(sass, rtl);

function image() {
  return gulp
    .src(pkg.paths.src.img + "**/*.{png,jpg,jpeg,gif,svg}")
    .pipe(plugins.image())
    .pipe(gulp.dest(pkg.paths.dist.img));
}
exports.image = image;


function iconfont() {
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
          fontName: "iconfont", // required
          prependUnicode: true, // recommended option
          formats: ["ttf", "eot", "woff"], // default, 'woff2' and 'svg' are available
        })
      )
      .on("glyphs", function (glyphs, options) {
        console.log(glyphs, options);
      })
      .pipe(gulp.dest(pkg.paths.src.fonts));
  }
  exports.iconfont = iconfont;
  
  function font() {
    return gulp
      .src(pkg.paths.src.fonts + "**/*.{ttf,woff,svg,woff2,eot}")
      .pipe(gulp.dest(pkg.paths.dist.fonts));
  }
  exports.font = gulp.series(iconfont, font)
  

function watch() {
  browserSync.init({ server: { baseDir: "./" } });
  gulp.watch(["./src/scss/**/*.scss", "!./src/scss/mixins/_icons-template.scss"], sass);
  gulp.watch("./build/css/**/*.css", css);
  gulp.watch("./**/*.html").on("change", browserSync.reload);
}
exports.watch = watch;