
draw = () => {
  ctx.clearRect(0,0,canvas.width, canvas.height);

  //draw the actual players
  let keys = Object.keys(players);   
  for(let i = 0; i < keys.length; i++) {
    const drawCall = players[keys[i]];

    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
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
    } else {
      ctx.globalAlpha = 1.0;
    }
    let spriteXOffset = 0;
    if (drawCall.isAttacking) {
      spriteXOffset = 5;
    }
    let playerSprite = playerSpritePositions[drawCall.type];
    ctx.drawImage(
      playerImages[drawCall.type], 
      playerSprite[drawCall.spritePos].x + spriteXOffset, 
      playerSprite[drawCall.spritePos].y, 
      playerSprite[drawCall.spritePos].width, 
      playerSprite[drawCall.spritePos].height, 
      playerX, playerY, playerSize, playerSize
    );

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
  let barY = worldHeight / 10;;
  let barWidth = worldWidth / 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle="white";
  ctx.fillRect(barX,barY, barWidth, healthBarHeight);
  ctx.fillStyle="black";
  ctx.fillRect(barX + 1,barY + 1, barWidth - 2, healthBarHeight - 2);
  ctx.fillStyle="green";
  ctx.fillRect(barX + 1,barY + 1,(players[user].currentHealth / players[user].maxHealth) * (barWidth - 2) ,healthBarHeight - 2);
  drawStroked(players[user].currentHealth + '/' + players[user].maxHealth, barX, barY - 5, worldHeight / 15)


  let distance = (players[user].position.x / 100).toFixed(1);;
  let diffMs = (Date.now() - startTime);
  let minutes = (((diffMs % 86400000) % 3600000) / 60000);
  document.getElementById("name").innerHTML = user.toString().toUpperCase();
  document.getElementById("level").innerHTML = players[user].level;
  document.getElementById("expavg").innerHTML = (totalEXP / minutes).toFixed(0);
  document.getElementById("distance").innerHTML =  distance + 'KM';
  document.getElementById("maxdistance").innerHTML = (players[user].maxDistance / 100).toFixed(1) + 'KM';
  document.getElementById("time").innerHTML = minutes.toFixed(1) + 'MIN';
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
        extraWidth = 15;
        extraX = -20;
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
}

drawStroked = (text, x, y, size) => {
  ctx.font = size + "px Sans-serif"
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = 'white';
  ctx.fillText(text, x, y);
}

fadeOut = (text, x, y, width, height, r, g, b, num, time, decrease) => {
  var alpha = 1.0,   // full opacity
      
  interval = setInterval(function () {
    //ctx.clearRect(x,y-height,width,height+10);
    this.draw();
    
    //DRAW TEXT EFFECTS IF ANY EXIST
    let keys = Object.keys(players[user].texts);
    for(let i = 0; i < keys.length; i++) {
      let playerX = (players[user].texts[keys[i]].x / 100) * worldWidth;
      this.drawStroked(players[user].texts[keys[i]].text, playerX, players[user].texts[keys[i]].y, 50);
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