console.log('game starting');


if(!window.location.hash) {
        window.location = window.location + '#loaded';
        window.location.reload();
}


var socket;

let canvas;
let ctx;
let sendBufferCanvas;
let sendBufferCtx;
let isHost = false;

//const user = `user${(Math.floor((Math.random()*1000)) + 1)}`;
const user = username;

//Game data
let worldWidth = 1366;
let worldHeight = 768;
let stage = 1;

let players = {};
let enemies = {};
//player object definition
/*
  players[user] = 
  {
    lastUpdate,
    position = 
    {
      x,
      y,
      width,
      height
    },
    maxHealth,
    currentHealth,
    dead,
    speed,
    attack,
    level,
    exp,
    maxDistance,
    spritePos = 
    {
      x,
      y,
      width,
      height
    },
    spellCooldown,
    spellPower
  }
*/

/*
  Enemy Coord
  Standing: 2,15,60,85
  Attack1: 110,100,57,95
  Attack2: 165,95,108,98
  Attack3: 378,130,105,62
  Attack4:392,190,96,93
*/
let enemySpritePos = {};
enemySpritePos[1] = {x:2, y:15, width: 60, height: 85};
enemySpritePos[2] = {x:110, y:100, width: 57, height: 95};
enemySpritePos[3] = {x:165, y:95, width: 108, height: 98};
enemySpritePos[4] = {x:378, y:130, width: 105, height: 62};
enemySpritePos[5] = {x:392, y:190, width: 96, height: 93};


const init = () => {
    console.log('init');
  
    socket = io.connect();

    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    //connecting the socket
    socket.on('connect', () => {
        console.log('connecting');

        setupPlayer();
      
        socket.emit('join', {name: user, player:players[user]});     
    });

    socket.on('setHost', (data) => {
      isHost = data;
      console.log("You are the host");
      setupPlayer();
      setupEnemy();
      draw();
    })

    //player updates for host
    socket.on('getPlayersHost', (data) => {
       if(isHost) {
         updatePlayerHost(data);
       }
    });

    socket.on('getAllPlayers', (data) => {
      updatePlayers(data);
    });

    //movement updates for host
    socket.on('getPlayersMovementHost', (data) => {
       if(isHost) {
         updatePlayerMovementHost(data);
       }
    });

    socket.on('getAllPlayersMovement', (data) => {
      updatePlayersMovement(data);
    });

    //health updates for host
    socket.on('getPlayersHealthHost', (data) => {
       if(isHost) {
         updatePlayerHealthHost(data);
       }
    });

    socket.on('getAllPlayersHealth', (data) => {
      updatePlayersHealth(data);
    });

    //enemy updates for host
    socket.on('getEnemyHost', (data) => {
      if(isHost) {
        updateEnemyHost(data);
      }
    });

    socket.on('getAllEnemies', (data) => {
      updateEnemies(data);
    });

    //stage update
    socket.on('setNextStageHost', (data) => {
      if(isHost) {
        //set new stage number to all players
        socket.emit('moveToNextStageAll', data);

        //set all players positions to 1
        let keys = Object.keys(players);
        for(let i = 0; i < keys.length; i++) {
          players[keys[i]].position.x = 0;
        }
        //reset all enemies
        setupEnemy();
        //send out new player positions and enemy info
        let worldData = {players:players, enemies:enemies};
        socket.emit('updateWorldData', worldData);
      }
    });

    socket.on('setNextStageAll', (data) => {
      stage = data;
    })

    socket.on('requestWorldData', (data) => {
      if(isHost) {
        //new player is requesting world data. We need to update
        //our players object with this new player and also 
        //send them world data
        players[data.name] = data.player;

        let worldData = {players:players, enemies:enemies};
        socket.emit('updateWorldData', worldData);
      }
    });

    socket.on('getWorldData', (data) => {
      console.log('getting initial world data');
      players = data.players;
      enemies = data.enemies;
      draw();
    });

    //SPELLS
    socket.on('healSpellHost', (data) => {
      if(isHost) {
        //check if spell power matches what we have
        if(data.power == players[data.name].spellPower) {
          let keys = Object.keys(players);  
          for(var i = 0; i < keys.length; i++) {
            players[keys[i]].currentHealth += data.power;
            if(players[keys[i]].currentHealth > players[keys[i]].maxHealth) {
              players[keys[i]].currentHealth = players[keys[i]].maxHealth;
            }
          }

          socket.emit('healSpellAll', players);
        }
      }
    });

    socket.on('healAll', (data) => {
      for(var i = 0; i < players.length; i++) {
        players[i].currentHealth = data.players[i].currentHealth;
      }
      draw();
    });

    window.addEventListener("keydown", move, true);
};


