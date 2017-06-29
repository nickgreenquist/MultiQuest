console.log('game starting');
console.log(`Color of the sword is ${color}`);
/*
if(!window.location.hash) {
        window.location = window.location + '#loaded';
        window.location.reload();
}
*/

define(function (require) {
    // Load any app-specific modules
    // with a relative require call,
    // like:
    var messages = require('./gameUtil');

    console.log(messages.getHello());
});

//--------------------------------------------- SET UP --------------------------------------------------//
var socket;
let canvas;
let ctx;
let sendBufferCanvas;
let sendBufferCtx;
let isHost = false;

const user = username;

//Game data
let worldWidth = window.innerWidth;
let worldHeight = window.innerHeight / 3;
let stage = 1;
let then = Date.now();
let startTime = Date.now();
let totalEXP = 0;

let players = {};
let enemies = {};

//Always constant so people playing on different screens are drawn the same way
let playerSize = (worldWidth / 10);
let playerSizePercentage = 10;
let playerY = worldHeight - (worldWidth / 10);
let enemySize = (worldWidth / 10);
let enemySizePercentage = 10;
let enemyY = worldHeight - (worldWidth / 10) - (worldHeight / 20); 
let healthBarHeight = (worldHeight / 20);
//x coordinates must be stored and emitted as percentages of screen width


/*
  Enemy Coord
  Standing: 2,15,60,85
  Attack1: 110,100,57,95
  Attack2: 165,95,108,98
  Attack3: 378,130,105,62
  Attack4:392,190,96,93
*/

//ENEMY IMAGES
let enemySpritePositions = [];

let enemySpritePos = {};
enemySpritePos[1] = {x:2, y:15, width: 60, height: 85};
enemySpritePos[2] = {x:125, y:5, width: 65, height: 95};
enemySpritePos[3] = {x:165, y:95, width: 108, height: 98};

let enemySpritePos1 = {};
enemySpritePos1[1] = {x:33, y:2, width: 32, height: 31};
enemySpritePos1[2] = {x:96, y:0, width: 32, height: 22};
enemySpritePos1[3] = {x:0, y:106, width: 31, height: 22};


enemySpritePositions.push(enemySpritePos);
enemySpritePositions.push(enemySpritePos1);

let enemyImages = [];

let enemyImage = new Image();                      
enemyImage.src = document.location.pathname + '/../assets/img/enemy.png';
let enemyImage1 = new Image();                      
enemyImage1.src = document.location.pathname + '/../assets/img/bat.png';

enemyImages.push(enemyImage);
enemyImages.push(enemyImage1);

//PLAYER IMAGE
let playerImage = new Image();                    
playerImage.src = document.location.pathname + '/../assets/img/warrior.png';
let swordImage = new Image();
swordImage.src = document.location.pathname + '/../assets/img/weapon.png';

//PLAYER UPDATE TIME
let moveTimer = 500;
let attackTimer = 1000;
let movementDistance = 1.5; //percentage of screen
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

  ctx.canvas.width = worldWidth;
  ctx.canvas.height = worldHeight;

  //connecting the socket
  socketInit(socket);

  //wire up key presses and touch presses
  window.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("keyup", handleKeyUp, true);
  window.addEventListener("touchstart", handleTouchStart, true);
  window.addEventListener("touchend", handleTouchEnd, true);

  //SKILL POINT BUTTONS
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
  //e.preventDefault();
  var xPos = e.touches[0].pageX;
  players[user].direction = (xPos > ($(window).height() / 2));
  players[user].isMoving = true;
}

