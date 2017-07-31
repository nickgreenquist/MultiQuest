// @TODO: Clen up spacing in this function

/*jshint esversion: 6 */

define(function () {
  return {
    move: function() {
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
          if(players[user].spritePos == 1) {
            players[user].spritePos = 2;
          }
          else {
            players[user].spritePos = 1;
          }

          //using movement method for speed up
          socket.emit('updatePlayerMovement', {room: players[user].room, name: user, positionX: players[user].position.x, spritePos: players[user].spritePos, isAttacking: players[user].isAttacking});

      }
}
  };
});