const move = (e) => {
  console.log("Detected key press");
  if ( e.keyCode == 68 ) {
    const time = new Date().getTime();

    //only move if enough time has occured, otherwise server is overloaded
    if(time - players[user].lastUpdate > 10) {
      players[user].lastUpdate = time;

      //check collision with enemy before emitting
      let isColliding = false;
      let keys = Object.keys(enemies);
      for(let i = 0; i < keys.length; i++)
      {
        const collisionCall = enemies[keys[i]];
        if(!players[user].dead && !enemies[keys[i]].dead && (players[user].position.x + players[user].position.width) > enemies[keys[i]].position.x ) {
          isColliding = true;

          //combat
          players[user].currentHealth -= enemies[keys[i]].attack;

          if(players[user].spritePos.x == 288) {
             players[user].spritePos.x = 384;
          }
          else {
            players[user].spritePos.x = 288;
          }

          if(players[user].currentHealth <= 0) {
            players[user].dead = true;
            players[user].spritePos.x = 0;
            players[user].spritePos.y = 0;
          }
          socket.emit('updatePlayerHealth', {name: user, health: players[user].currentHealth, spritePos: players[user].spritePos});

          //don't update enemy stats if player has died...creates weird bugs if the world is reset same time as enemy is updated with damage
          if(!players[user].dead) {
            enemies[keys[i]].currentHealth -= players[user].attack;
            if(enemies[keys[i]].currentHealth <= 0) {
              enemies[keys[i]].currentHealth = 0;
              enemies[keys[i]].dead = true;

              //gain experience
              players[user].exp += 1;
              if(players[user].exp >= players[user].level) {
                players[user].level += 1;
                players[user].exp = 0;
                players[user].attack += 1;
                players[user].speed += 1;
                players[user].maxHealth += 5;
              }
            }

            //update sprite
            enemies[keys[i]].spritePos++;
            if(enemies[keys[i]].spritePos > 5) {
              enemies[keys[i]].spritePos = 1;
            }

            socket.emit('updateEnemy', {name: keys[i], health:enemies[keys[i]].currentHealth, dead:enemies[keys[i]].dead, spritePos:enemies[keys[i]].spritePos});
          }

          //should I draw here even though server hasn't received update?
          draw();
        }
      }

      if(!isColliding && !players[user].dead) {
        players[user].position.x += players[user].speed;

        //update max distance
        let distance = ((stage-1) * 100) + Math.round((players[user].position.x / worldWidth) * 100);
        if(distance > players[user].maxDistance) {
          players[user].maxDistance = distance;
        }


        //check for reaching end of level
        if(players[user].position.x > worldWidth) {
          players[user].position.x = 0;
          stage += 1;
          socket.emit('moveToNextStage', stage);
        }

        //updte sprite
        if(players[user].spritePos.x == 96) {
          players[user].spritePos.x = 192;
        }
        else {
          players[user].spritePos.x = 96;
        }
        //using movement method for speed up
        socket.emit('updatePlayerMovement', {name: user, position: players[user].position, spritePos: players[user].spritePos});

        //using old method to overwrite entire players array
        //socket.emit('updatePlayer', {name: user, playerInfo: players[user]});

        draw();
      }
    }
  }

  //SPELL
  if ( e.keyCode == 32 ) {
    console.log('Trying to use heal spell');
    const time = new Date().getTime();

    //only move if enough time has occured, otherwise server is overloaded
    if(time - players[user].lastUpdate > players[user].spellCooldown) {
      players[user].lastUpdate = time;

      socket.emit('healSpell', {name: user, power: players[user].spellPower});

    }
  }
};

