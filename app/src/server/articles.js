'use strict'

const fs = require('fs')
const path = require('path')

const frontMatter = require('front-matter')
const markdown = require('markdown-it')()

const paths = require('./paths.js')
const utilsArticles = require('./utils/articles.js')

function findPathToArticle (directory, articleName, searchedDepth, currentDepth = 0) {
  const list = fs.readdirSync(directory)

  for (const file of list) {
    const filePath = path.join(directory, file)
    const isDirectory = fs.statSync(filePath).isDirectory()

    if (!isDirectory) continue
    if (currentDepth === searchedDepth && file === articleName) return filePath
    if (currentDepth >= searchedDepth) continue

    const result = findPathToArticle(filePath, articleName, searchedDepth, currentDepth + 1)
    if (result) return result
  }

  return false
}

function getArticlesMetadata (directory, filename, gatheredMetadata = [], baseDirectory = directory) {
  const list = fs.readdirSync(directory)
  for (const file of list) {
    const filePath = path.join(directory, file)
    const isDirectory = fs.statSync(filePath).isDirectory()

    if (isDirectory) {
      gatheredMetadata = getArticlesMetadata(filePath, filename, gatheredMetadata, baseDirectory)
    } else if (file === filename) {
      // path to article relative to baseDirectory
      const articleDirectory = filePath
        .replace(filename, '')
        .replace(baseDirectory, '')

      const metadata = frontMatter(fs.readFileSync(filePath, 'utf8')).attributes

      metadata.directory = articleDirectory

      const articlePath = articleDirectory
        .split(path.sep)
        .filter(x => x)

      metadata.url = articlePath[articlePath.length - 1]
      gatheredMetadata.push(metadata)
    }
  }

  return gatheredMetadata
}

function getArticlesDirectories (directory, searchedDepth, currentDepth = 0, articlesList = []) {
  const list = fs.readdirSync(directory)

  for (const file of list) {
    const filePath = path.join(directory, file)
    const isDirectory = fs.statSync(filePath).isDirectory()

    if (!isDirectory) continue

    if (currentDepth === searchedDepth) {
      articlesList.push(filePath)
    } else {
      getArticlesDirectories(filePath, searchedDepth, currentDepth + 1, articlesList)
    }
  }

  return articlesList
}

function parseArticle (articlePath) {
  let data = fs.readFileSync(articlePath, 'utf8')
  data = frontMatter(data)

  const metadata = data.attributes

  let article = data.body
  article = utilsArticles.fixMarkdownOrderedListIndentation(article)
  article = markdown.render(article)

  const articleDirectory = '/static/articles/' +
    articlePath
      // c:\some\path\rootdir\article.md -> rootdir\article.md
      .replace(paths.articles, '')
      .split(path.sep)
      // remove empty values (\some\path creates ['', 'some', 'path'])
      .filter(value => value)
      // remove filename rootdir\article.md - > rootdir
      .filter((value, index, array) => index !== array.length - 1)
      // use '/' instead of path.sep, because that's what we are using in templates
      .join('/') + '/'

  // TODO: every time we make html transformation we take html
  //       string and pass it into cheerio and create cheerio
  //       object, then make transformations and then transform
  //       back to html string. We could pass around cheerio
  //       object so creation of cheerio object and transformation
  //       to html string will be done only once
  // article = utilsArticles.
  // article = utilsArticles.

  return {
    metadata,
    html: article
  }
}

module.exports = {
  findPathToArticle,
  getArticlesMetadata,
  getArticlesDirectories,
  parseArticle
}
