const socketio = require('socket.io');
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const url = require('url');
const csrf = require('csurf');

const dbURL = process.env.MONGODB_URI || 'mongodb://127.0.0.1/DomoMaker';
console.log(dbURL);

mongoose.connect(dbURL, (err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

let redisURL = {
  hostname: 'localhost',
  port: 6379,
};

let redisPASS;

if (process.env.REDISCLOUD_URL) {
  redisURL = url.parse(process.env.REDISCLOUD_URL);
  redisPASS = redisURL.auth.split(':')[1];
}

// pull in our routes
const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const app = express();
app.use('/assets', express.static(path.resolve(`${__dirname}/../client/`)));
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(session({
  key: 'sessionid',
  store: new RedisStore({
    host: redisURL.hostname,
    port: redisURL.port,
    pass: redisPASS,
  }),
  secret: 'Domo Arigato',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
}));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.use(favicon(`${__dirname}/../client/img/favicon.png`));
app.disable('x-powered-by');
app.use(cookieParser());

// csrf must come AFTER app.use(cookieParser());
// and app.use(session({...});
// should come BEFORE the router
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  return false;
});

router(app);


const server = app.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});


// pass app aka server created by app.listen to socket
const io = socketio(server);

// variable to store the username of the lobby host
let host = 'null';

io.sockets.on('connection', (socket) => {
  console.log('started');

  socket.join('room1');

  socket.on('join', (data) => {
    if (host === 'null') {
      host = data.name;
      console.log(`Host set to ${data.name}`);
      socket.emit('setHost', true);
    } else {
      console.log('Host unchanged');
      io.sockets.in('room1').emit('requestWorldData', data);
    }
  });

  socket.on('leave', (data) => {
    console.log('User has left the game');
    if (data) {
      host = 'null';
    }
    socket.disconnect();
  });

  socket.on('updateWorldData', (data) => {
    console.log('Updating world data for new user');
    socket.broadcast.emit('getWorldData', data);
  });

  // these methods update entire player array
  socket.on('updatePlayer', (data) => {
    io.sockets.in('room1').emit('getPlayersHost', data);
  });

  socket.on('updateAllPlayers', (data) => {
    io.sockets.in('room1').emit('getAllPlayers', data);
  });

  // these methods update only position of a single player
  socket.on('updatePlayerMovement', (data) => {
    io.sockets.in('room1').emit('getPlayersMovementHost', data);
  });

  socket.on('updateAllPlayersMovement', (data) => {
    io.sockets.in('room1').emit('getAllPlayersMovement', data);
  });

  // these methods update only health of a single player
  socket.on('updatePlayerHealth', (data) => {
    io.sockets.in('room1').emit('getPlayersHealthHost', data);
  });

  socket.on('updateAllPlayersHealth', (data) => {
    io.sockets.in('room1').emit('getAllPlayersHealth', data);
  });

  // These methods update enemies
  socket.on('updateEnemy', (data) => {
    io.sockets.in('room1').emit('getEnemyHost', data);
  });

  socket.on('updateAllEnemies', (data) => {
    io.sockets.in('room1').emit('getAllEnemies', data);
  });

  socket.on('moveToNextStage', (data) => {
    io.sockets.in('room1').emit('setNextStageHost', data);
  });

  socket.on('moveToNextStageAll', (data) => {
    io.sockets.in('room1').emit('setNextStageAll', data);
  });

  socket.on('healSpell', (data) => {
    io.sockets.in('room1').emit('healSpellHost', data);
  });

  socket.on('healSpellAll', (data) => {
    io.sockets.in('room1').emit('healAll', data);
  });
});

console.log('Websocket server started');

// to store the lobby leader
// object roomhost - roomname, and socket leader's username
// all socket.on goes to the host, and emit from the host
// every 3 or 5 seconds, send out a massive world update

// to confirm that move, don't send back to the person who moved, only the others
// ask Slack Socket.io about movement

