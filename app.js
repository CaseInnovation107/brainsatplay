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
require('dotenv').config();
const discordBotKey = process.env.DISCORD_BOT_KEY

// Discord Stuff
const Discord = require('discord.js');
const botFromFuture = new Discord.Client();
botFromFuture.login(discordBotKey);
var CronJob = require('cron').CronJob;
if (typeof fetch !== 'function') {
    global.fetch = require('node-fetch-polyfill');
}
const d3 = require('d3-fetch');
var prompt = new Array(6)
let promptData;
let file = 'http://localhost/tgftfEnglish.csv'
d3.csv(file).then(csv => promptData = csv);

function generatePrompt(){
  let all = Object.keys(promptData[0])
  all.forEach((val,ind) => {
        let flag = true;
        let inner_flag;
        let row;
        let output;
        let freq;
        console.log(val)
        if ([ '﻿Future', 'Time'].includes(val)) {
                inner_flag = true;
                while (inner_flag) {
                    row = Math.floor(Math.random() * promptData.length);
                    output = promptData[row][val];
                    if (output != '' && output != undefined) {
                        inner_flag = false;
                        if (val == 'Time') {
                            output += ' from now'
                        }
                        console.log(output)
                        prompt[ind] = output;
                    }
                }
        } else {
            // Create bag of words (to account for frequency)
            let bag = [];
            let data_;
            let word;
            let components;
            for (const r in promptData) {
                data_ = promptData[r][val]
                if (data_ != undefined && data_ != []) {
                    if (data_.split(' (').length == 2) {
                        components = data_.split(' (')
                        word = components[0];
                        freq = components[1].split(')')[0]
                        for (let i = 0; i < freq; i++) {
                            bag.push(word)
                        }
                    } else{
                        bag.push(data_)
                    }
                }
            }

            while (flag) {
                row = Math.floor(Math.random() * bag.length);
                console.log(output)
                output = bag[row]
                if (output != '') {
                    flag = false;
                    prompt[ind] = output
                }
            }
        }
      })
}


botFromFuture.once('ready', () => {
  generatePrompt()
});

botFromFuture.on('message', message => {
  if (message.channel instanceof Discord.DMChannel){
	if (message.content === 'get prompt') {
    generatePrompt()
		message.author.send(
      `In a **${prompt[0]}** future **${prompt[1]}**, there is a **${prompt[2]}** BBI game for **${prompt[3]}** players which is played for **${prompt[4]} ${prompt[5]}**. What is it?`      )
  }
}
});

var job = new CronJob('0 8 * * *', function() {
  botFromFuture.channels.fetch('802587106798993408')
  .then(channel => {
    channel.send(
      `In a **${prompt[0]}** future **${prompt[1]}**, there is a **${prompt[2]}** BBI game for **${prompt[3]}** players which is played for **${prompt[4]} ${prompt[5]}**. What is it?`
    )
  }
    );
}, null, true, 'America/Los_Angeles');
job.start();



// BCI Stuff
const WebSocket = require('ws');
// Muse
// const noble = require('noble');
// const bluetooth = require('bleat').webbluetooth;

// Settings
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
const games = new Map();
app.set('games', games);

app.set('brains', brains);
app.set('private_brains', private_brains);
app.set('interfaces', interfaces);
// app.set('example', example);

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'libraries','js')));
app.use(express.static(path.join(__dirname, 'libraries','js','muse-js')));

