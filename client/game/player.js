let playerSize = (worldWidth / 10);
let playerSizePercentage = 10;
let playerY = worldHeight - (worldWidth / 10);
let playerHealthBarHeight = (worldHeight / 20);

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

define(function () {
  return {
    setupPlayer: function() {            
      const time = new Date().getTime();
      let x = 0;
      let size = worldWidth / 10;
      let y = size;
      let position = {x:x, y:y,width:size,height:size};
      let spritePos = {x:96, y:96, width: 96, height: 96};
      let newPlayer = {
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

      return newPlayer;
    }
  };
});