let connectToggle;
let disconnectToggle;
let museToggle;

let margin = 100;
let colors = []
let signalWidth = 50;

setup = () => {

  for (let i = 0; i < 50; i++) {
    colors.push(color(Math.random() * 255, Math.random() * 255, Math.random() * 255))
  }

  // P5 Setup
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  resizeCanvas(windowWidth, windowHeight);
  connectToggle = createButton('Connect to Server');
  museToggle = createButton('Connect Muse');
  disconnectToggle = createButton('Disconnect');
  connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
  disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
  museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
  disconnectToggle.hide()


  // Brains@Play Setup
  game = new brainsatplay.Game('template')
  game.newGame('template')
  game.simulate(1);

  museToggle.mousePressed(async () => {
    await game.bluetooth.devices['muse'].connect()
    game.connectBluetoothDevice(brainsatplay.museClient)
  });

  connectToggle.mousePressed(() => {
    game.connect({
      'guestaccess': true
    })
    disconnectToggle.show()
    connectToggle.hide()
  });

  disconnectToggle.mousePressed(() => {
    game.disconnect()
    disconnectToggle.hide()
    connectToggle.show()
  })
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
  ellipse(windowWidth / 2, windowHeight / 2 + 20, 150,175) // Head
  ellipse(windowWidth / 2, windowHeight / 2 - 66, 15) // Nose
  ellipse(windowWidth / 2 + 75, windowHeight / 2 + 20, 15,30) // Left Ear
  ellipse(windowWidth / 2 - 75, windowHeight / 2 + 20, 15,30) // Right Ear

    // Update Voltage Buffers
    game.update();
  
    // Draw Voltage Power (STD)

    let brain = game.brains[game.info.access].get(game.me.username)
     if (brain !== undefined){
    let power = brain.getMetric('power')
    let voltage = brain.getVoltage();
    brain.usedChannels.forEach((channelDict,ind) => {
        let [x, y, z] = brain.eegCoordinates[channelDict.name]
        
        let centerX = x + (windowWidth / 2)
        let centerY = -y + windowHeight / 2
        let size = 15

        power.channels[channelDict.index]/100
       
let buffer = voltage[channelDict.index]

// Zero Line
stroke(255,255,255)
line(centerX - (signalWidth+10)/2, 
  centerY,
  centerX + (signalWidth+10) - (signalWidth+10)/2, 
  centerY
  )   
  

  // Colored Line
stroke(
  255*(power.channels[channelDict.index]/100), // Red
  255*(1-power.channels[channelDict.index]/100), // Green
    0
  )

    for (let sample = 0; sample < buffer.length; sample++){
       line(centerX + (signalWidth*(sample/buffer.length) - signalWidth/2), 
            centerY + buffer[sample],
            centerX + (signalWidth*((sample+1)/buffer.length) - signalWidth/2), 
            centerY + buffer[sample+1]
           )
              
    }      

    // Text Label
    textSize(10)
    fill('white')
    text(power.channels[channelDict.index].toFixed(1) + ' uV',
      centerX,
      centerY + 40
         )       
       })
     }
}


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth - 25 - connectToggle.width, windowHeight - 125 - connectToggle.height);
      disconnectToggle.position(windowWidth - 25 - disconnectToggle.width, windowHeight - 125 - disconnectToggle.height);
      museToggle.position(windowWidth - 25 - museToggle.width, windowHeight - 50 - museToggle.height);
    }