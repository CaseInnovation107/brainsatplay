let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 100;
let colors = []
let alphaBuffers;
let alphaDictPersist;

setup = () => {

  for (let i = 0; i < 50; i++) {
    colors.push(color(Math.random() * 255, Math.random() * 255, Math.random() * 255))
  }

  // P5 Setup
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  resizeCanvas(windowWidth, windowHeight);
  museToggle = createButton('Connect Muse');
  museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);


  // Brains@Play Setup
  game = new brainsatplay.Game('inspector')
  game.simulate(1,[[100,100,100,100,100]],[[8,9,10,11,12]])

  museToggle.mousePressed(async () => {
    await game.bluetooth.devices['muse'].connect()
    game.connectBluetoothDevice(brainsatplay.museClient)
  });
  
  alphaBuffers = Array.from(Object.keys(game.eegCoordinates), channelName => {
                return Array(500).fill(0)})
  }

draw = () => {
  
    if (game.bluetooth.connected) {
      museToggle.hide()
    } else {
      museToggle.show()
    }

    background(0);
  noStroke()
  fill(50,50,50)
  let headWidth = windowWidth / 2
  ellipse(windowWidth / 2, windowHeight / 2 + 20, headWidth,headWidth+headWidth*(1/6)) // Head
  ellipse(windowWidth / 2, windowHeight / 2 - (headWidth+headWidth*(1/6) - 50)/2, headWidth/10) // Nose
  ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Left Ear
  ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, headWidth/10,headWidth/5) // Right Ear

    // Update Voltage Buffers
    game.update();
  
    // Get Brain Data
    let brain = game.brains[game.info.access].get(game.me.username)
    
     if (brain !== undefined){
      brain.getMetric('alpha').then((alphaDict) => {
                alphaDict.channels.forEach((alpha,channel) => {
              alphaBuffers[channel].shift()
              alphaBuffers[channel].push(alpha)
        })
       
    // let voltage = brain.getVoltage();
    brain.usedChannels.forEach((channelDict,ind) => {
        let [x, y, z] = brain.eegCoordinates[channelDict.name]
        
        let centerX = x*(headWidth/150) + (windowWidth / 2)
        let centerY = -y*(headWidth/150) + windowHeight / 2
               
        let buffer = alphaBuffers[channelDict.index]
        let aveAmp = buffer.reduce((a, b) => a + Math.abs(b), 0) / buffer.length;
        let voltageScaling = -25
        let signalWidth = 100
// Zero Line
stroke(255,255,255)
line(centerX - (signalWidth+10)/2, 
  centerY,
  centerX + (signalWidth+10) - (signalWidth+10)/2, 
  centerY
  )   
  

  // Colored Line
stroke(
  0,225,255
  )

    for (let sample = 0; sample < buffer.length; sample++){
       line(centerX + (signalWidth*(sample/buffer.length) - signalWidth/2), 
            centerY + voltageScaling*buffer[sample],
            centerX + (signalWidth*((sample+1)/buffer.length) - signalWidth/2), 
            centerY + voltageScaling*buffer[sample+1]
           )   
    }
    
    // Text Label
    noStroke()
    textSize(10)
    fill('white')
   
text(alphaDict.channels[channelDict.index].toFixed(2) + ' uV',
      centerX,
      centerY + (40)
         )       
       })                                   
      });
     }
}


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      // connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
      // disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
      museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
    }