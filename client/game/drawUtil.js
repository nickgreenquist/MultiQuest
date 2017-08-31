/*jshint esversion: 6 */

draw = () => {
  ctx.clearRect(0,0,canvas.width, canvas.height);

  //draw the actual players
  let keys = Object.keys(players);   
  for(let i = 0; i < keys.length; i++) {
    const drawCall = players[keys[i]];
    let playerX = (drawCall.position.x / 100) * worldWidth;

    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 1.0;
    }
    
    //WEAPON DRAW
    let weaponWidth = weaponSizes[drawCall.weaponType];
    if(drawCall.isAttacking) {
      weaponWidth *= 1.25;
    }
    let weaponHeight = weaponSizes[drawCall.weaponType];

    let weaponX = playerX + (playerSize / 2);
    let weaponY = playerY - (playerSize * .1) - (weaponSizes[drawCall.weaponType] - playerSize);

    let weaponSrc = weaponImages[drawCall.weaponType];
    if(drawCall.isAttacking) {
      weaponSrc = weaponAttackImages[drawCall.weaponType];
      weaponY += (weaponHeight / 4);
    }
    
    //HANDLE TINTED WEAPONS
    let buffer;
    let bx;
    if(drawCall.color != 'none') {
      buffer = document.createElement('canvas');
      buffer.width = weaponWidth;
      buffer.height = weaponHeight;
      bx = buffer.getContext('2d');

      // fill offscreen buffer with the tint color
      bx.fillStyle = drawCall.color;
      bx.fillRect(0,0,buffer.width,buffer.height);

      // destination atop makes a result with an alpha channel identical to fg, but with all pixels retaining their original color *as far as I can tell*
      bx.globalCompositeOperation = "destination-atop";
      bx.drawImage(weaponSrc, 0,0,weaponWidth, weaponHeight);
    }

    //DRAW THE weapon BASED ON ATTACK STATE
    ctx.drawImage(weaponSrc, weaponX, weaponY, weaponWidth, weaponHeight);

    if (drawCall.color != 'none') {
      //then set the global alpha to the amound that you want to tint it, and draw the buffer directly on top of it.
      ctx.globalAlpha = 0.5;
      ctx.drawImage(buffer, weaponX, weaponY, weaponWidth, weaponHeight);
    }
    ctx.restore();

    //PLAYER DRAW
    let bounceYOffset = drawCall.spritePos === 2 ? -(playerSize / 15) : 0;
    if(drawCall.dead) {
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalAlpha = 1.0;
    }
    let spriteXOffset = 0;
    if (drawCall.isAttacking) {
      spriteXOffset = -5;
    }
    let playerSprite = playerSpritePositions[drawCall.type];
    ctx.drawImage(
      playerImages[drawCall.type], 
      playerSprite[drawCall.spritePos].x + spriteXOffset, 
      playerSprite[drawCall.spritePos].y, 
      playerSprite[drawCall.spritePos].width, 
      playerSprite[drawCall.spritePos].height, 
      playerX,
      playerY + bounceYOffset,
      playerSize, 
      playerSize
    );

    //Name
    if(keys[i] != user) {
      drawStroked(keys[i], playerX, playerY - textSize, textSize);
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
      ctx.fillRect(playerX + 1,playerY - healthBarHeight,(drawCall.currentHealth / drawCall.maxHealthValue) * (playerSize - 2) ,healthBarHeight);
    }
  }

  //SCREEN DATA DRAW
  //player stats
  let barX = worldWidth / 30;
  let barY = worldHeight / 5;
  let barWidth = worldWidth / 4;
  ctx.globalAlpha = 1;
  ctx.fillStyle="white";
  ctx.fillRect(barX,barY, barWidth, playerHealthBarHeight);
  ctx.fillStyle="black";
  ctx.fillRect(barX + 1,barY + 1, barWidth - 2, playerHealthBarHeight - 2);
  ctx.fillStyle="green";
  ctx.fillRect(barX + 1,barY + 1,(players[user].currentHealth / players[user].maxHealthValue) * (barWidth - 2) ,playerHealthBarHeight - 2);
  drawStroked(players[user].currentHealth + '/' + players[user].maxHealthValue, barX, barY - 5, worldHeight / 10);
  
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
        extraWidth = 15 / worldWidth;
        extraX = -20 / worldWidth;
        extraHeight = 5 / worldWidth;
      }
      if(drawCall.type === 1 && drawCall.spritePos == 2) {
        extraWidth = 10 / worldWidth;
        extraX = -10 / worldWidth;
        extraHeight = -20 / worldWidth;
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
    drawStroked(players[user].texts[keys[i]].text, playerX, players[user].texts[keys[i]].y, textSize);
  }
};

drawStroked = (text, x, y, size) => {
  ctx.font = size + "px Sans-serif";
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = 'white';
  ctx.fillText(text, x, y);
};

fadeOut = (text, x, y, width, height, r, g, b, num, time, decrease) => {
  var alpha = 1.0,   // full opacity
      
  interval = setInterval(function () {
    //ctx.clearRect(x,y-height,width,height+10);
    this.draw();
    
    //DRAW TEXT EFFECTS IF ANY EXIST
    let keys = Object.keys(players[user].texts);
    for(let i = 0; i < keys.length; i++) {
      let playerX = (players[user].texts[keys[i]].x / 100) * worldWidth;
      this.drawStroked(players[user].texts[keys[i]].text, playerX, players[user].texts[keys[i]].y, textSize);
    }
      
    alpha = alpha - decrease; // decrease opacity (fade out)
    players[user].texts[num].alpha = alpha;
    y = y - 1;
    players[user].texts[num].y = y;
    if (alpha < 0) {
        //ctx.clearRect(x,y-height,width,height+10);
        clearInterval(interval);
        delete players[user].texts[num];
    }
  }, time); 
};