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
const private_brains = new Map();
const interfaces = new Map();
app.set('brains', brains);
app.set('private_brains', private_brains);
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

// Set Usage of Libraries
app.use(logger('dev'));
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Listen to Port for HTTP Requests
app.use(function(req, res, next) {
  const validOrigins = [
    `http://localhost`,
    'http://localhost:63342',
    'https://brainsatplay.azurewebsites.net',
    'http://brainsatplay.azurewebsites.net',
    'https://brainsatplay.com'
  ];

  const origin = req.headers.origin;
  if (validOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
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
app.use(favicon(path.join(__dirname, 'examples', example, 'favicons','favicon.ico')));

// Setting the port
app.set('port', port);

//
// Server
//
const http = require('http') 
let server = http.createServer(app);  

// Websocket
let wss;
wss = new WebSocket.Server({ clientTracking: false, noServer: true });

function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

//Authentication
server.on('upgrade', function (request, socket, head) {
  console.log('Parsing session from request...');
    let userId;
    let type;
    let access;

    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
    } else{
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
    }
    
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let command;

    if (app.get('interfaces').has(userId) == true && type == 'interfaces') {
      command = 'interfaces'
    } else if (type == 'brains' && ((access=="public" && app.get('brains').has(userId) == true) || (access=="private" && app.get('private_brains').has(userId) == true))){
      command = 'close' 
    } else {
      command = 'init'
    }

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, command, request);
    });
});

wss.on('connection', function (ws, command, request) {

  let userId;
  let type;
  let channelNames
  let access;

    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
      channelNames = getCookie(request, 'channelNames')
    } else if (request.headers['sec-websocket-protocol'] != undefined) {
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
    } else {
      ws.send('No userID Cookie (Python) or Protocol (JavaScript) specified')
    }

  let mirror_id;
  if (command === 'close'){
      ws.send(userId + ' is already has a brain on the network')
    return
  }
  else if (command === 'interfaces'){
    mirror_id = app.get(command).get(userId).connections.length
    app.get(command).get(userId).connections.push(ws);
  }
  else if (command === 'init'){ 
    mirror_id = 0;
    if (access === 'public' || type === 'interfaces'){
      app.get(type).set(userId, {connections: [ws], channelNames: channelNames, access: access});
    } else {
      app.get('private_brains').set(userId, {connections: [ws], channelNames: channelNames, access: access});
    }
  }

  if (access === 'private') {
    ws.send(JSON.stringify({
      msg: "streaming data privately to " + userId + "'s interfaces",
      destination: 'init'
    }))
  } else {
    ws.send(JSON.stringify({
      msg: "streaming " + userId + "'s data to the brainstorm",
      destination: 'init'
    }))
  }
  
    let str = JSON.stringify({
      n: +1,
      id: userId,
      access: access,
      channelNames: channelNames,
      destination: type
    });

    app.get('interfaces').forEach(function each(clients, id) {
      clients.connections.forEach(function allClients(client){
        if (client.readyState === WebSocket.OPEN) {
        // Broadcast new number of brains to all interfaces except yourself
        if (access === 'public' || (type == 'interfaces' && access === undefined)){
          if (client.id != userId){
              client.send(str);
          }
        // Broadcast private brains to authenticated interfaces only
        } else {
          if (id == userId){
            client.send(str);
          }
        }
    }
      })
    });

    ws.on('message', function (str) {
      let obj = JSON.parse(str);

      if (obj.destination == 'initializeBrains'){
        
        // If added user is public or an interface, broadcast their presence
        let brains = app.get('brains')
        let channelNamesArray = []
        let privateBrains = app.get('private_brains').has(userId)
        let privateInfo = {};

        if (obj.public === false){
          if (privateBrains){
            privateInfo['id'] = userId 
            privateInfo['channelNames'] = app.get('private_brains').get(userId).channelNames
          }
        }

        let keys = Object.keys(Object.fromEntries(brains))

        keys.forEach((key) => {
          channelNamesArray.push(brains.get(key).channelNames)
        })

        let initStr = JSON.stringify({
            msg: 'streaming data into the brainstorm',
            nBrains: brains.size,
            privateBrains: privateBrains,
            privateInfo: privateInfo,
            nInterfaces: app.get('interfaces').size,
            ids: keys,
            channelNames: channelNamesArray,
            destination: 'init'
        });

        ws.send(initStr)
      }

      if (obj.destination == 'chat'){
        // Broadcast chat messages to all interfaces
        app.get('interfaces').forEach(function each(clients, id) {
          clients.connections.forEach(function allClients(client){
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
      } 
      
      if (obj.destination == 'bci'){
        
        // Broadcast brain signals to all interfaces if public
        // (or broadcast only to yourself)
        app.get('interfaces').forEach(function each(clients, id) {
          clients.connections.forEach(function allClients(client){
            if (client.readyState === WebSocket.OPEN) {
              if (access === 'public'){
                  client.send(str);
              } else {
                if (id == userId){
                    client.send(str);
                }
              }
            }
          })
        });
      };
    });

    ws.on('close', function () {

      if (access === 'public' || type === 'interfaces'){
        if (app.get(type).get(userId).connections.length == 1){
          app.get(type).delete(userId);
        } else {
          app.get(type).get(userId).connections.splice(mirror_id,1)
        }
      } else {
        app.get('private_brains').delete(userId);
      }
    
      // Broadcast brains update to all interfacea

        let str = JSON.stringify({
          n: -1,
          id: userId,
          access: access,
          destination: type
        });

        app.get('interfaces').forEach(function each(clients, id) {
          clients.connections.forEach(function allClients(client){
            if (client.readyState === WebSocket.OPEN) {
              if (access === 'public' || access === undefined){
                  client.send(str);
              } else {
                if (id == userId){
                    client.send(str);
                }
              }
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