const setupPlayer = () => {            
    const time = new Date().getTime();
    let x = 0;
    let y = 300;
    let position = {x:x, y:y,width:100,height:100};
    let spritePos = {x:96, y:96, width: 96, height: 96};
    players[user] = {lastUpdate: time, position:position, maxHealth:maxHealth, currentHealth:maxHealth,dead:false,speed:speed,attack:attack,level:level,exp:exp,maxDistance:maxDistance, spritePos:spritePos, spellPower:spellPower, spellCooldown:1};

    //host calls setupplayer twice so don't set another interval
    if(!isHost) {
      window.setInterval(function(){
        if(players[user].currentHealth < players[user].maxHealth && !players[user].dead) {
          players[user].currentHealth += 1;
          socket.emit('updatePlayerHealth', {name: user, health: players[user].currentHealth, spritePos:players[user].spritePos});

          draw();
        }
      }, 1000);
    }
};

const setupEnemy = () => {            
    const time = new Date().getTime();         
    let x = 200;
    let y = 300;

    for(let i = 1; i <= 5; i++) {
        let position = {x:x + (i*200), y:y, width:100, height:100};
        enemies[`enemy${i}`] = {lastUpdate: time, position:position, maxHealth:10*stage, currentHealth:10*stage,dead:false,attack:stage,spritePos:1};
    }
};


const draw = () => {
  ctx.clearRect(0,0,canvas.width, canvas.height);

  //draw data

  //stage and distance
  ctx.fillStyle = "black";
  ctx.font = "36px serif";
  ctx.fillText(`Stage: ${stage}`, 0, 50);
  let distance = Math.round((players[user].position.x / worldWidth) * 100);
  ctx.fillText(`Distance: ${(((stage-1)*100) + distance)}`, 0, 100);
  ctx.fillText(`Max Distance: ${players[user].maxDistance}`, 0, 150);

  //player stats
  ctx.fillText(`Level: ${players[user].level}`, 0, (worldHeight / 2) + 100);
  ctx.fillText(`Exp: ${players[user].exp} / ${players[user].level}`, 0, (worldHeight / 2) + 150);
  ctx.fillText(`Health: ${players[user].currentHealth} / ${players[user].maxHealth}`, 0, (worldHeight / 2) + 200);
  ctx.fillText(`Attack: ${players[user].attack}`, 0, (worldHeight / 2) + 250);
  ctx.fillText(`Speed: ${players[user].speed}`, 0, (worldHeight / 2) + 300);

  //draw the actual players
  let keys = Object.keys(players);            
  console.log(`Drawing ${keys.length} players`);
  for(let i = 0; i < keys.length; i++)
  {
    const drawCall = players[keys[i]];
    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
      drawCall.spritePos.x = 0;
      drawCall.spritePos.y = 0;
    }

    //RECT DRAW
    ctx.fillStyle = "black";
    //ctx.fillRect(drawCall.position.x, drawCall.position.y, drawCall.position.width, drawCall.position.height);

    //IMAGE DRAW
    let image = new Image();           
    image.onload = () => {
        //ctx.save();
        //ctx.globalCompositeOperation = "source-over"; //this is default for canvas
        ctx.drawImage(image, drawCall.spritePos.x, drawCall.spritePos.y, drawCall.spritePos.width, drawCall.spritePos.height, drawCall.position.x, drawCall.position.y, drawCall.position.width, drawCall.position.height);
        //ctx.restorse();
    };           
    image.src = document.location.pathname + '/../assets/img/warrior.png';

    //NAME
    ctx.font = "36px serif";
    ctx.strokeText(keys[i], drawCall.position.x, drawCall.position.y - 50);

    //draw health bar
    ctx.globalAlpha = 1;
    ctx.fillStyle="white";
    ctx.fillRect(drawCall.position.x,drawCall.position.y - 40, drawCall.position.width, 30);
    ctx.fillStyle="black";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y -37 , drawCall.position.width - 6, 24);
    ctx.fillStyle="green";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y - 37,(drawCall.currentHealth / drawCall.maxHealth) * (drawCall.position.width - 6) ,24);
  }

  //draw the enemies
  keys = Object.keys(enemies);
  console.log(`Drawing ${keys.length} enmies`);
  for(let i = 0; i < keys.length; i++)
  {
    const drawCall = enemies[keys[i]];
    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
    }
    ctx.fillStyle = "red";
    //ctx.fillRect(drawCall.position.x, drawCall.position.y, drawCall.position.width, drawCall.position.height);
    let image = new Image();           
    image.onload = () => {
        //ctx.save();
        //ctx.globalCompositeOperation = "source-over"; //this is default for canvas
        ctx.drawImage(image, enemySpritePos[drawCall.spritePos].x, enemySpritePos[drawCall.spritePos].y, enemySpritePos[drawCall.spritePos].width, enemySpritePos[drawCall.spritePos].height, drawCall.position.x, drawCall.position.y, drawCall.position.width, drawCall.position.height);
        //ctx.restorse();
    };           
    image.src = document.location.pathname + '/../assets/img/enemy.png';

    //draw health bar
    ctx.globalAlpha = 1;
    ctx.fillStyle="white";
    ctx.fillRect(drawCall.position.x,drawCall.position.y - 40, drawCall.position.width, 30);
    ctx.fillStyle="black";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y -37 , drawCall.position.width - 6, 24);
    ctx.fillStyle="green";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y - 37,(drawCall.currentHealth / drawCall.maxHealth) * (drawCall.position.width - 6) ,24);
  }
};

