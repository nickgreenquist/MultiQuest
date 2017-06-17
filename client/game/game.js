console.log('game starting');
console.log(`Color of the sword is ${color}`);
/*
if(!window.location.hash) {
        window.location = window.location + '#loaded';
        window.location.reload();
}
*/

//--------------------------------------------- SET UP --------------------------------------------------//
var socket;
let canvas;
let ctx;
let sendBufferCanvas;
let sendBufferCtx;
let isHost = false;

const user = username;

//Game data
let worldWidth = 1366;
let worldHeight = 768;
let stage = 1;
let then = Date.now();

let players = {};
let enemies = {};

/*
  Enemy Coord
  Standing: 2,15,60,85
  Attack1: 110,100,57,95
  Attack2: 165,95,108,98
  Attack3: 378,130,105,62
  Attack4:392,190,96,93
*/

//ENEMY IMAGE
let enemySpritePos = {};
enemySpritePos[1] = {x:2, y:15, width: 60, height: 85};
enemySpritePos[2] = {x:110, y:100, width: 57, height: 95};
enemySpritePos[3] = {x:165, y:95, width: 108, height: 98};
enemySpritePos[4] = {x:378, y:130, width: 105, height: 62};
enemySpritePos[5] = {x:392, y:190, width: 96, height: 93};
enemySpritePos[6] = {x:125, y:5, width: 65, height: 95};

let enemyImage = new Image();                      
enemyImage.src = document.location.pathname + '/../assets/img/enemy.png';

//PLAYER IMAGE
let playerImage = new Image();                    
playerImage.src = document.location.pathname + '/../assets/img/warrior.png';
let swordImage = new Image();
swordImage.src = document.location.pathname + '/../assets/img/weapon.png';

//PLAYER UPDATE TIME
let moveTimer = 300;
let attackTimer = 1000;
let movementDistance = 20;
let isColliding = false;
let isCasting = false;
let numEffects = 0;
//let rgbstep = 0;

