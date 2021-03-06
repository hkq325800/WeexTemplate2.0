const path = require('path');
var utils = require('./utils')
const fs = require('fs-extra');
const webpack = require('webpack');
const config = require('./config');
const helper = require('./helper');
const vueLoaderConfig = require('./vue-loader.conf');
const vueWebTemp = helper.rootNode(config.templateDir);
const hasPluginInstalled = fs.existsSync(helper.rootNode(config.pluginFilePath));
const isWin = /^win/.test(process.platform);
const webEntry = {};
const weexEntry = {};
const CopyWebpackPlugin = require('copy-webpack-plugin')
// Wraping the entry file for web.
const getEntryFileContent = (entryPath, vueFilePath) => {
  let relativeVuePath = path.relative(path.join(entryPath, '../'), vueFilePath);
  let relativeEntryPath = helper.root(config.entryFilePath);
  let relativePluginPath = helper.rootNode(config.pluginFilePath);

  let contents = '';
  let entryContents = fs.readFileSync(relativeEntryPath).toString();
  if (isWin) {
    relativeVuePath = relativeVuePath.replace(/\\/g, '\\\\');
    relativePluginPath = relativePluginPath.replace(/\\/g, '\\\\');
  }
  if (hasPluginInstalled) {
    contents += `\n// If detact plugins/plugin.js is exist, import and the plugin.js\n`;
    contents += `import plugins from '${relativePluginPath}';\n`;
    contents += `plugins.forEach(function (plugin) {\n\tweex.install(plugin)\n});\n\n`;
    entryContents = entryContents.replace(/weex\.init/, match => `${contents}${match}`);
    contents = ''
  }
  contents += `\nconst App = require('${relativeVuePath}');\n`;
  contents += `new Vue(Vue.util.extend({el: '#root'}, App));\n`;
  return entryContents + contents;
}

// Retrieve entry file mappings by function recursion
const getEntryFile = (dir) => {
  dir = dir || '.';
  const directory = helper.root(dir);
  fs.readdirSync(directory).forEach((file) => {
    const fullpath = path.join(directory, file);
    const stat = fs.statSync(fullpath);
    const extname = path.extname(fullpath);
    if (stat.isFile() && extname === '.vue') {
      const name = path.join(dir, path.basename(file, extname));
      if (extname === '.vue') {
        const entryFile = path.join(vueWebTemp, dir, path.basename(file, extname) + '.js');
        fs.outputFileSync(entryFile, getEntryFileContent(entryFile, fullpath));
        webEntry[name] = entryFile;
      }
      weexEntry[name] = fullpath + '?entry=true';
    } else if (stat.isDirectory() && file !== 'build' && file !== 'include') {
      const subdir = path.join(dir, file);
      getEntryFile(subdir);
    }
  });
}

// Generate an entry file array before writing a webpack configuration
getEntryFile();


