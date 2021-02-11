let length = 5;
let numItems = Math.pow(length, 2);
let objects = [];
let framesOnScreen = 25;
let framesOffScreen = framesOnScreen/5;
let on = false;
let margin = 100;
let rightSidebar = 300;
let chooseEllipses = [];
let t = 0;

function setup() {

  // P5 Setup
  createCanvas(windowWidth, windowHeight);

  for (let i=0;i < numItems; i++){
    objects.push(i.toString())
  }

  // Brains@Play Setup
  game = new Game('template')
  game.simulate(2);
  game.setERP(objects)
}

function draw() {
  background(0);

  // Update Voltage Buffers and Derived Variables
  game.update();

  background(0);

  if (t >= framesOnScreen && on == false) {
    chooseEllipses = getUniqueRandomSubset(numItems, numItems/5)
    on = !on;
    t = 0;
  } else if (t >= framesOffScreen && on == true) {
    chooseEllipses = new Array(length / 5).fill((Math.pow(length, 2)) + 1)
    on = !on;
    t = 0;
  }

  let num = 0;
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < length; j++) {
      if (chooseEllipses.includes(num)) {
        fill(0)
      } else {
        fill(255)
      }

      ellipse(margin + (i * ((windowWidth - 2 * margin - rightSidebar) / (length - 1))), // x
        margin + (j * ((windowHeight - 2 * margin) / (length - 1))), // y
        Math.min(windowWidth, windowHeight) * (1 / (3 * length))) // size
      
      num++
    }
  }

  t++;
  fill(54, 235, 255)
  rect(0,window.height-15, (game.erp.count/game.erp.signal[game.erp.trial][0].length)*(windowWidth-rightSidebar),window.height)
  
  stroke('white')
  line((windowWidth - rightSidebar),0,(windowWidth - rightSidebar),windowHeight)

  noStroke()
  fill('white')
  textStyle(BOLD)
  textSize(15)
  text('Trial: ' + game.erp.trial, (windowWidth - rightSidebar) + 50, margin)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function getUniqueRandomSubset(numItems,subset) {
  var arr = [];
  while (arr.length < subset) {
    var r = Math.floor(Math.random()*numItems);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr
}