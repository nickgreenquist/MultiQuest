/*jshint esversion: 6 */

//Always constant so people playing on different screens are drawn the same way
let enemySize = (worldWidth / 10);
let enemySizePercentage = 10;
let enemyY = worldHeight - (worldWidth / 10) - (worldHeight / 20); 

//ENEMY IMAGES
let enemySpritePositions = [];

let enemySpritePos = {};
enemySpritePos[1] = {x:2, y:15, width: 60, height: 80};
enemySpritePos[2] = {x:125, y:5, width: 65, height: 90};
enemySpritePos[3] = {x:165, y:95, width: 108, height: 98};

let enemySpritePos1 = {};
enemySpritePos1[1] = {x:33, y:2, width: 32, height: 31};
enemySpritePos1[2] = {x:96, y:0, width: 32, height: 22};
enemySpritePos1[3] = {x:0, y:106, width: 31, height: 22};


enemySpritePositions.push(enemySpritePos);
enemySpritePositions.push(enemySpritePos1);

let enemyImages = [];

let enemyImage = new Image();                      
enemyImage.src = document.location.pathname + '/../assets/img/enemies/ogre.png';
let enemyImage1 = new Image();                      
enemyImage1.src = document.location.pathname + '/../assets/img/enemies/bat.png';

enemyImages.push(enemyImage);
enemyImages.push(enemyImage1);

define(function () {
  return { 
    setupEnemy() {            
      const time = new Date().getTime();
      let size = worldWidth / 10;
      let y = worldHeight - size - healthBarHeight;
      let distanceBetween = 15;                //percentage of screen witdh

      let numEnemies = Math.random() * (6 - 2) + 2;

      let newEnemies = {};

      for(let i = 1; i <= numEnemies; i++) {
        let type = Math.floor(Math.random() * 2);
        console.log(type);
        let x = Math.random() * (distanceBetween - (distanceBetween / 4)) + (distanceBetween / 4);
        let position = {x:x + (i*distanceBetween), y:y, width:size, height:size};
        newEnemies[i] = {
          number: i,
          lastUpdate: time, 
          lastSpriteUpdate: time,
          position:position, 
          maxHealth:10*stage, 
          currentHealth:10*stage,
          dead:false,
          attack:stage*5,
          spritePos:1,
          lungeDistance:enemySizePercentage, //percentage of screen
          origX:position.x,
          type: type,
        };
      }
      return newEnemies;
    }
  };
});