const handleTouchEnd = (e) => {
  //e.preventDefault();
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
    if(!enemy.dead && (players[user].position.x + playerSizePercentage) > (enemy.position.x - enemy.lungeDistance)) {
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
  //check collision with enemy before emitting
  if(isColliding) {
    //players[user].position.x -= (2*movementDistance);
  }
  isColliding = false;
  players[user].isAttacking = false;
  
  //GET FIRST ENEMY THAT ISN'T DEAD
  let enemy, key;
  for (key in enemies) {
    enemy = enemies[key];
    if(!enemy.dead) {
      break;
    }
  }

  //Combat
  if(players[user].direction && !players[user].dead && !enemy.dead && (players[user].position.x + playerSizePercentage) > (enemy.origX - 1)) {
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
        fadeOut(players[user].attack, enemy.origX + (enemySizePercentage / 4), enemyY, 50, 100, 0, 0,0, numEffects, 20, .05);
        
        players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 0, blue: 0, text: players[user].attack, width: 50, height: 20, x: enemy.origX + (enemySizePercentage / 4), y: enemy.position.y};
        numEffects++;
        
        //to prevent insanely high key values
        if(numEffects > 25) {
          numEffects = 0;
        }
        
        enemy.currentHealth -= players[user].attack;
        if(enemy.currentHealth <= 0) {
          enemy.currentHealth = 0;
          enemy.dead = true;

          //gain experience
          players[user].exp += stage;
          totalEXP += stage;
          if(players[user].exp >= players[user].level) {
            players[user].points += 5;
            players[user].exp = 0;
            players[user].level++;
            
            fadeOut("LEVEL UP!", players[user].position.x, playerY, 150, 20, 0, 255,0, numEffects, 60, .03);
        
            players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 255, blue: 0, text: "LEVEL UP!", width: 150, height: 20, x: players[user].position.x, y: playerY};
            numEffects++;
          }
        }

        socket.emit('updateEnemy', {room: players[user].room, name: enemy.number, health:enemy.currentHealth, dead:enemy.dead, positionX:enemy.position.x, spritePos:enemy.spritePos});
        
        //update sword combat for others
        socket.emit('updatePlayerMovement', {room: players[user].room, name: user, positionX: players[user].position.x, spritePos: players[user].spritePos, isAttacking: players[user].isAttacking});
      }

      //should I draw here even though server hasn't received update?
      draw();
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
    let distance = ((stage-1) * 100) + players[user].position.x;
    if(distance > players[user].maxDistance) {
      players[user].maxDistance = distance;
    }


    //check for reaching end of level
    if(players[user].position.x > 100) {
      players[user].position.x = 0;
      stage += 1;
      socket.emit('moveToNextStage', {stage: stage, room: players[user].room});
    }

    //check for reacing beginning of level
    if(players[user].position.x < 0) {
      players[user].position.x += movementDistance;
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

    draw();
  }
}

