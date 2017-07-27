let playerSize = (worldWidth / 10);
let playerSizePercentage = 10;
let playerY = worldHeight - (worldWidth / 10) - (worldHeight / 20);
let playerHealthBarHeight = (worldHeight / 20);

//PLAYER IMAGE
let playerSpritePositions = [];

let playerSpritePos0 = {};
playerSpritePos0[1] = {x:105, y:100, width: 75, height: 83};
playerSpritePos0[2] = {x:201, y:100, width: 75, height: 83}; //second move
playerSpritePos0[3] = {x:0, y:0, width: 96, height: 96}; //dead

let playerSpritePos1 = {};
playerSpritePos1[1] = {x:375, y:45, width: 190, height: 305};
playerSpritePos1[2] = {x:750, y:45, width: 190, height: 305}; //second move
playerSpritePos1[3] = {x:0, y:0, width: 96, height: 96}; //dead

let playerSpritePos2 = {};
playerSpritePos2[1] = {x:0, y:64, width: 33, height: 33};
playerSpritePos2[2] = {x:64, y:64, width: 33, height: 33}; //second move
playerSpritePos2[3] = {x:0, y:0, width: 96, height: 96}; //dead

let playerSpritePos3 = {};
playerSpritePos3[1] = {x:288, y:64, width: 33, height: 33};
playerSpritePos3[2] = {x:352, y:64, width: 33, height: 33}; //second move
playerSpritePos3[3] = {x:0, y:0, width: 96, height: 96}; //dead

let playerSpritePos4 = {};
playerSpritePos4[1] = {x:96, y:192, width: 33, height: 33};
playerSpritePos4[2] = {x:160, y:192, width: 33, height: 33}; //second move
playerSpritePos4[3] = {x:0, y:0, width: 96, height: 96}; //dead


playerSpritePositions.push(playerSpritePos0);
playerSpritePositions.push(playerSpritePos1);
playerSpritePositions.push(playerSpritePos2);
playerSpritePositions.push(playerSpritePos3);
playerSpritePositions.push(playerSpritePos4);

let playerImages = [];

let playerImage0 = new Image();                      
playerImage0.src = document.location.pathname + '/../assets/img/players/warrior.png';
let playerImage1 = new Image();                      
playerImage1.src = document.location.pathname + '/../assets/img/players/samurai.png';
let playerImage2 = new Image();                      
playerImage2.src = document.location.pathname + '/../assets/img/players/multi.png';
let playerImage3 = new Image();                      
playerImage3.src = document.location.pathname + '/../assets/img/players/multi.png';
let playerImage4 = new Image();                      
playerImage4.src = document.location.pathname + '/../assets/img/players/multi.png';

playerImages.push(playerImage0);
playerImages.push(playerImage1);
playerImages.push(playerImage2);
playerImages.push(playerImage3);
playerImages.push(playerImage4);

let swordImage = new Image();
swordImage.src = document.location.pathname + '/../assets/img/weapons/weapon.png';

//PLAYER UPDATE TIME
let moveTimer = 500;
let attackTimer = 1000;
let movementDistance = 1.5; //percentage of screen
let isColliding = false;
let isCasting = false;
let numEffects = 0;

define(function () {
  return {
    setupPlayer: function() {            
      const time = new Date().getTime();
      let x = 0;
      let size = worldWidth / 10;
      let y = size;
      let position = {x:x, y:y,width:size,height:size};
      let newPlayer = {
          room: room, 
          lastSpell: time, 
          lastUpdate: time, 
          lastAttack: time,
          isMoving: false, 
          position:position, 
          maxHealth:maxHealth, 
          currentHealth:maxHealth,
          dead:false,
          speed:speed,
          attack:attack,
          level:level,
          exp:exp,
          points:points,
          maxDistance:maxDistance, 
          spritePos:1, 
          spellPower:spellPower, 
          spellCooldown:1000, 
          isAttacking:false, 
          color: color, 
          texts: {},
          direction: true,
          type:type,
      };

      return newPlayer;
    }
  };
});