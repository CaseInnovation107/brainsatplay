let length = 5;
let numItems = Math.pow(length, 2);
let objects = [];
for (let i=0;i < numItems; i++){
  objects.push(i.toString())
}
let framesOnScreen = 25;
let framesOffScreen = framesOnScreen/5;
let on = false;
let margin = 100;
let rightSidebar = 300;
let chooseEllipses = [];
let t = 0;
let scaleEEG = 25;

let erp_settings = {
  name: 'p300',
  subset: 0.2,
  trials: 10,
  iti: 1000, // milliseconds
  num_samples: 500, //500,
  duration: 250, // milliseconds
  objects: objects
}

function setup() {

  // P5 Setup
  createCanvas(windowWidth, windowHeight);

  // Brains@Play Setup
  game = new Game('template')
  game.simulate(2);
  game.setERP(erp_settings)
}

function draw() {
  background(0);
  noStroke()

  // Update Voltage Buffers and Derived Variables
  game.update();

  chooseEllipses = game.erp.currentEventState.chosen
  chooseEllipses = chooseEllipses.map((key) => {
    return objects.indexOf(key)
  })

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

  fill('white')
  textStyle(BOLD)
  textSize(15)
  text('Trial: ' + game.erp.trial, (windowWidth - rightSidebar) + margin, margin)

  text('State: ' + game.erp.state, (windowWidth - rightSidebar) + margin, margin+25)

  for (let trial = 0; trial < game.erp.events.length; trial++){
    noStroke()
    text('Trial ' + trial + ': ' + game.erp.events[trial].chosen, 
    (windowWidth - rightSidebar) + margin, 
    margin + 75 + 50*(trial+1))

    stroke(54, 235, 255)
    let trialData = game.erp.signal[trial][0]
    trialData.forEach((point ,ind) => {
      line((((windowWidth-rightSidebar)) + ((rightSidebar-margin)*ind/trialData.length)),
        margin + 90 + 50*(trial+1) - (trialData[ind]/scaleEEG),
        (((windowWidth-rightSidebar)) + ((rightSidebar-margin)*(ind+1)/trialData.length)),
        margin + 90 + 50*(trial+1) - (trialData[ind+1]/scaleEEG),
      )
    })
  }

  stroke('white')
  line((windowWidth - rightSidebar),0,(windowWidth - rightSidebar),windowHeight)

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