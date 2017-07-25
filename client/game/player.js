let playerSize = (worldWidth / 10);
let playerSizePercentage = 10;
let playerY = worldHeight - (worldWidth / 10);
let playerHealthBarHeight = (worldHeight / 20);

//PLAYER IMAGE
let playerSpritePositions = [];

let playerSpritePos = {};
playerSpritePos[1] = {x:96, y:96, width: 96, height: 96};
playerSpritePos[2] = {x:192, y:101, width: 96, height: 96}; //second move
playerSpritePos[3] = {x:0, y:0, width: 96, height: 96}; //dead

let playerSpritePos1 = {};
playerSpritePos1[1] = {x:375, y:45, width: 190, height: 305};
playerSpritePos1[2] = {x:750, y:45, width: 190, height: 305}; //second move
playerSpritePos1[3] = {x:0, y:0, width: 96, height: 96}; //dead


playerSpritePositions.push(playerSpritePos);
playerSpritePositions.push(playerSpritePos1);

let playerImages = [];

let playerImage = new Image();                      
playerImage.src = document.location.pathname + '/../assets/img/players/warrior.png';
let playerImage1 = new Image();                      
playerImage1.src = document.location.pathname + '/../assets/img/players/samurai.png';

playerImages.push(playerImage);
playerImages.push(playerImage1);

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