//--------------------------------------------- GAME LOGIC --------------------------------------------------//
var main = function () {
  update();

  /*
  var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	//render();

	then = now;
  */

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

//Stuff that has be set up before game loop starts
const init = () => {
  console.log('init');

  socket = io.connect();

  canvas = document.querySelector("#canvas");
  ctx = canvas.getContext("2d");

  //connecting the socket
  socketInit(socket);

  //wire up key presses and touch presses
  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("touchstart", handleTouchStart, true);
  window.addEventListener("touchend", handleTouchEnd, true);

  //SKILL POINT BUTTONS
  document.getElementById("health").addEventListener("click", function(){
    if(players[user].points > 0) {
      players[user].points--;
      players[user].maxHealth += 5;
      players[user].currentHealth += 5;
      draw();
    }
  });
  document.getElementById("attack").addEventListener("click", function(){
    if(players[user].points > 0) {
      players[user].points--;
      players[user].attack++;
      draw();
    }
  });
  document.getElementById("speed").addEventListener("click", function(){
    if(players[user].points > 0) {
      players[user].points--;
      players[user].speed++;
      draw();
    }
  });
  document.getElementById("spell").addEventListener("click", function(){
    if(players[user].points > 0) {
      players[user].points--;
      players[user].spellPower++;
      draw();
    }
  });
  document.getElementById("quit").addEventListener("click", function(){
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
  players[user].direction = (xPos > ($(window).height() / 2));
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
          enemy.spritePos = 6;
        }
        else if(enemy.spritePos == 6) {
          enemy.spritePos = 1;
        }
        draw();
      }
    }

    //ATTACK
    if(!enemy.dead && (players[user].position.x + players[user].position.width) > (enemy.position.x - enemy.lungeDistance)) {
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
            players[user].spritePos.x = 0;
            players[user].spritePos.y = 0;
            players[user].currentHealth = 0;
          }
          socket.emit('updatePlayerHealth', {room: players[user].room, name: user, health: players[user].currentHealth, spritePos: players[user].spritePos});

          //draw damage
          fadeOut(enemies[keys[i]].attack, players[user].position.x + 25, players[user].position.y - 85, 50, 100, 255, 0,0, numEffects, 20, .05);        
          players[user].texts[numEffects] = {alpha: 1.0, red: 255, green: 0, blue: 0, text:enemies[keys[i]].attack, width: 50, height: 20, x: players[user].position.x + 25, y: players[user].position.y - 85};       
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
  //check collision with enemy before emitting
  if(isColliding) {
    //players[user].position.x -= (2*movementDistance);
  }
  isColliding = false;
  players[user].isAttacking = false;
  let keys = Object.keys(enemies);
  for(let i = 0; i < keys.length; i++)
  {
    const collisionCall = enemies[keys[i]];

    //Combat
    if(players[user].direction && !players[user].dead && !collisionCall.dead && (players[user].position.x + players[user].position.width) > (collisionCall.origX - 15)) {
      isColliding = true;

      //don't update enemy stats if player has died...creates weird bugs if the world is reset same time as enemy is updated with damage
      if(!players[user].dead) {

        let time = new Date().getTime();
        let timePassed = time - players[user].lastAttack;
        let speed = attackTimer / Math.log(players[user].speed);
        if(timePassed > speed) {
          players[user].lastAttack = time;
          players[user].isAttacking = true;
        
          //draw damage
          fadeOut(players[user].attack, enemies[keys[i]].position.x + 25, enemies[keys[i]].position.y - 50, 50, 100, 0, 0,0, numEffects, 20, .05);
          
          players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 0, blue: 0, text: players[user].attack, width: 50, height: 20, x: enemies[keys[i]].position.x + 25, y: enemies[keys[i]].position.y - 50};
          numEffects++;
          
          //to prevent insanely high key values
          if(numEffects > 25) {
            numEffects = 0;
          }
          
          enemies[keys[i]].currentHealth -= players[user].attack;
          if(enemies[keys[i]].currentHealth <= 0) {
            enemies[keys[i]].currentHealth = 0;
            enemies[keys[i]].dead = true;

            //gain experience
            players[user].exp += stage;
            if(players[user].exp >= players[user].level) {
              players[user].points += 5;
              players[user].exp = 0;
              players[user].level++;
              
              fadeOut("LEVEL UP!", players[user].position.x, players[user].position.y - 85, 150, 20, 0, 255,0, numEffects, 60, .03);
          
              players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 255, blue: 0, text: "LEVEL UP!", width: 150, height: 20, x: players[user].position.x, y: players[user].position.y - 85};
              numEffects++;
            }
          }

          socket.emit('updateEnemy', {room: players[user].room, name: keys[i], health:enemies[keys[i]].currentHealth, dead:enemies[keys[i]].dead, positionX:enemies[keys[i]].position.x, spritePos:enemies[keys[i]].spritePos});
          
          //update sword combat for others
          socket.emit('updatePlayerMovement', {room: players[user].room, name: user, positionX: players[user].position.x, spritePos: players[user].spritePos, isAttacking: players[user].isAttacking});
        }

        //should I draw here even though server hasn't received update?
        draw();
        }
    }
  }

  //Moving
  if(!isColliding && !players[user].dead) {
    console.log("moving");
    players[user].isAttacking = false;
    
    if(players[user].direction) {
      players[user].position.x += movementDistance;
    }
    else {
      players[user].position.x -= movementDistance;
    }

    //update max distance
    let distance = ((stage-1) * 100) + Math.round((players[user].position.x / worldWidth) * 100);
    if(distance > players[user].maxDistance) {
      players[user].maxDistance = distance;
    }


    //check for reaching end of level
    if(players[user].position.x > worldWidth) {
      players[user].position.x = 0;
      stage += 1;
      socket.emit('moveToNextStage', {stage: stage, room: players[user].room});
    }

    //updte sprite
    if(players[user].spritePos.x == 96) {
      players[user].spritePos.y += 5;
      players[user].spritePos.x = 192;
    }
    else {
      players[user].spritePos.y -= 5;
      players[user].spritePos.x = 96;
    }

    //using movement method for speed up
    socket.emit('updatePlayerMovement', {room: players[user].room, name: user, positionX: players[user].position.x, spritePos: players[user].spritePos, isAttacking: players[user].isAttacking});

    //using old method to overwrite entire players array
    //socket.emit('updatePlayer', {name: user, playerInfo: players[user]});

    draw();
  }
}

