const fs = require('fs');
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const debug = require('debug')('myexpressapp:server');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hbs = require('express-handlebars');
const WebSocket = require('ws');


// Settings
let example = 'brainstorm'
let protocol = 'http';
const url = 'localhost'
var port = normalizePort(process.env.PORT || '80');

//
// App
//

const app = express();
const brains = new Map();
const interfaces = new Map();
app.set('brains', brains);
app.set('interfaces', interfaces);
app.set('example', example);


//CORS
app.use(require("cors")()) // allow Cross-domain requests

// MongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/test?retryWrites=true&w=majority";
app.set('mongo_url', uri);
let submission_db;
let chat_db;
let collection;
let collectionChunks;
MongoClient.connect(uri, { useUnifiedTopology: true })
  .then(client => {
    app.set('mongo_client', client);
    console.log('Connected to Database')
    submission_db = client.db("brains-and-games").collection("submissions");
    chat_db = client.db("livewire").collection("chat");
    collection = client.db("brains-and-games").collection('photos.files');    
    collectionChunks = client.db("brains-and-games").collection('photos.chunks');
  })

// Cookies
const store = new MongoDBStore({
  uri: uri,
  collection: 'sessions'
});

let sessionParser = session({
  secret: 'secret string',
  resave: true,
  saveUninitialized: true,
  store: store, /* store session data in mongodb */
  cookie: { 
    secure: false ,
    sameSite: false ,
    maxAge: 1000 * 60 * 60 * 24 * 7}
})

// Set Usage of Libraries
app.use(logger('dev'));
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Listen to Port for HTTP Requests
app.use(function(req, res, next) {
  const validOrigins = [
    `http://localhost`,
    'https://brainsatplay.azurewebsites.net',
    'http://brainsatplay.azurewebsites.net',
    'https://brainsatplay.com',
    // '*',
    'http://97.90.237.21',
    'http://97.90.237.21:63342'
  ];
  const origin = req.headers.origin;

  if (validOrigins.includes(origin)) {
    // console.log('valid origin: ' + origin)
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // console.log('invalid origin: ' + origin)
  }

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// Set Routes
const initRoutes = require("./routes/web");
initRoutes(app);

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('error')
  });
}

// production error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.log('error')
});

// Static Middleware
app.use(express.static(path.join(__dirname, 'examples',example)));
app.use(favicon(path.join(__dirname, 'examples', example, 'favicon.ico')));

// Setting the port
app.set('port', port);

//
// Server
//
const http = require('http') 
let server = http.createServer(app);  

// Websocket
let wss;
// if (webSocketType == 'serverless'){
wss = new WebSocket.Server({ clientTracking: false, noServer: true });
// } else{
// wss = new WebSocket.Server( {server:server});
// }

function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

//Authentication
server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

    const userId =  getCookie(request,'userId')

    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    let command;
    const type = getCookie(request, 'connectionType') + 's'
    if (app.get(type).has(userId) == true){
      command = type
    } else {
      command = 'init'
    }
    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, command, request);
    });
});

wss.on('connection', function (ws, command, request) {

  const userId =  getCookie(request,'userId')
  const type = getCookie(request,'connectionType') + 's'

  let mirror_id;

  if (command === 'interfaces' || command === 'brains'){
    mirror_id = app.get(command).get(userId).length
    app.get(command).get(userId).push(ws);
  }
  else if (command === 'init'){ 
    mirror_id = 0;
    let list = [ws]
    app.get(type).set(userId, list);
  }

    let initStr = JSON.stringify({
      n: app.get('interfaces').size,
      ids: Object.keys(Object.fromEntries(app.get('interfaces'))),
      destination: 'init'
  });

  ws.send(initStr)

  let str = JSON.stringify({
    n: +1,
    id: userId,
    destination: 'BrainsAtPlay'
  });

  // Broadcast new number of brains to all interfacea
  app.get('interfaces').forEach(function each(clients, id) {
    clients.forEach(function allClients(client){
      if (client.id != userId){
      if (client.readyState === WebSocket.OPEN) {
        client.send(str);
      }
    }
    })
  });

    ws.on('message', function (str) {
      let obj = JSON.parse(str);
      if (obj.destination == 'chat'){
        // Broadcast chat messages to all interfaces
        app.get('interfaces').forEach(function each(clients, id) {
          clients.forEach(function allClients(client){
            if (client.readyState === WebSocket.OPEN) {
              client.send(str);
            }
          })
        });
        chat_db.insertOne(
            { "msg" : obj.msg,
              "sender" : userId,
              "timestamp" : Date.now(),
            }
        )
      } if (obj.destination == 'bci'){
        // Broadcast brain signals to all interfaces including yourself
        app.get('interfaces').forEach(function each(clients, id) {
          obj.id = userId
          let str = JSON.stringify(obj)
            clients.forEach(function allClients(client){
              if (client.readyState === WebSocket.OPEN) {
                client.send(str);
              }
            })
        })
      };
    });

    ws.on('close', function () {
      if (app.get(type).get(userId).length == 1){
      app.get(type).delete(userId);
      } else {
        app.get(type).get(userId).splice(mirror_id,1)
      }

      let str = JSON.stringify({
        n: -1,
        id: userId,
        destination: 'BrainsAtPlay'
    });
    
      // Broadcast new number of brains to all interfacea
      app.get('interfaces').forEach(function each(clients, id) {
        clients.forEach(function allClients(client){
          if (client.readyState === WebSocket.OPEN) {
            client.send(str);
          }
        })
      });
    });
});

// error handlers

server.listen(parseInt(port), () => {
  console.log('listening on *:' + port);
});

server.on('error', onError);
server.on('listening', onListening);

console.log(`Server is running on ${protocol}://${url}:${port}`)


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