const spell = (time) => {
  socket.emit('healSpell', {room: players[user].room, name: user, power: players[user].spellPower});

  fadeOut(user + " used Heal!", 40, playerY - playerSizePercentage, 250, 20, 0, 255,0, numEffects, 40, .04);
        
  players[user].texts[numEffects] = {alpha: 1.0, red: 0, green: 255, blue: 0, text: user + " HEALED YOU!", width: 250, height: 20, x: 40, y: playerY - playerSizePercentage};
  
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
  for(let i = 0; i < keys.length; i++) {
    const drawCall = players[keys[i]];

    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
      drawCall.spritePos.x = 0;
      drawCall.spritePos.y = 0;
    } else {
      ctx.globalAlpha = 1.0;
    }
    
    //WEAPON DRAW
    let swordWidth = playerSize * .8;
    let swordHeight = playerSize * .8;
    let swordXOffset = playerSize * .45;
    let swordYOffset = playerSize * .2;
    let playerX = (drawCall.position.x / 100) * worldWidth;
    
    //HANDLE TINTED SWORDS
    let buffer;
    let bx;
    if(drawCall.color != 'none') {
      buffer = document.createElement('canvas');
      buffer.width = swordWidth;
      buffer.height = swordHeight;
      bx = buffer.getContext('2d');

      // fill offscreen buffer with the tint color
      bx.fillStyle = drawCall.color;
      bx.fillRect(0,0,buffer.width,buffer.height);

      // destination atop makes a result with an alpha channel identical to fg, but with all pixels retaining their original color *as far as I can tell*
      bx.globalCompositeOperation = "destination-atop";
      bx.drawImage(swordImage, 0,0,swordWidth, swordHeight);
    }

    //DRAW THE SWORD BASED ON ATTACK STATE
    if (drawCall.isAttacking) {
      ctx.save();

      // move to the center of the canvas
      ctx.translate(playerX + swordXOffset,playerY + swordYOffset);
      ctx.translate(swordXOffset,swordXOffset);
      ctx.rotate(Math.PI / 4);

      ctx.drawImage(swordImage, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);
      if (drawCall.color != 'none') {
        //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer, -swordWidth/2, -swordHeight/2, swordWidth, swordHeight);
      }
    } 
    else {
      ctx.drawImage(swordImage, playerX + swordXOffset, playerY, swordWidth, swordHeight);

      if (drawCall.color != 'none') {
        //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer, playerX + swordXOffset, playerY, swordWidth, swordHeight);
      }
    }
    ctx.restore();

    //PLAYER DRAW
    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
      drawCall.spritePos.x = 0;
      drawCall.spritePos.y = 0;
    } else {
      ctx.globalAlpha = 1.0;
    }
    let spriteXOffset = 0;
    if (drawCall.isAttacking) {
      spriteXOffset = 5;
    }
    ctx.drawImage(playerImage, drawCall.spritePos.x + spriteXOffset, drawCall.spritePos.y, drawCall.spritePos.width, drawCall.spritePos.height, playerX, playerY, playerSize, playerSize);

    //Name
    if(keys[i] != user) {
      ctx.font = "36px serif";
      ctx.strokeText(keys[i], playerX, playerY - 50);
    } else {
      //nothing above the player
    }

    //HEALTH BAR
    if(keys[i] != user) {
      ctx.globalAlpha = 1;
      ctx.fillStyle="white";
      ctx.fillRect(playerX,playerY - healthBarHeight - 1, playerSize, healthBarHeight + 2);
      ctx.fillStyle="black";
      ctx.fillRect(playerX + 1,playerY - healthBarHeight , playerSize - 2, healthBarHeight);
      ctx.fillStyle="green";
      ctx.fillRect(playerX + 1,playerY - healthBarHeight,(drawCall.currentHealth / drawCall.maxHealth) * (playerSize - 2) ,healthBarHeight);
    }
  }

  //SCREEN DATA DRAW
  //player stats
  let barX = worldWidth / 30;
  let barY = healthBarHeight;
  let barWidth = worldWidth / 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle="white";
  ctx.fillRect(barX,barY, barWidth, healthBarHeight);
  ctx.fillStyle="black";
  ctx.fillRect(barX + 1,barY + 1, barWidth - 2, healthBarHeight - 2);
  ctx.fillStyle="green";
  ctx.fillRect(barX + 1,barY + 1,(players[user].currentHealth / players[user].maxHealth) * (barWidth - 2) ,healthBarHeight - 2);
  drawStroked(players[user].currentHealth + '/' + players[user].maxHealth, barX, barY - 2, healthBarHeight - 2)

 
  let distance = players[user].position.x.toFixed(1);;
  let diffMs = (Date.now() - startTime);
  let minutes = (((diffMs % 86400000) % 3600000) / 60000);
  document.getElementById("name").innerHTML = user.toString().toUpperCase();
  document.getElementById("level").innerHTML = "LEVEL: " + players[user].level;
  document.getElementById("expavg").innerHTML = (totalEXP / minutes).toFixed(0) + ' EXP/MIN'
  document.getElementById("distance").innerHTML = "DISTANCE: " + distance + 'KM';
  document.getElementById("maxdistance").innerHTML = "MAX DISTANCE: " + (players[user].maxDistance / 100).toFixed(1) + 'KM';
  document.getElementById("time").innerHTML = "PLAY TIME: " + minutes.toFixed(1) + 'MIN';
  document.getElementById("points").innerHTML = players[user].points;
  document.getElementById("health").innerHTML = players[user].maxHealth;
  document.getElementById("attack").innerHTML = players[user].attack;
  document.getElementById("speed").innerHTML = players[user].speed;
  document.getElementById("spell").innerHTML = players[user].spellPower;
  document.getElementById("exp").innerHTML = players[user].exp + " / " + players[user].level;
  
  //ENEMIES
  keys = Object.keys(enemies);
  for(let i = 0; i < keys.length; i++)
  {
    const drawCall = enemies[keys[i]];
    let enemyX = (drawCall.position.x / 100) * worldWidth;
    if(!drawCall.dead) {
      let extraWidth = 0;
      let extraX = 0;
      let extraHeight = 0;

      if(drawCall.type === 0 && drawCall.spritePos == 2) {
        extraWidth = 10;
        extraX = -10;
        extraHeight = 5;
      }
      if(drawCall.type === 1 && drawCall.spritePos == 2) {
        extraWidth = 10;
        extraX = -10;
        extraHeight = -20;
      }
      let enemySprite = enemySpritePositions[drawCall.type];
      ctx.drawImage(enemyImages[drawCall.type], enemySprite[drawCall.spritePos].x, enemySprite[drawCall.spritePos].y, enemySprite[drawCall.spritePos].width, enemySprite[drawCall.spritePos].height, enemyX + extraX, enemyY - extraHeight, enemySize + extraWidth, enemySize + extraHeight);

      //HEALTH BAR
      ctx.globalAlpha = 1;
      ctx.fillStyle="white";
      ctx.fillRect(enemyX,enemyY+ enemySize - 1, enemySize, healthBarHeight + 1);
      ctx.fillStyle="black";
      ctx.fillRect(enemyX + 1,enemyY + enemySize, enemySize - 2, healthBarHeight);
      ctx.fillStyle="red";
      ctx.fillRect(enemyX + 1,enemyY + enemySize,(drawCall.currentHealth / drawCall.maxHealth) * (enemySize - 2) ,healthBarHeight);
    }
  }
  
  
  //DRAW TEXT EFFECTS IF ANY EXIST
  keys = Object.keys(players[user].texts);
  for(let i = 0; i < keys.length; i++) {
    let playerX = (players[user].texts[keys[i]].x / 100) * worldWidth;
    drawStroked(players[user].texts[keys[i]].text, playerX, players[user].texts[keys[i]].y, 50);
  }
};

