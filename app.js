var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');

// MongoDB
const MongoClient = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
const uri = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true ,  useUnifiedTopology: true});
let submission_db;

client.connect(err => {
  submission_db = client.db("brains-and-games").collection("submissions");
  // const collection = client.db("test").collection("devices");
});

// App
var app = express();

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);

// app.get('/', function(request, response) {
//   console.log('GET /')
//   var resultArray = [];
//   client.connect(err => {
//     assert.equal(null, err);
//     var cursor = client.db("brains-and-games").collection('submissions').find();
//     cursor.forEach(function(doc, err) {
//       assert.equal(null, err);
//       resultArray.push(doc);
//     }, function() {
//       res.render('index', {items: resultArray});
//     });
// })
// })

app.post('/', function(request, response) {
  console.log('POST /');
  client.connect(err => {
    assert.equal(null, err);
    submission_db.insertOne(request.body)
  })
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
