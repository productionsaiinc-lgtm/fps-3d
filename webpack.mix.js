let mix = require('laravel-mix');

mix.setPublicPath('public/build')
   .js('src/app.js', 'app.js')
   .babel([
      'src/libs/babylon.max.js',
      'src/libs/babylon.objFileLoader.js',
      'src/libs/babylon.glTF2FileLoader.js',
      'src/libs/babylon.gui.js',
      'src/libs/babylon.addons.js',
   ], 'vendor.js');