const createLintingRule = () => ({
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [helper.rootNode('src'), helper.rootNode('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
})
const useEslint = config.dev.useEslint ? [createLintingRule()] : []

/**
 * Plugins for webpack configuration.
 */
const plugins = [
  /*
   * Plugin: BannerPlugin
   * Description: Adds a banner to the top of each generated chunk.
   * See: https://webpack.js.org/plugins/banner-plugin/
   */
  new webpack.BannerPlugin({
    banner: '// { "framework": "Vue"} \n',
    raw: true,
    exclude: 'Vue'
  }),
  /**
   * 复制文件到dist下
   */
  new CopyWebpackPlugin([{
      from: 'images',
      to: './images'
    },
    {
      from: 'app.json',
      to: './app.json',
      toType: 'file'
    }
  ], {
    context: "./src"
  }),
];


/**
 * Plugins for webpack configuration.
 */
const pluginsWeb = [
  /*
   * Plugin: BannerPlugin
   * Description: Adds a banner to the top of each generated chunk.
   * See: https://webpack.js.org/plugins/banner-plugin/
   */
  new webpack.BannerPlugin({
    banner: '// { "framework": "Vue"} \n',
    raw: true,
    exclude: 'Vue'
  }),
  /**
   * 复制文件到dist下
   */
  new CopyWebpackPlugin([{
      from: 'src/images',
      to: './images'
    },
    {
      from: 'static/weex-vue-render.min.js',
      to: './weex-vue-render.min.js',
      toType: 'file'
    },
    {
      from: 'static/vue.min.js',
      to: './vue.min.js',
      toType: 'file'
    },
    {
      from: 'static/index.html',
      to: './index.html',
      toType: 'file'
    },
  ], {
    context: "./"
  }),

  /**清除打包记录 */
  // new CleanWebpackPlugin(
  //     ['dist/*'],　 //匹配删除的文件
  //     {
  //         root: helper.rootNode('.'),       　　　　　　　　　　//根目录
  //         verbose:  true,        　　　　　　　　　　//开启在控制台输出信息
  //         dry:      false        　　　　　　　　　　//启用删除文件
  //     }
  // )
];

// Config for compile jsbundle for web.
const webConfig = {
  entry: {
    main: helper.rootNode('./src/entry_web.js'),
  },
  output: {
    path: helper.rootNode('./dist/web'),
    filename: 'bundle_[name].js'
  },
  /**
   * Options affecting the resolving of modules.
   * See http://webpack.github.io/docs/configuration.html#resolve
   */
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': helper.resolve('src'),
      'tesla-native-js': 'tesla-native-js-browser'
    }
  },
  /*
   * Options affecting the resolving of modules.
   *
   * See: http://webpack.github.io/docs/configuration.html#module
   */
  module: {
    // webpack 2.0 
    rules: useEslint.concat([{
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: /node_modules(?!(\/|\\).*(weex|tesla).*)/
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'vue-loader',
          options: Object.assign(vueLoaderConfig({
            useVue: true,
            usePostCSS: false
          }), {
            /**
             * important! should use postTransformNode to add $processStyle for
             * inline style prefixing.
             */
            optimizeSSR: false,
            postcss: [
              // to convert weex exclusive styles.
              require('postcss-plugin-weex')(),
              require('autoprefixer')({
                browsers: ['> 0.1%', 'ios >= 8', 'not ie < 12']
              }),
              require('postcss-plugin-px2rem')({
                // base on 750px standard.
                rootValue: 75,
                // to leave 1px alone.
                minPixelValue: 1.01
              })
            ],
            compilerModules: [{
              postTransformNode: el => {
                // to convert vnode for weex components.
                require('weex-vue-precompiler')()(el)
              }
            }]

          })
        }]
      }
    ])
  },
  /*
   * Add additional plugins to the compiler.
   *
   * See: http://webpack.github.io/docs/configuration.html#plugins
   */
  plugins: pluginsWeb
};
// Config for compile jsbundle for native.
const weexConfig = {
  entry: weexEntry,
  output: {
    path: path.join(__dirname, '../dist/index'),
    filename: '[name].js'
  },
  /**
   * Options affecting the resolving of modules.
   * See http://webpack.github.io/docs/configuration.html#resolve
   */
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': helper.resolve('src')
    }
  },
  /*
   * Options affecting the resolving of modules.
   *
   * See: http://webpack.github.io/docs/configuration.html#module
   */
  module: {
    rules: [{
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }]
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [{
          loader: 'weex-loader',
          options: vueLoaderConfig({
            useVue: false
          })
        }]
      }
    ]
  },
  /*
   * Add additional plugins to the compiler.
   *
   * See: http://webpack.github.io/docs/configuration.html#plugins
   */
  plugins: plugins,
  /*
   * Include polyfills or mocks for various node stuff
   * Description: Node configuration
   *
   * See: https://webpack.github.io/docs/configuration.html#node
   */
  node: config.nodeConfiguration
};

module.exports = [webConfig, weexConfig];