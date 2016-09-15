const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const url = require('url');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current directory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);
const img = fs.readFileSync(`${__dirname}/../client/watermelon-duck.png`);
const onRequest = (request, response) => {
  const req = url.parse(request.url, true);
  const action = req.pathname;

  if (action === '/watermelon-duck.png') {
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

io.sockets.on('connection', (socket) => {
  console.log('started');

  socket.join('room1');

  socket.on('draw', (data) => {
    console.log('draw event');
    socket.broadcast.to('room1').emit('getImage', data);
  });
});

console.log('Websocket server started');

