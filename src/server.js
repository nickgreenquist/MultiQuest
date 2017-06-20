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
const models = require('./models');

const Account = models.Account;

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

const rooms = {};

// console.dir(io.sockets.adapter.rooms);

io.sockets.on('connection', (socket) => {
  console.log('started');

  socket.on('join', (data) => {
    socket.join(data.room);

    if (!(data.room in rooms)) {
      rooms[data.room] = { name: data.room, players: 1, distance: 0 };

      console.log(`Host set to ${data.name}`);
      socket.emit('setHost', true);
    } else {
      rooms[data.room].players += 1;
      console.log('Host unchanged');
      io.sockets.in(data.room).emit('requestWorldData', data);
    }
  });

  socket.on('leave', (data) => {
    console.log('User has left the game');
    if ((data.room in rooms)) {
      rooms[data.room].players -= 1;
    }
    if (data.isHost) {
      console.log('user is host, removgin room');
      console.log(data.name);
      // host = 'null';
      delete rooms[data.name];
    }
    socket.disconnect();


    // save character data
    const query = { username: data.name };
    const update = {
      level: data.player.level,
      maxDistance: data.player.maxDistance,
      exp: data.player.exp,
      points: data.player.points,
      attack: data.player.attack,
      speed: data.player.speed,
      spellPower: data.player.spellPower,
      maxHealth: data.player.maxHealth,
    };
    Account.AccountModel.findOneAndUpdate(query, update, { upsert: true }, (err) => {
      if (err) {
        console.log('error');
      }
      console.log('succesfully saved');
    });
  });

  socket.on('updateWorldData', (data) => {
    console.log('Updating world data for new user');
    socket.broadcast.emit('getWorldData', data);
  });

  socket.on('updateAllPlayers', (data) => {
    io.sockets.in(data.room).emit('getAllPlayers', data.players);
  });

  // these methods update only position of a single player
  socket.on('updatePlayerMovement', (data) => {
    //io.sockets.in(data.room).emit('getPlayersMovementHost', data);
    io.sockets.in(data.room).emit('getAllPlayersMovement', data);
  });

  socket.on('updateAllPlayersMovement', (data) => {
    io.sockets.in(data.room).emit('getAllPlayersMovement', data);
  });

  // these methods update only health of a single player
  socket.on('updatePlayerHealth', (data) => {
    //io.sockets.in(data.room).emit('getPlayersHealthHost', data);
    io.sockets.in(data.room).emit('getAllPlayersHealth', data);
  });

  socket.on('updateAllPlayersHealth', (data) => {
    io.sockets.in(data.room).emit('getAllPlayersHealth', data);
  });

  // These methods update enemies
  socket.on('updateEnemy', (data) => {
    //io.sockets.in(data.room).emit('getEnemyHost', data);
    io.sockets.in(data.room).emit('getAllEnemies', data);
  });

  socket.on('updateAllEnemies', (data) => {
    io.sockets.in(data.room).emit('getAllEnemies', data);
  });

  socket.on('moveToNextStage', (data) => {
    io.sockets.in(data.room).emit('setNextStageHost', data.stage);

    rooms[data.room].distance = (data.stage * 100) - 100;
  });

  socket.on('moveToNextStageAll', (data) => {
    io.sockets.in(data.room).emit('setNextStageAll', data.stage);
  });

  socket.on('healSpell', (data) => {
    console.log('heal spell used');
    io.sockets.in(data.room).emit('healSpellHost', data);
    //io.sockets.in(data.room).emit('healAll', data.players);
  });

  socket.on('healSpellAll', (data) => {
    console.log('healing everyone in the room');
    io.sockets.in(data.room).emit('healAll', data.players);
  });

  socket.on('updateText', (data) => {
    //io.sockets.in(data.room).emit('updateTextHost', data);
    io.sockets.in(data.room).emit('updateTextForAll', data);
  });

  socket.on('updateTextAll', (data) => {
    io.sockets.in(data.room).emit('updateTextForAll', data);
  });
});

console.log('Websocket server started');

// to store the lobby leader
// object roomhost - roomname, and socket leader's username
// all socket.on goes to the host, and emit from the host
// every 3 or 5 seconds, send out a massive world update

// to confirm that move, don't send back to the person who moved, only the others
// ask Slack Socket.io about movement

module.exports.rooms = rooms;