const spell = (time) => {
  socket.emit('healSpell', {room: players[user].room, name: user, power: players[user].spellPower});
  
  fadeOut(user + " used Heal!", worldWidth/2 - 150, worldHeight/2 - 200, 250, 20, 0, 255,0, numEffects, 40, .04);
        
  players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 255, blue: 0, text: user + " used Heal!", width: 250, height: 20, x: worldWidth/2 - 150, y: worldHeight/2 - 200};
  
  //emit the text effect
  socket.emit('updateText', {room: players[user].room, effect: players[user].texts[numEffects], name: user});
                              
  numEffects++;
  
  players[user].currentHealth += players[user].spellPower;
  if(players[user].currentHealth > players[user].maxHealth) {
    players[user].currentHealth = players[user].maxHealth;
  }
  draw();
}

const draw = () => {
  ctx.clearRect(0,0,canvas.width, canvas.height);

  //draw the actual players
  let keys = Object.keys(players);   
  for(let i = 0; i < keys.length; i++)
  {
    const drawCall = players[keys[i]];

    ctx.globalAlpha = 1.0;
    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
      drawCall.spritePos.x = 0;
      drawCall.spritePos.y = 0;
    }
    
    //WEAPON DRAW
    let swordWidth = 80;
    let swordHeight = 80;
    if(drawCall.color != 'none') {
      // create offscreen buffer, 
      let buffer = document.createElement('canvas');
      buffer.width = swordWidth;
      buffer.height = swordHeight;
      let bx = buffer.getContext('2d');

      // fill offscreen buffer with the tint color
      bx.fillStyle = drawCall.color;
      bx.fillRect(0,0,buffer.width,buffer.height);

      // destination atop makes a result with an alpha channel identical to fg, but with all pixels retaining their original color *as far as I can tell*
      bx.globalCompositeOperation = "destination-atop";
      bx.drawImage(swordImage, 0,0,swordWidth, swordHeight);
    
      if(drawCall.isAttacking) {

        // save the unrotated context of the canvas so we can restore it later
        // the alternative is to untranslate & unrotate after drawing
        ctx.save();
        
        //ctx.clearRect(0,0,worldWidth,worldHeight);

        // move to the center of the canvas
        ctx.translate(drawCall.position.x + 45,drawCall.position.y + 20);
        ctx.translate(40,40);

        // rotate the canvas to the specified degrees
        ctx.rotate(Math.PI / 4);

        // draw the image
        // since the context is rotated, the image will be rotated also
        //ctx.drawImage(image,-image.width/2,-image.width/2);
        // to tint the image, draw it first
        ctx.drawImage(swordImage, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);

        //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);

        // we’re done with the rotating so restore the unrotated context
        ctx.restore();
      }
      else {
        // to tint the image, draw it first
        ctx.drawImage(swordImage, drawCall.position.x + 45, drawCall.position.y, swordWidth, swordHeight);

        //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer,drawCall.position.x + 45, drawCall.position.y, swordWidth, swordHeight);
      }
    }
    else {
      if(drawCall.isAttacking) {

          // save the unrotated context of the canvas so we can restore it later
          // the alternative is to untranslate & unrotate after drawing
          ctx.save();
        
          //ctx.clearRect(0,0,worldWidth,worldHeight);

          // move to the center of the canvas
          ctx.translate(drawCall.position.x + 45,drawCall.position.y + 20);
          ctx.translate(40,40);

          // rotate the canvas to the specified degrees
          ctx.rotate(Math.PI / 4);

          // draw the image
          // since the context is rotated, the image will be rotated also
          //ctx.drawImage(image,-image.width/2,-image.width/2);
          // to tint the image, draw it first
          ctx.drawImage(swordImage, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);

          // we’re done with the rotating so restore the unrotated context
          ctx.restore();
        }
      else {
        ctx.drawImage(swordImage, drawCall.position.x + 45, drawCall.position.y, swordWidth, swordHeight);
      }
    }

    //PLAYER DRAW
    ctx.drawImage(playerImage, drawCall.spritePos.x, drawCall.spritePos.y, drawCall.spritePos.width, drawCall.spritePos.height, drawCall.position.x, drawCall.position.y, drawCall.position.width, drawCall.position.height);

    //NAME
    ctx.font = "36px serif";
    ctx.strokeText(keys[i], drawCall.position.x, drawCall.position.y - 50);

    //HEALTH BAR
    ctx.globalAlpha = 1;
    ctx.fillStyle="white";
    ctx.fillRect(drawCall.position.x,drawCall.position.y - 40, drawCall.position.width, 30);
    ctx.fillStyle="black";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y -37 , drawCall.position.width - 6, 24);
    ctx.fillStyle="green";
    ctx.fillRect(drawCall.position.x + 3,drawCall.position.y - 37,(drawCall.currentHealth / drawCall.maxHealth) * (drawCall.position.width - 6) ,24);
  }

  //SCREEN DATA DRAW
  //stage and distance
  ctx.fillStyle = "black";
  ctx.font = "36px serif";
  ctx.fillText(`Stage: ${stage}`, 0, 50);
  let distance = Math.round((players[user].position.x / worldWidth) * 100);
  ctx.fillText(`Distance: ${(((stage-1)*100) + distance)}`, 0, 100);
  ctx.fillText(`Max Distance: ${players[user].maxDistance}`, 0, 150);

  //player stats
  ctx.font = "30px serif";
  ctx.fillText(`Level: ${players[user].level}`, 30, (worldHeight / 2) + 40);
  ctx.fillText(`Exp: ${players[user].exp} / ${players[user].level}`, 30, (worldHeight / 2) + 80);
  ctx.fillText(`Skill Points: ${players[user].points}`, 30, (worldHeight / 2) + 120);
  ctx.fillText(`Health: ${players[user].currentHealth} / ${players[user].maxHealth}`, 30, (worldHeight / 2) + 160);
  ctx.fillText(`Attack: ${players[user].attack}`, 30, (worldHeight / 2) + 200);
  ctx.fillText(`Speed: ${players[user].speed}`, 30, (worldHeight / 2) + 240);
  ctx.fillText(`Spell Power: ${players[user].spellPower}`, 30, (worldHeight / 2) + 280);
  
  //ENEMIES
  keys = Object.keys(enemies);
  for(let i = 0; i < keys.length; i++)
  {
    const drawCall = enemies[keys[i]];
    if(!drawCall.dead) {
      let extraWidth = 0;
      let extraX = 0;
      let extraHeight = 0;

      if(drawCall.spritePos == 4) {
        extraWidth = 50;
        extraX = -50;
      }
      if(drawCall.spritePos == 5) {
        extraWidth = 50;
        extraX = -50;
        extraHeight = 25
      }
      if(drawCall.spritePos == 6) {
        extraWidth = 10;
        extraX = -10;
        extraHeight = 5
      }
      ctx.drawImage(enemyImage, enemySpritePos[drawCall.spritePos].x, enemySpritePos[drawCall.spritePos].y, enemySpritePos[drawCall.spritePos].width, enemySpritePos[drawCall.spritePos].height, drawCall.position.x + extraX, drawCall.position.y - extraHeight, drawCall.position.width + extraWidth, drawCall.position.height + extraHeight);

      //HEALTH BAR
      ctx.globalAlpha = 1;
      ctx.fillStyle="white";
      ctx.fillRect(drawCall.position.x,drawCall.position.y + 97, drawCall.position.width, 30);
      ctx.fillStyle="black";
      ctx.fillRect(drawCall.position.x + 3,drawCall.position.y + 100, drawCall.position.width - 6, 24);
      ctx.fillStyle="red";
      ctx.fillRect(drawCall.position.x + 3,drawCall.position.y + 100,(drawCall.currentHealth / drawCall.maxHealth) * (drawCall.position.width - 6) ,24);
    }
  }
  
  
  //DRAW TEXT EFFECTS IF ANY EXIST
  keys = Object.keys(players[user].texts);
  for(let i = 0; i < keys.length; i++) {
    ctx.fillStyle = "rgba(" + players[user].texts[keys[i]].red + ", " + players[user].texts[keys[i]].green + ", " + players[user].texts[keys[i]].blue + ", " + players[user].texts[keys[i]].alpha + ")";
    ctx.font = "italic 30pt Arial";
    ctx.fillText(players[user].texts[keys[i]].text, players[user].texts[keys[i]].x, players[user].texts[keys[i]].y);
  }
};

