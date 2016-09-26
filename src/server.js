"use strict";

const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const url = require('url');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current directory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);
const img = fs.readFileSync(`${__dirname}/../client/background1.png`);
const onRequest = (request, response) => {
  const req = url.parse(request.url, true);
  const action = req.pathname;

  if (action === '/background1.png') {
    console.log('sending image from request');
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.write(img);
    response.end();
  } else {
    console.log('sending html page from request');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write(index);
    response.end();
  }
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

//variable to store the username of the lobby host
let host = "null";

io.sockets.on('connection', (socket) => {
  console.log('started');

  socket.join('room1');
  
  socket.on('join', (data) => {
    if(host === "null") {
      host = data;
      console.log(`Host set to ${data}`);
      socket.emit('setHost', true);
    }
    else {
      console.log("Host unchanged");
      io.sockets.in('room1').emit('requestWorldData', {} );
    }
  });
  
  socket.on('updateWorldData', (data) => {
    console.log('Updating world data for new user');
    socket.broadcast.emit('getWorldData', data);
  });

  //player updates
  socket.on('updatePlayer', (data) => {
    io.sockets.in('room1').emit('getPlayersHost', data);
  });
  
  socket.on('updateAllPlayers', (data) => {
    io.sockets.in('room1').emit('getAllPlayers', data);
  });
  
  socket.on('updateEnemy', (data) => {
    io.sockets.in('room1').emit('getEnemyHost', data);
  });
  
  socket.on('updateAllEnemies', (data) => {
    io.sockets.in('room1').emit('getAllEnemies', data);
  })
});

console.log('Websocket server started');

// to store the lobby leader
// object roomhost - roomname, and socket leader's username
// all socket.on goes to the host, and emit from the host
// every 3 or 5 seconds, send out a massive world update

//to confirm that move, don't send back to the person who moved, only the others
//ask Slack Socket.io about movement