app.use(favicon(path.join(__dirname, 'public', 'favicons','favicon.ico')));

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
    let game;

    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
      game = getCookie(request, 'game')
    } else{
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
      game = protocols[2]
    }
    
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let command;

    if (!app.get('games').has(game)){
      app.get('games').set(game, {interfaces: new Map(), brains: new Map(), privateBrains: new Map()})
    }

    if (app.get('games').get(game).interfaces.has(userId) == true && ['interfaces','bidirectional'].includes(type)) {
      command = type
    } else if (['brains','bidirectional'].includes(type) && ((access=="public" && app.get('games').get(game).brains.has(userId) == true) || (access=="private" && app.get('games').get(game).privateBrains.has(userId) == true))){
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
  let game;
  let _type;


    if (getCookie(request, 'id') != undefined) {
      userId =  getCookie(request, 'id')
      type = getCookie(request, 'connectionType')
      access = getCookie(request, 'access')
      channelNames = getCookie(request, 'channelNames')
      game = getCookie(request, 'game')
    } else if (request.headers['sec-websocket-protocol'] != undefined) {
      let protocols = request.headers['sec-websocket-protocol'].split(', ')
      userId =  protocols[0]
      type = protocols[1]
      game = protocols[2]
      if (type==='bidirectional'){
        access = protocols[3]
        channelNames = []
        for (let i = 4; i < protocols.length; i++){
        channelNames.push(protocols[i])
        }
        channelNames = channelNames.join(',')
      }
    } else {
      ws.send('No userID Cookie (Python) or Protocol (JavaScript) specified')
    }

  let mirror_id;
  if (command === 'close'){
      ws.send(userId + ' is already has a brain on the network')
    return
  }
  else if (['interfaces','bidirectional'].includes(command)){
    mirror_id = app.get('games').get(game).interfaces.get(userId).connections.length
    app.get('games').get(game).interfaces.get(userId).connections.push(ws);
  }
  else if (command === 'init'){ 
    mirror_id = 0;
    if (access === 'public' || ['interfaces','bidirectional'].includes(type)){
      if (type == 'bidirectional'){
        _type = ['interfaces','brains']
      } else {
        _type = [type];
      }
      _type.forEach((thisType) => {
        app.get('games').get(game)[thisType].set(userId, {connections: [ws], channelNames: channelNames, access: access});
      })
    } else {
      app.get('games').get(game).privateBrains.set(userId, {connections: [ws], channelNames: channelNames, access: access});
    }
  }

  if (access === 'private') {
    ws.send(JSON.stringify({
      msg: "streaming data privately to " + userId + "'s interfaces for "  + game,
      destination: 'init'
    }))
  } else {
    ws.send(JSON.stringify({
      msg: "streaming " + userId + "'s data to " + game,
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

    app.get('games').get(game).interfaces.forEach(function each(clients, id) {
      clients.connections.forEach(function allClients(client){
        if (client.readyState === WebSocket.OPEN) {
        // Broadcast new number of brains to all interfaces except yourself
        if (access === 'public' || (['interfaces','bidirectional'].includes(type) && access === undefined)){
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
        let brains = app.get('games').get(game).brains
        let channelNamesArray = []
        let privateBrains = app.get('games').get(game).privateBrains.has(userId)
        let privateInfo = {};

        if (obj.public === false){
          if (privateBrains){
            privateInfo['id'] = userId 
            privateInfo['channelNames'] = app.get('games').get(game).privateBrains.get(userId).channelNames
          }
        }

        let keys = Object.keys(Object.fromEntries(brains))

        keys.forEach((key) => {
          channelNamesArray.push(brains.get(key).channelNames)
        })

        let initStr = JSON.stringify({
            msg: 'streaming data to ' +  game,
            nBrains: brains.size,
            privateBrains: privateBrains,
            privateInfo: privateInfo,
            nInterfaces: app.get('games').get(game).interfaces.size,
            ids: keys,
            channelNames: channelNamesArray,
            destination: 'init'
        });

        ws.send(initStr)
      }
      
      if (obj.destination == 'bci'){
        
        // Broadcast brain signals to all interfaces if public
        // (or broadcast only to yourself)
        app.get('games').get(game).interfaces.forEach(function each(clients, id) {
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

      if (access === 'public' || ['interfaces','bidirectional'].includes(type)){
        if (type == 'bidirectional'){
          _type = ['interfaces','brains']
        } else {
          _type = [type];
        }
        _type.forEach((thisType) => {
          if (app.get('games').get(game)[thisType].get(userId).connections.length == 1){
            app.get('games').get(game)[thisType].delete(userId);
          } else {
            app.get('games').get(game)[thisType].get(userId).connections.splice(mirror_id,1)
          }
        })
      } else {
        app.get('games').get(game).privateBrains.delete(userId);
      }
    
      // Broadcast brains update to all interfacea

        let str = JSON.stringify({
          n: -1,
          id: userId,
          access: access,
          destination: type
        });

        app.get('games').get(game).interfaces.forEach(function each(clients, id) {
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

        // Remove game from server if empty
        if (app.get('games').get(game).interfaces.size == 0 && app.get('games').get(game).brains.size == 0 && app.get('games').get(game).privateBrains.size == 0){
          app.get('games').delete(game)
        }
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