function fadeOut(text, x, y, width, height, r, g, b, num, time, decrease) {
    var alpha = 1.0,   // full opacity
        
    interval = setInterval(function () {
      ctx.clearRect(x,y-height,width,height+10);
      
      //draw other texts
      //DRAW TEXT EFFECTS IF ANY EXIST
      let keys = Object.keys(players[user].texts);
      for(let i = 0; i < keys.length; i++) {
        ctx.fillStyle = "rgba(" + players[user].texts[keys[i]].red + ", " + players[user].texts[keys[i]].green + ", " + players[user].texts[keys[i]].blue + ", " + players[user].texts[keys[i]].alpha + ")";
        ctx.font = "italic 30pt Arial";
        ctx.fillText(players[user].texts[keys[i]].text, players[user].texts[keys[i]].x, players[user].texts[keys[i]].y);
      }
      
      
      alpha = alpha - decrease; // decrease opacity (fade out)
      players[user].texts[num].alpha = alpha;
      y = y - 1;
      players[user].texts[num].y = y;
      if (alpha < 0) {
          ctx.clearRect(x,y-height,width,height+10);
          clearInterval(interval);
          delete players[user].texts[num]
      }
    }, time); 
}


//------------------------------- HELPER FUNCTIONS -------------------------------------------------//

