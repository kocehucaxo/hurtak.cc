'use strict'

const path = require('path')

const joinPathsInObject = (paths, rootDirectory) => {
  const absolutePaths = {}
  for (const key in paths) {
    absolutePaths[key] = path.join(rootDirectory, paths[key])
  }
  return absolutePaths
}

const appDirectory = path.join(__dirname, '../')

// paths relative to src directory
const paths = {
  root: '../',

  articles: '../articles',
  nodeModules: '../node_modules',

  config: './config',
  server: './server',
  static: './static',
  fonts: './static/fonts',
  icons: './static/icons',
  images: './static/images',
  scripts: './static/scripts',
  styles: './static/styles',
  templates: './templates'
}

const absolutePaths = joinPathsInObject(paths, appDirectory)

module.exports = absolutePaths