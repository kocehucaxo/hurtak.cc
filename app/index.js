/* eslint-disable strict */
'use strict';

var pe = require('pretty-error').start();
pe.skipNodeFiles(); // this will skip events.js and http.js and similar core node files
pe.skipPackage('express'); // this will skip all the trace lines about express` core and sub-modules

var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');

var swig = require('swig');

var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    database: 'hurtak_blog',
    user: 'root',
    password: ''
});

var appDir = __dirname;

var paths = require('./paths.js');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', paths.templates);

app.use('/node_modules', express.static(paths.nodeModules));
app.use('/', express.static(paths.public));

// article images
app.get('/articles/*/images/*.png', function(req, res) {
    res.sendFile(path.join(appDir, req.originalUrl));
});

// display article from fisle system instead from database
app.get('/:article/debug', function(req, res) {
    var articleName = req.params.article;
    var articlePath = path.join(paths.articles, articleName)

    var data = JSON.parse(fs.readFileSync(articlePath + '/article.json', 'utf8'));
    var article = fs.readFileSync(articlePath + '/article.html', 'utf8');

    res.render(path.join(paths.templates, 'article.html'), {
        title: data.title,
        date: data.publication_date,
        article: article
    });

});

// main page
app.get('/', function(req, res) {

    db.query('SELECT * FROM articles WHERE visible = 1 ORDER BY publication_date DESC LIMIT 10',
    function(err, rows, fields) {
        if (err) throw err;

        var template = {
            title: 'Všechny články',
            articles: rows
        };

        res.render(path.join(paths.templates, 'index.html'), template);

    });

});

// article
app.get('/:article', function(req, res) {

    db.query('\
        SELECT title, url, publication_date, content \
        FROM articles \
        LEFT JOIN articles_content \
        ON articles_content.article_id = articles.id \
        WHERE articles.id = ( \
            SELECT id \
            FROM articles \
            WHERE visible = 1 \
            AND url = ?)',
        [req.params.article],
        function(err, rows, fields) {
            if (err) throw err;

            if (!rows.length) {
                res.render(path.join(paths.templates, '404.html'));
            } else {
                var template = {
                    title: rows[0].title,
                    data: rows[0].publication_date,
                    article: rows[0].content
                };

                res.render(path.join(paths.templates, 'article.html'), template);
            }
        }
    );
});

var port = 8000;
var server = app.listen(port, function() {
    console.log('Server started on port ' + port);
});