//PLAYER AND ENEMY SETUP FUNCTIONS
const setupPlayer = () => {            
  const time = new Date().getTime();
  let x = 0;
  let y = 300;
  let position = {x:x, y:y,width:100,height:100};
  let spritePos = {x:96, y:96, width: 96, height: 96};
  players[user] = {
    room: room, 
    lastSpell: time, 
    lastUpdate: time, 
    lastAttack: time,
    isMoving: false, 
    position:position, 
    //maxHealth:maxHealth, 
    maxHealth:21,
    //currentHealth:maxHealth,
    currentHealth:20,
    dead:false,
    speed:speed,
    //attack:attack,
    attack:1,
    level:level,
    exp:exp,
    points:points,
    maxDistance:maxDistance, 
    spritePos:spritePos, 
    spellPower:spellPower, 
    spellCooldown:1000, 
    isAttacking:false, 
    color: color, 
    texts: {},
    direction: true,
  };

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
  const time = new Date().getTime();         
  let x = 200;
  let y = 300;

  for(let i = 1; i <= 5; i++) {
      let position = {x:x + (i*200), y:y, width:100, height:100};
      enemies[`enemy${i}`] = {
        lastUpdate: time, 
        lastSpriteUpdate: time,
        position:position, 
        maxHealth:10*stage, 
        currentHealth:10*stage,
        dead:false,
        attack:stage*5,
        spritePos:1,
        lungeDistance:50,
        origX:position.x,
      };
  }
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
  delete players[user];
  socket.emit('updateAllPlayers', {players: players, room: tempRoom});
  socket.emit('leave', {name: user, player: players[user], isHost: isHost, room: tempRoom});
}


//ALWAYS PLACE THIS AT END OF FILE
$(document).ready(init);

window.onbeforeunload = function(){
  quit();
}