/*jshint esversion: 6 */

let worldWidth = window.innerWidth;
let worldHeight = window.innerHeight * .25;

var socket;
let canvas;
let ctx;
let sendBufferCanvas;
let sendBufferCtx;
let isHost = false;

const user = username;

let stage = 1;
let then = Date.now();
let startTime = Date.now();
let totalEXP = 0;

let players = {};
let enemies = {};

let healthBarHeight = (worldHeight / 20);

let textSize = worldHeight / 10;