function drawStroked(text, x, y, size) {
    ctx.font = size + "px Sans-serif"
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);
}

function fadeOut(text, x, y, width, height, r, g, b, num, time, decrease) {
    var alpha = 1.0,   // full opacity
        
    interval = setInterval(function () {
      //ctx.clearRect(x,y-height,width,height+10);
      draw();
      
      //DRAW TEXT EFFECTS IF ANY EXIST
      let keys = Object.keys(players[user].texts);
      for(let i = 0; i < keys.length; i++) {
        let playerX = (players[user].texts[keys[i]].x / 100) * worldWidth;
        drawStroked(players[user].texts[keys[i]].text, playerX, players[user].texts[keys[i]].y, 50);
      }
        
      alpha = alpha - decrease; // decrease opacity (fade out)
      players[user].texts[num].alpha = alpha;
      y = y - 1;
      players[user].texts[num].y = y;
      if (alpha < 0) {
          //ctx.clearRect(x,y-height,width,height+10);
          clearInterval(interval);
          delete players[user].texts[num]
      }
    }, time); 
}


//------------------------------- HELPER FUNCTIONS -------------------------------------------------//
const enemySpriteOffsets = () => {

}

//PLAYER AND ENEMY SETUP FUNCTIONS
const setupPlayer = () => {            
  const time = new Date().getTime();
  let x = 0;
  let size = worldWidth / 10;
  let y = size;
  let position = {x:x, y:y,width:size,height:size};
  let spritePos = {x:96, y:96, width: 96, height: 96};
  players[user] = {
    room: room, 
    lastSpell: time, 
    lastUpdate: time, 
    lastAttack: time,
    isMoving: false, 
    position:position, 
    maxHealth:maxHealth, 
    //maxHealth:21,
    currentHealth:maxHealth,
    //currentHealth:20,
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
  let size = worldWidth / 10;
  let y = worldHeight - size - healthBarHeight;         // 30 is the healthbar 
  let distanceBetween = 15;                //percentage of screen witdh

  let numEnemies = Math.random() * (6 - 2) + 2;

  for(let i = 1; i <= numEnemies; i++) {
      let type = Math.floor(Math.random() * 2);
      console.log(type);
      let x = Math.random() * (distanceBetween - (distanceBetween / 4)) + (distanceBetween / 4);
      let position = {x:x + (i*distanceBetween), y:y, width:size, height:size};
      enemies[i] = {
        number: i,
        lastUpdate: time, 
        lastSpriteUpdate: time,
        position:position, 
        maxHealth:10*stage, 
        currentHealth:10*stage,
        dead:false,
        attack:stage*5,
        spritePos:1,
        lungeDistance:enemySizePercentage / 2, //percentage of screen
        origX:position.x,
        type: type,
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