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

let protocol = 'http' // 'https'
let webSocketType = 'serverless'

// const https = require('https')
const http = require(protocol) 


// Listen to Port
const url = 'localhost'

if (protocol == 'http'){
var port = normalizePort(process.env.PORT || '80');
} else {
  var port = normalizePort(process.env.PORT || '443');
}

//
// App
//

const app = express();
const map = new Map();
app.set('map', map);

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

app.use(sessionParser)

// view engine setup
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// if (!(process.env.NODE_ENV === 'development')) {
//   app.set('trust proxy', 1);
// }

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
    console.log('valid origin: ' + origin)
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    console.log('invalid origin: ' + origin)
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
// will print stacktrace
console.log(app.get('env'))
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

// Static Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Setting the port
app.set('port', port);

//
// Server
//
let server; 
if (protocol == 'http'){    
  server = http.createServer(app);  
} else {
  const key = fs.readFileSync(path.join(__dirname,'public','assets','keys','key-rsa.pem'));
  const cert = fs.readFileSync(path.join(__dirname,'public','assets','keys','cert.pem'));
  server = https.createServer({ key, cert }, app); 
}   

// Websocket
let wss;
if (webSocketType == 'serverless'){
wss = new WebSocket.Server({ clientTracking: false, noServer: true });
} else{
wss = new WebSocket.Server( {server:server});
}

//Authentication
server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');

  sessionParser(request, {}, () => {
    const userId =  request.session.userId
    console.log(request.session)

    if (!userId) {
      console.log('HTTP/1.1 401 Unauthorized')
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    console.log('Session is parsed!');
    console.log('upgrading userId: ' + userId)


    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', function (ws, request) {

  const userId = request.session.userId;
  console.log('connecting userId: ' + userId)

  app.get('map').set(userId, ws);

  ws.on('message', function (str) {
    let obj = JSON.parse(str);
    if (obj.destination == 'chat'){
      // Broadcast to all clients
      app.get('map').forEach(function each(client, id) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(str);
        }
      });
      chat_db.insertOne(
          { "msg" : obj.msg,
            "sender" : userId,
            "timestamp" : Date.now(),
          }
      )
    } if (obj.destination == 'bci'){
      // Broadcast to all clients EXCEPT YOURSELF
      app.get('map').forEach(function each(client, id) {
        if (id != userId) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(str);
          }
        }
      })};
  });

  ws.on('close', function () {
    console.log('closing user: ' + userId)
    map.delete(userId);
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