const updatePlayerHost = (data) => {
    players[data.name] = data.playerInfo;

    //host has updated player coords, emit back to server to be emitted to all users
    socket.emit('updateAllPlayers', players);
};

const updatePlayers = (data) => {
    players = data;

    draw(); //redraw after we update
};

//MOVEMENT
const updatePlayerMovementHost = (data) => {
    players[data.name].position = data.position;
    players[data.name].spritePos = data.spritePos;

    //host has updated player coords, emit back to server to be emitted to all users
    socket.emit('updateAllPlayersMovement', {name: data.name, position: players[data.name].position, spritePos: players[data.name].spritePos});
};

const updatePlayersMovement = (data) => {
  if(data.name != user) {
    players[data.name].position = data.position;
    players[data.name].spritePos = data.spritePos;

    draw(); //redraw after we update
  }
};

//HEALTH
const updatePlayerHealthHost = (data) => {
    players[data.name].currentHealth = data.health;
    if(players[data.name].currentHealth <= 0) {
      players[data.name].dead = true;
    }

    //update sprites
    players[data.name].spritePos = data.spritePos;

    //host has updated player health, emit back to server to be emitted to all users
    socket.emit('updateAllPlayersHealth', {name: data.name, health: players[data.name].currentHealth, dead: players[data.name].dead, spritePos: players[data.name].spritePos});

    //check if all players are dead
    let keys = Object.keys(players);
    let oneIsAlive = false;
    for(let i = 0; i < keys.length; i++) {
        if(!players[keys[i]].dead) {
          oneIsAlive = true;
          break;
        }
    }
    if(!oneIsAlive) {
      //reset to stage 1 and reset all data and propogate this reset to all users
      let keys = Object.keys(players);
      for(let i = 0; i < keys.length; i++) {
        players[keys[i]].position.x = 0
        players[keys[i]].spritePos.x = 96;
        players[keys[i]].spritePos.y = 96;
        players[keys[i]].currentHealth = players[keys[i]].maxHealth;
        players[keys[i]].dead = false;
      }
      stage = 1;
      setupEnemy();
      let worldData = {players:players, enemies:enemies};
      socket.emit('updateWorldData', worldData);
      socket.emit('moveToNextStageAll', stage);
    }
};

const updatePlayersHealth = (data) => {
  if(data.name != user) {
    players[data.name].currentHealth = data.health;
    players[data.name].dead = data.dead;
    players[data.name].spritePos = data.spritePos;

    draw(); //redraw after we update
  }
};

const updateEnemyHost = (data) => {
  enemies[data.name].currentHealth = data.health;
  if(enemies[data.name].currentHealth <= 0) {
      enemies[data.name].currentHealth = 0;
      enemies[data.name].dead = true;
  }
  enemies[data.name].spritePos = data.spritePos;

  socket.emit('updateAllEnemies', {name: data.name, health: enemies[data.name].currentHealth, dead:enemies[data.name].dead,spritePos:enemies[data.name].spritePos});
};

const updateEnemies = (data) => {
  enemies[data.name].currentHealth = data.health;
  enemies[data.name].dead = data.dead;
  enemies[data.name].spritePos = data.spritePos;

  draw();
};


//window.onload = init;
$(document).ready(init);

window.onbeforeunload = function(){
  //sendAjax('POST', $players[user].serialize());
  
  socket.emit('leave', {name: user, player: players[user], isHost: isHost});
}