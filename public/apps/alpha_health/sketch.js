// Noel Case, 2-20-21
// This is a prototype of an app for Brains@Play that measures alpha waves for two users.

  let connectToggle;
  let disconnectToggle;
  let museToggle;

  let margin = 100;
  let colors = []

  setup = () => {

    for (let i = 0; i < 50; i++){
      colors.push(color(Math.random()*255,Math.random()*255,Math.random()*255))}
  //Audio Setup:
  let polySynth;
  var volMain = 0.2;
  var note = 52.125;      
  let cnv = createCanvas(100, 100);
  //cnv.mousePressed(playSynth);
  background(220);
  textAlign(CENTER);
  text('health drop', width/2, height/2);

  healthdrop = new p5.PolySynth();
  healthdrop.setADSR(0.2,0.15,0.3,0.5);

  drone1 = new p5.Oscillator('sine');
  drone2 = new p5.Oscillator('sine');
  drone3 = new p5.Oscillator('sine');
  drone4 = new p5.Oscillator('sine');
    
  drone1.amp(0);
  drone2.amp(0);
  drone3.amp(0);  
  drone4.amp(0);


      // P5 Setup
      createCanvas(400, 400);
      textAlign(CENTER, CENTER);
      resizeCanvas(windowWidth, windowHeight);
      connectToggle = createButton('Connect to Server');
      museToggle = createButton('Connect Muse');
      audioToggle = createButton('Audio On');
      audioOffToggle = createButton('Audio Off');
      disconnectToggle = createButton('Disconnect');
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
    audioToggle.position(windowWidth/2 - audioToggle.width/2, windowHeight/6 - connectToggle.height);
    audioOffToggle.position(windowWidth/2 - audioToggle.width/2, windowHeight/6 - connectToggle.height);
      disconnectToggle.hide()
      audioOffToggle.hide()
     
      audioToggle.mousePressed(() => {
      userStartAudio();
      drone1.start(0, note); 
      drone2.start(0, 2*note - 0.25);
      drone3.start(0, 3*note - 0.25);
      drone4.start(0, 5*note);
    
      drone1.amp(volMain*0.15, 0.5);
      drone2.amp(volMain*0.15, 0.5);
      drone3.amp(volMain*0.07, 0.5);
      drone4.amp(volMain*0.05, 0.5);
      audioOffToggle.show()
      audioToggle.hide()
  });
    
    audioOffToggle.mousePressed(() => {
    drone1.stop(0.1); 
    drone2.stop(0.1);
    drone3.stop(0.1);
    drone4.stop(0.1);
    audioToggle.show()
    audioOffToggle.hide()
});
      // Brains@Play Setup
      game = new brainsatplay.Game('alpha_battle')
      game.newGame('template')
      game.simulate(2);
      
      museToggle.mousePressed(async () => {
          await game.bluetooth.devices['muse'].connect()
          game.connectBluetoothDevice(brainsatplay.museClient)
      });

      connectToggle.mousePressed(() => {
          game.connect({'guestaccess': true})
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

      if (game.bluetooth.connected){
          museToggle.hide()
      } else {
          museToggle.show()
      }

      background(0);
    
      // Update Voltage Buffers and Derived Variables
      game.update();

      // Draw Raw Voltage 
      let c;
      let usernames = game.getUsernames()
      let viewedChannels = game.usedChannels
      // console.log(viewedChannels)
      usernames.forEach((username, ind) => {
       c = colors[ind]
       if (ind === game.me.index){
          c = color('#1cc5cd')
          c.setAlpha(200)
       } else {
          c = colors[ind]
          c.setAlpha(150)
       }
        strokeWeight(1)
        stroke(c)
        textSize(100);
    
        let brainData = game.brains[game.info.access].get(username).getVoltage()
        viewedChannels.forEach((usedChannel,ind) => {
            let data = brainData[usedChannel.index]
            let dx = windowWidth / data.length;

      // Voltage Lines
        for (var point = 0; point < data.length - 1; point++) {
          line(point * dx,
            ((data[point] * (windowHeight-2*margin)/ (1000*(viewedChannels.length-1))) + (ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin),
            (point + 1) * dx,
            ((data[point + 1] * (windowHeight-2*margin) / (1000*(viewedChannels.length-1))) + (ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin)
          )
        }
      // Electrode Name Text
          fill('white')
          textSize(15)
          text(usedChannel.name, 
                  50, 
                  ((ind/(viewedChannels.length-1))*(windowHeight-2*margin) + margin),
              )
          })
      })
      
       //Drawing alpha
        game.getMetric('alpha').then((alpha) => {
           noFill()
           strokeWeight(2)
           stroke(0,255,alphaHueShift)
           var alphaHueShift = int(alpha.average*500);
           ellipse((windowWidth / 2), windowHeight/2, 10 * alpha.average * Math.min(windowHeight / 2, windowWidth / 2));

      
      // Include Text for Raw Alpha Value
      fill('white')
      textStyle(BOLD)
      textSize(15)
      text('Alpha', windowWidth / 2, windowHeight-100)
      textStyle(ITALIC)
      textSize(10)
    
      if (!game.info.simulated) {
          text('Live Data Stream', windowWidth / 2, windowHeight-80)
      } else {
          text('Synthetic Data Stream', windowWidth / 2, windowHeight-80)
      }
      
      textStyle(NORMAL)
      if ((game.info.brains === 0 || game.info.brains === undefined) && game.connection.status) {
          text('No brains on the network...', windowWidth / 2, windowHeight/2)
      } else if (game.info.brains < 2 && game.connection.status) {
          text('One brain on the network...', windowWidth / 2, windowHeight/2)
      } else {
          if (alpha.average !== undefined){
              text(alpha.average.toFixed(4), windowWidth / 2, windowHeight/2)
            } else {
              text(alpha.average, windowWidth / 2, windowHeight/2)
            }
      }
    })
    }


    windowResized = () => {
      resizeCanvas(windowWidth, windowHeight);
      connectToggle.position(windowWidth-25-connectToggle.width, windowHeight-125-connectToggle.height);
      disconnectToggle.position(windowWidth-25-disconnectToggle.width, windowHeight-125-disconnectToggle.height);
      museToggle.position(windowWidth-25-museToggle.width, windowHeight-50-museToggle.height);
  }

 playSynth = () => {
  // note duration (in seconds)
  let dur = 0.5;
  // time from now (in seconds)
  let time = 0;
  // velocity (volume, from 0 to 1)
  let vel = 0.8;
  
  // notes can overlap with each other
  polySynth.play(1.06*2*note, vel, 0, dur);
  polySynth.play(1.06*3*note, vel, 0, dur);

 }

