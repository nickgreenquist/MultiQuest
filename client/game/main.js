define(function (require) {
  console.log('game starting');

  var player = require('./player');
  var enemy = require('./enemy');
  var drawUtil = require('./drawUtil');
  var actions = require('./actions');

  const main = function () {
    update();

    // Request to do this again ASAP
    requestAnimationFrame(main);
  };

  //Stuff that has be set up before game loop starts
  const init = () => {
    socket = io.connect();

    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    ctx.canvas.width = worldWidth;
    ctx.canvas.height = worldHeight;

    //connecting the socket
    socketInit(socket);

    //wire up key presses and touch presses
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("touchstart", handleTouchStart, true);
    window.addEventListener("touchend", handleTouchEnd, true);

    //WIRE BUTTONS
    document.getElementById("heal").addEventListener("click", function(){
      isCasting = true;
    });
    document.getElementById("healthButton").addEventListener("click", function(){
      if(players[user].points > 0) {
        players[user].points--;
        players[user].maxHealth += 5;
        players[user].currentHealth += 5;
        draw();
      }
    });
    document.getElementById("attackButton").addEventListener("click", function(){
      if(players[user].points > 0) {
        players[user].points--;
        players[user].attack++;
        draw();
      }
    });
    document.getElementById("speedButton").addEventListener("click", function(){
      if(players[user].points > 0) {
        players[user].points--;
        players[user].speed++;
        draw();
      }
    });
    document.getElementById("spellButton").addEventListener("click", function(){
      if(players[user].points > 0) {
        players[user].points--;
        players[user].spellPower++;
        draw();
      }
    });
    document.getElementById("quitButton").addEventListener("click", function(){
      quit();

      //logout so progress is saved
      location.href = "/logout";
    });

    //Ready to play
    main();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    var xPos = e.touches[0].pageX;
    players[user].direction = (xPos > (worldWidth / 2));
    players[user].isMoving = true;
  }

  const handleTouchEnd = (e) => {
    e.preventDefault();
    players[user].isMoving = false;
  }

  const handleKeyDown = (e) => {
    if(e.keyCode == 68) {
      players[user].direction = true;
      players[user].isMoving = true;
    }
    if(e.keyCode == 65) {
      players[user].direction = false;
      players[user].isMoving = true;
    }
    if(e.keyCode == 32) {
      isCasting = true;
    }
  }

  const handleKeyUp = (e) => {
    if(e.keyCode == 68) {
      players[user].isMoving = false;
    }
    if(e.keyCode == 65) {
      players[user].isMoving = false;
    }
  }

  const update = (modifier) => {
    let time = new Date().getTime();

    // CHECK FOR MOVEMENT
    let isMoving = false;
    try {
      isMoving = players[user].isMoving;
    } catch (e) {
      // player not set up yet
    }
    
    // Based on input, update game accordingly
    if (isMoving) {
      //only move if enough time has occured, otherwise server is overloaded
      let timePassed = time - players[user].lastUpdate;
      let speed = moveTimer / (Math.log(players[user].speed));

      //make sword go back up, always half the time before next move call is made 
      if(timePassed > speed / 2) {
        players[user].isAttacking = false;
        socket.emit('updatePlayerMovement', {room: players[user].room, name: user, positionX: players[user].position.x, spritePos: players[user].spritePos, isAttacking: players[user].isAttacking});
        draw();
      }
      if(timePassed > speed) {
        players[user].lastUpdate = time;
        move();
      }
    }

    // CHECK FOR SPELL CAST
    if (isCasting) {
      //only cast if enough time has occured, otherwise server is overloaded
      if(time - players[user].lastSpell > players[user].spellCooldown && !players[user].dead) {
        players[user].lastSpell = time;
        spell();
      }
      isCasting = false;
    }

    // CHECK ENEMY UPDATES
    let keys = Object.keys(enemies);
    for(let i = 0; i < keys.length; i++)
    {
      const enemy = enemies[keys[i]];

      //MOVE IN PLACE
      if(!enemy.dead) {
        let timePassed = time - enemy.lastSpriteUpdate;
        if(timePassed > 500) {
          enemy.lastSpriteUpdate = time;
          if(enemy.spritePos == 1) {
            enemy.spritePos = 2;
          }
          else if(enemy.spritePos == 2) {
            enemy.spritePos = 1;
          }
          draw();
        }
      }

      //ATTACK
      if(!enemy.dead && (players[user].position.x + (playerSizePercentage / 2)) > (enemy.position.x - enemy.lungeDistance)) {
        let timePassed = time - enemy.lastUpdate;
        if(timePassed > 200) {
          if(enemy.position.x == enemy.origX && timePassed > 1000 && !players[user].dead) {
            enemy.lastUpdate = time;
            enemy.position.x -= enemy.lungeDistance;
            enemies[keys[i]].spritePos = 3;

            socket.emit('updateEnemy', {room: players[user].room, name: keys[i], health:enemies[keys[i]].currentHealth, dead:enemies[keys[i]].dead, positionX:enemies[keys[i]].position.x, spritePos:enemies[keys[i]].spritePos});

            //Update Health and Check Death
            players[user].currentHealth -= enemies[keys[i]].attack;
            if(players[user].currentHealth <= 0) {
              players[user].dead = true;
              players[user].spritePos = 3;
              players[user].currentHealth = 0;
            }
            socket.emit('updatePlayerHealth', {room: players[user].room, name: user, health: players[user].currentHealth,dead: players[user].dead, spritePos: players[user].spritePos});

            //draw damage
            fadeOut(enemies[keys[i]].attack, players[user].position.x + (playerSizePercentage / 2), playerY, 50, 100, 255, 0,0, numEffects, 20, .05);        
            players[user].texts[numEffects] = {alpha: 1.0, red: 255, green: 0, blue: 0, text:enemies[keys[i]].attack, width: 50, height: 20, x: players[user].position.x + (playerSizePercentage / 2), y: playerY};       
            numEffects++;

            draw();

          } else if(enemy.position.x < enemy.origX) {
            enemy.position.x = enemy.origX;
            enemies[keys[i]].spritePos = 1;
            socket.emit('updateEnemy', {room: players[user].room, name: keys[i], health:enemies[keys[i]].currentHealth, dead:enemies[keys[i]].dead, positionX:enemies[keys[i]].position.x, spritePos:enemies[keys[i]].spritePos});
            
            draw();
          }
        }
      }
    }
  }

  const move = () => {
    actions.move();
    draw();
  }

  const spell = (time) => {
    socket.emit('healSpell', {room: players[user].room, name: user, power: players[user].spellPower});

    fadeOut(user + " used Heal!", 40, playerY - playerSizePercentage, 250, 20, 0, 255,0, numEffects, 40, .04);
          
    players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 255, blue: 0, text: user.toUpperCase() + " HEALED YOU!", width: 250, height: 20, x: 40, y: playerY - playerSizePercentage};
    
    //emit the text effect
    socket.emit('updateText', {room: players[user].room, effect: players[user].texts[numEffects], name: user});
                                
    numEffects++;
    
    players[user].currentHealth += players[user].spellPower;
    if(players[user].currentHealth > players[user].maxHealth) {
      players[user].currentHealth = players[user].maxHealth;
    }
    draw();
  }

  //PLAYER AND ENEMY SETUP FUNCTIONS
  const setupPlayer = () => {            
    players[user] = player.setupPlayer();

    //host calls setupplayer twice so don't set another interval
    if(!isHost) {
      window.setInterval(function(){
        if(players[user].currentHealth < players[user].maxHealth && !players[user].dead) {
          players[user].currentHealth += 5;
          if(players[user].currentHealth > players[user].maxHealth) {
            players[user].currentHealth = players[user].maxHealth;
          }
          socket.emit('updatePlayerHealth', {room: players[user].room, name: user, health: players[user].currentHealth, spritePos: players[user].spritePos});

          draw();
        }
      }, 5000);
    }
  };

  const setupEnemy = () => {            
    enemies = enemy.setupEnemy();
  };

  //SOCKET UPDATE FUNCTIONS
  const updatePlayerHost = (data) => {
      players[data.name] = data.playerInfo;

      //host has updated player coords, emit back to server to be emitted to all users
      socket.emit('updateAllPlayers', {players: players, room: players[user].room});
  };

  const updatePlayers = (data) => {
      players = data;

      draw(); //redraw after we update
  };

  //MOVEMENT
  const updatePlayerMovementHost = (data) => {
      players[data.name].position = data.position;
      players[data.name].spritePos = data.spritePos;
      players[data.name].isAttacking = data.isAttacking;

      //host has updated player coords, emit back to server to be emitted to all users
      socket.emit('updateAllPlayersMovement', {room: players[user].room, name: data.name, position: players[data.name].position, spritePos: players[data.name].spritePos, isAttacking: players[data.name].isAttacking});
  };

  const updatePlayersMovement = (data) => {
    if(data.name != user) {
      players[data.name].position.x = data.positionX;
      players[data.name].spritePos = data.spritePos;
      players[data.name].isAttacking = data.isAttacking;

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
      socket.emit('updateAllPlayersHealth', {room: players[user].room, name: data.name, health: players[data.name].currentHealth, dead: players[data.name].dead, spritePos: players[data.name].spritePos});

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

    socket.emit('updateAllEnemies', {room: players[user].room, name: data.name, health: enemies[data.name].currentHealth, dead:enemies[data.name].dead,spritePos:enemies[data.name].spritePos});
  };

  const updateEnemies = (data) => {
    enemies[data.name].currentHealth = data.health;
    enemies[data.name].dead = data.dead;
    enemies[data.name].position.x = data.positionX;
    enemies[data.name].spritePos = data.spritePos;

    draw();
  };


  // SOCKET SETUP FUNCTION
  const socketInit = (socket) => {
    socket.on('connect', () => {
        console.log('connecting');

        setupPlayer();
        
        socket.emit('join', {name: user, player:players[user], room: room});     
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
        socket.emit('moveToNextStageAll', {room: players[user].room, stage: data});

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
        let keys = Object.keys(players);  
        for(var i = 0; i < keys.length; i++) {
          players[keys[i]].currentHealth += data.power;
          if(players[keys[i]].currentHealth > players[keys[i]].maxHealth) {
            players[keys[i]].currentHealth = players[keys[i]].maxHealth;
          }
        }

        socket.emit('healSpellAll', {room: players[user].room, players: players});
        draw();
      }
    });

    socket.on('healAll', (data) => {
      let keys = Object.keys(data); 
      for(var i = 0; i < keys.length; i++) {
        if( !(data.name === user && data.name === keys[i])) {
          players[keys[i]].currentHealth = data[keys[i]].currentHealth;
        }
      }
      draw();
    });

    socket.on('updateTextHost', (data) => {
      if(isHost) {
        socket.emit('updateTextAll', data);
      }
    });

    socket.on('updateTextForAll', (data) => {
      if(data.name != user) {
        players[user].texts[numEffects] = data.effect;
        fadeOut(data.effect.text, data.effect.x, data.effect.y, data.effect.width, data.effect.height, data.effect.red, data.effect.green, data.effect.blue,  numEffects, 20, .05);
        numEffects++;
      }
    });
  };

  //QUIT
  const quit = () => {
    let tempRoom = players[user].room;
    let tempPlayer = players[user];
    delete players[user];
    socket.emit('updateAllPlayers', {players: players, room: tempRoom});
    socket.emit('leave', {name: user, player: tempPlayer, isHost: isHost, room: tempRoom});
  }


  //ALWAYS PLACE THIS AT END OF FILE
  $(document).ready(init);

  window.onbeforeunload = function(){
    quit();
  }
});