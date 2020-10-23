var express = require('express');
var debug = require('debug')('myexpressapp:server');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('express-handlebars');

// App
var app = express();
var server = require('http').createServer(app);

//CORS
app.use(require("cors")()) // allow Cross-domain requests 

//Websockets
var io = require('socket.io')(server);

// MongoDB
const MongoClient = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require('assert');
const uri = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/test?retryWrites=true&w=majority";
let submission_db;
let chat_db;

MongoClient.connect(uri, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database')
    submission_db = client.db("brains-and-games").collection("submissions");
    chat_db = client.db("livewire").collection("chat");
  })

// Listen to Port
var port = normalizePort(process.env.PORT || '80');

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Listen to Port for HTTP Requests

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World')
})

// app.get('/', function(request, response) {
//   console.log('GET /')
//   var resultArray = [];
// response.set('Access-Control-Allow-Origin', '*');
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

app.post('/', (req, res) => {
  submission_db.insertOne(req.body)
  console.log(req)
})

// app.post('/', function(request, response) {
//   console.log('POST /');
//     submission_db.insertOne(request.body)
// })

// Listen for Websocket Connections
io.on('connection', (socket) => {
  console.log('new connection: ' + socket.id);

  socket.on('bci',bciSignal)

  function bciSignal(data){
      socket.broadcast.emit('bci', data)
  }

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('msg: ' + msg) 
    chat_db.insertOne(
          { "msg" : msg,
            "sender" : socket.id,
            "timestamp" : Date.now(),
          }
      )
  });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('error')
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log('error')
});

app.set('port', port);

server.listen(parseInt(port), () => {
  console.log('listening on *:' + port);
});

server.on('error', onError);
server.on('listening', onListening);

console.log('My socket server is running')


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
