var express = require('express')
var app = express();
var fs = require('fs')
var debug = require('debug')('myexpressapp:server');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bci = require('bcijs');


// MongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://garrett-m-flynn:107081654029GmF@cluster0.bdgxr.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true  });
let chat_db; // = client.db("interaction_data").collection("chat");

client.connect(err => {
  chat_db = client.db("brains-and-games").collection("submissions");
  // client.close();
});

// Websocket
var port = normalizePort(process.env.PORT || '80');


app.use(express.static('public'))

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
            "sender" : "Anonymous",
            "timestamp" : Date.now(),
          }
      )
    });
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

