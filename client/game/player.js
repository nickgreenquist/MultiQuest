/*  jshint esversion: 6 */

const playerSize = (worldWidth / 10);
const playerSizePercentage = 10;
const playerY = worldHeight - (worldWidth / 10) - (worldHeight / 20);
const playerHealthBarHeight = (worldHeight / 10);

// PLAYER SPRITE POS
let playerSpritePositions = [];

let playerSpritePos0 = {};
playerSpritePos0[1] = { x: 105, y: 100, width: 75, height: 83 };
playerSpritePos0[2] = { x: 201, y: 100, width: 75, height: 83 }; // second move
playerSpritePos0[3] = { x: 0, y: 0, width: 96, height: 96 }; // dead

let playerSpritePos1 = {};
playerSpritePos1[1] = { x: 0, y: 192, width: 33, height: 33 };
playerSpritePos1[2] = { x: 64, y: 192, width: 33, height: 33 }; // second move
playerSpritePos1[3] = { x: 0, y: 0, width: 96, height: 96 }; // dead

let playerSpritePos2 = {};
playerSpritePos2[1] = { x: 0, y: 64, width: 33, height: 33 };
playerSpritePos2[2] = { x: 64, y: 64, width: 33, height: 33 }; // second move
playerSpritePos2[3] = { x: 0, y: 0, width: 96, height: 96 }; // dead

let playerSpritePos3 = {};
playerSpritePos3[1] = { x: 288, y: 64, width: 33, height: 33 };
playerSpritePos3[2] = { x: 352, y: 64, width: 33, height: 33 }; // second move
playerSpritePos3[3] = { x: 0, y: 0, width: 96, height: 96 }; // dead

let playerSpritePos4 = {};
playerSpritePos4[1] = { x: 96, y: 192, width: 33, height: 33 };
playerSpritePos4[2] = { x: 160, y: 192, width: 33, height: 33 }; // second move
playerSpritePos4[3] = { x: 0, y: 0, width: 96, height: 96 }; // dead


playerSpritePositions.push(playerSpritePos0);
playerSpritePositions.push(playerSpritePos1);
playerSpritePositions.push(playerSpritePos2);
playerSpritePositions.push(playerSpritePos3);
playerSpritePositions.push(playerSpritePos4);


// PLAYER IMAGE
let playerImages = [];

let playerImage0 = new Image();
playerImage0.src = document.location.pathname + '/../assets/img/players/warrior.png';
let playerImage1 = new Image();
playerImage1.src = document.location.pathname + '/../assets/img/players/multi.png';
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


// WEAPON IMAGE
let weaponImages = [];
let weaponAttackImages = [];
let weaponSizes = [];

for (let i = 0; i < 10; i++) {
  let weaponImage = new Image();
  weaponImage.src = document.location.pathname + `/../assets/img/weapons/${i}.png`;
  weaponImages.push(weaponImage);

  let weaponAttackImage = new Image();
  weaponAttackImage.src = document.location.pathname + `/../assets/img/weapons/${i}_attack.png`;
  weaponAttackImages.push(weaponAttackImage);

  weaponSizes.push(playerSize * 1);
}

// CUSTOM WEAPON SIZES IF NEEDED
weaponSizes[9] = (playerSize * 1.2);

// PLAYER UPDATE TIME
let moveTimer = 10000;
let attackTimer = 40000;
let movementDistance = 1.5; // percentage of screen
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
      let attackValue = Math.round(attack * ((weapons[weaponType].attack / 100) + 1));
      let speedValue = Math.round(speed * (((weapons[weaponType].speed + classes[type].speed) / 100) + 1));
      let spellPowerValue = Math.round(spellPower * (((weapons[weaponType].intelligence + classes[type].intelligence) / 100) + 1));
      let maxHealthValue = Math.round(maxHealth * ((classes[type].health / 100) + 1));
      let newPlayer = {
          room: room, 
          lastSpell: time, 
          lastUpdate: time, 
          lastAttack: time,
          isMoving: false, 
          position:position, 
          maxHealth:maxHealth, 
          maxHealthValue:maxHealthValue,
          currentHealth:maxHealthValue,
          dead:false,
          speed:speed,
          speedValue:speedValue,
          attack:attack,
          attackValue:attackValue,
          level:level,
          exp:exp,
          points:points,
          maxDistance:maxDistance, 
          spritePos:1, 
          spellPower:spellPower, 
          spellPowerValue:spellPowerValue,
          spellCooldown:5000, 
          isAttacking:false, 
          color: color, 
          texts: {},
          direction: true,
          type:type,
          weaponType:weaponType,
      };

      return newPlayer;
    },
  };
});
