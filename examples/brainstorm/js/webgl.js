// The models in this code are by Anderson Winkler and are
// licensed under a Creative Commons Attribution-ShareAlike 3.0
// Unported License. The original work can be found at
// https://brainder.org/brain-for-blender.

function particleBrain() {

    if (!gl) {
        throw new Error('WebGL not supported')
    }

    let key_events = [37, 38, 39, 40];

    t = 0;
    stateManager(animState)

    animStart = Date.now();
    $('#canvas-message').animate({'opacity': 0}, 400, function(){
        $(this).html(message_array[state][animState]).animate({'opacity': 1}, 400);
    });


    vertexCurr = vertexHome;
    vertexVel = new Array(pointCount*3).fill(0.0);

    // displacement = resetDisplacement();
    displacement = brains.userBuffers;
    disp_flat = [...displacement.flat(2)]


// create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, `
precision mediump float;

attribute vec3 position;
attribute float z_displacement;

vec3 color;
varying vec3 vColor;

uniform int effect;
uniform mat4 matrix;
uniform float u_distortion;
uniform float u_noiseCoeff;
uniform float synchrony;
uniform float u_time;
uniform float aspect;
uniform vec3 eeg_coords[${eegCoords.length}];
uniform float eeg_power[${eegCoords.length}];

float sync_scaling = 0.5+(0.5*synchrony); 

float ambient_noise_multiplier = (0.5-sync_scaling);

vec3 distortion_noise;
vec3 ambient_noise;

vec4 positionProjected;
vec2 currentScreen;

//Classic Perlin 3D Noise 
//by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

void main() {

    if (synchrony > 0.0) {
        ambient_noise_multiplier = 0.0;
    }
    float x = position.x;
     float y = position.y;
     float z = position.z;
     distortion_noise = vec3(0,0,u_noiseCoeff) * cnoise(vec3(x + u_distortion, y + u_distortion,z + u_distortion));
     ambient_noise = vec3(0.0,0.01+5.0*ambient_noise_multiplier,0.01+5.0*ambient_noise_multiplier) * cnoise(vec3(x + u_time, y + u_time,z + u_time));
     
     // Initialize color at zero
     vColor.x = .5;
     vColor.y = .5;
     vColor.z = .5;

     // Add color effects
     if (effect == 1){
        vColor.x = 1.0;
        vColor.y = 1.0;
        vColor.z = 1.0;
        for (int i = 0; i < ${eegCoords.length}; i++){
            if (abs(distance(eeg_coords[i],position)) <= 0.75){
                if (eeg_power[i] > 0.0){
                    vColor.y -= 0.5*(eeg_power[i])*(1.0-pow(abs(distance(eeg_coords[i],position)),2.0));
                    vColor.z -= 0.2*(eeg_power[i])*(1.0-pow(abs(distance(eeg_coords[i],position)),2.0));
                } else if (eeg_power[i] < 0.0){
                    vColor.x += 0.5*(eeg_power[i])*(1.0-pow(abs(distance(eeg_coords[i],position)),2.0));
                    vColor.y += 0.2*(eeg_power[i])*(1.0-pow(abs(distance(eeg_coords[i],position)),2.0));
                }
            }  else if (eeg_power[i] == 0.0){
                vColor.x = 0.5;
                vColor.y = 0.5;
                vColor.z = 0.5;
            }
        }
     } else if (effect == 2){
        vColor = vec3(.5-synchrony,.5,synchrony + .5);
     } 

     positionProjected = matrix * vec4((x+distortion_noise.x+ambient_noise.x),(y+distortion_noise.y+ambient_noise.y),(z+distortion_noise.z+z_displacement+ambient_noise.z),1) * vec4(sync_scaling,sync_scaling,sync_scaling,1.0);
     currentScreen = positionProjected.xy / positionProjected.w;
     // currentScreen.x *= aspect;

     
    gl_Position = positionProjected;
    gl_PointSize = 1.0;
}`);

    gl.compileShader(vertexShader);

// create fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
precision mediump float;
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor,0.5);
}
`);
    gl.compileShader(fragmentShader);

// create program
    const program = gl.createProgram();

// attach shaders to program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

// create buffers and enable vertex attributes
    positionBuffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, `position`);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCurr), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    dispBuffer = gl.createBuffer();
    const dispLocation = gl.getAttribLocation(program, `z_displacement`);
    gl.enableVertexAttribArray(dispLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, dispBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disp_flat), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(dispLocation, 1, gl.FLOAT, false, 0, 0);

// draw
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // matrix code
    uniformLocations = {
        effect: gl.getUniformLocation(program,`effect`),
        matrix: gl.getUniformLocation(program, `matrix`),
        u_time: gl.getUniformLocation(program, `u_time`),
        distortion: gl.getUniformLocation(program, `u_distortion`),
        noiseCoeff: gl.getUniformLocation(program, `u_noiseCoeff`),
        synchrony: gl.getUniformLocation(program, `synchrony`),
        aspect: gl.getUniformLocation(program, `aspect`),
        eeg_coords: gl.getUniformLocation(program,`eeg_coords`),
        eeg_power: gl.getUniformLocation(program,`eeg_power`)
    };

    passedEEGCoords = eegCoords.map((arr,ind) => {
        if (ind >= channels){
            return [NaN,NaN,NaN]
        } else {
            return arr
        } 
    })

    gl.uniform3fv(uniformLocations.eeg_coords, new Float32Array(passedEEGCoords.flat()));
    gl.uniform1i(uniformLocations.effect, effects.indexOf(effect_array[state][animState]));


    const modelMatrix = mat4.create();

    viewMatrix = mat4.create();
    mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 2);
    mat4.rotateY(viewMatrix, viewMatrix, Math.PI / 2);
    mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
    mat4.invert(viewMatrix, viewMatrix);

    let projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
        75 * Math.PI / 180, // vertical field-of-view (angle, radians)
        canvas.width / canvas.height, // aspect W/H
        1e-4, // near cull distance
        1e4, // far cull distance
    );

    const mvMatrix = mat4.create();
    const mvpMatrix = mat4.create();


    // Enable events on mousehold in WebGL
    let holdStatus = false;
    let mouseEv;
    let moveStatus;
    let x;
    let y;
    let prev_x;
    let prev_y;

    // Event trackers
    let scroll;
    let diff;
    let diff_total;
    let forceSink;

    canvas.onmousedown = function(ev){
        holdStatus = true;
        mouseEv = ev;
        x = ev.clientX// /window.innerWidth; // (ev.clientX / window.innerWidth) * 2 - 1;
        y = ev.clientY// /window.innerHeight; // -(ev.clientY / window.innerHeight) * 2 + 1;
        prev_x = x;
        prev_y = y;
    };

    canvas.onmouseup = function(ev){
        holdStatus = false;
        vertexVel = new Array(pointCount*3).fill(0);
    };
    canvas.onmousemove = function(ev){
        mouseEv = ev;
        moveStatus = true;
        x = ev.clientX// /window.innerWidth; // (ev.clientX / window.innerWidth) * 2 - 1;
        y = ev.clientY// /window.innerHeight; // -(ev.clientY / window.innerHeight) * 2 + 1;
    };

    canvas.onwheel = function(ev){

        if (zoom) {
            scroll = ev.deltaY;
            mat4.invert(viewMatrix, viewMatrix);
            mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);
            cameraHome += scroll / 100;
            cameraCurr += scroll / 100;
            mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
            mat4.invert(viewMatrix, viewMatrix);
        }
    };

    document.onkeydown = function(ev){
        if (key_events.includes(ev.keyCode)){
            if (ev.keyCode == '38') {
                distortFlag = true;
                if (distortIter == -1) {
                    distortion = 0;
                }
                distortIter = 1;
            } else if (ev.keyCode == '40') {
                distortIter =+ ease_array[state][animState]*(-distortion);
            } else if (ev.keyCode == '39' || ev.keyCode == '37') {

                    if (ev.keyCode == '39' && state < (shape_array.length-1))
                    {
                        state += 1
                    }
                    else if (ev.keyCode == '37' && state > 1) {
                        state -= 1
                    }
            }
        }
    };

    function mouseState() {
        if (holdStatus && moveStatus) {
            if (rotation){
                diff_x = (x - prev_x);
                diff_y = (y - prev_y)
            }
            prev_x = x;
            prev_y = y;
        }

        // if (holdStatus){
        //     rotation = false;
        // } else {
        //     rotation = true;
        // }
    }

    function animate() {
        requestAnimationFrame(animate)
        mouseState()


        // Allow auto-rotation
        if (shape_array[state][animState] != 'voltage'){
            diff_x += AUTO_ROTATION_X;
        }


        // Update State
        if (state != prevState){
            animState = 0;
            stateManager(animState);

            // Change effect
            gl.uniform1i(uniformLocations.effect, effects.indexOf(effect_array[state][animState]));
            
            // Start animation and associated canvas message
            animStart = Date.now()
            $('#canvas-message').animate({'opacity': 0}, 400, function(){
                $(this).html(message_array[state][animState]).animate({'opacity': 1}, 400);
            });
        }

        // Update Animation
        if (anim_array[state][animState] && ((Date.now() - animStart)/1000 > anim_array[state][animState])){


            // If there is a shape within the current state to animate to
            if ((anim_array[state].length-1) > animState){
                animState += 1;
            }
            // Else animate into next state
            else {
                animState = 0;
                state += 1;
            }

            stateManager(animState);

            // Change effect
            gl.uniform1i(uniformLocations.effect, effects.indexOf(effect_array[state][animState]));
            
            // Start animation and associated canvas message
            animStart = Date.now()
            $('#canvas-message').animate({'opacity': 0}, 400, function(){
                $(this).html(message_array[state][animState]).animate({'opacity': 1}, 400);
            });
        }


        // Generate signal if specified
        if (generate) {
            if (count == generate_interval-1){
                sendSignal(channels)
                count = 0;
            } else {
                count += 1
            }}


        // Append voltage stream to array
        // displacement = updateDisplacement(displacement,signal, 0) // Update your signal
        // displacement = updateDisplacement(displacement,other_signal,1)// Update the signal of others
        brains.updateUserBuffers()
        displacement = brains.userBuffers;
        disp_flat = [...displacement.flat(2)]

        // Push voltage stream to displacement buffer
        if (shape_array[state][animState] == 'voltage') {
            gl.bindBuffer(gl.ARRAY_BUFFER, dispBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(disp_flat), gl.DYNAMIC_DRAW);
        } 
        // Update rotation speeds
        moveStatus = false;
        diff_x *= (1-ease_array[state][animState]);
        diff_y *= (1-ease_array[state][animState]);

        // Modify Distortion
        if (distortFlag) {
            if (Math.sign(distortIter) == -1){
                distortIter =+ ease_array[state][animState]*(-distortion)
            }
            if (distortion >= 0){
                distortion += distortIter;
            }
        }

        // Get synchrony
        if (shape_array[state][animState] == 'brain' && t > 100) {
            // Synchrony of you and other users

            if (brains.users.size > 1){
            // Generate edge array
            keys = brains.users.keys()
            let edgeArray = [];
            let currentEdge = []
            currentEdge.push(keys.next().value)
            currentEdge.push(keys.next().value)
            edgeArray.push(currentEdge)
            new_sync = brains.synchrony('pcc',edgeArray)
            // Slowly ease to the newest synchrony value
            synchrony.shift()
            if (!isNaN(new_sync)) {
                synchrony.push(new_sync)
            } else {
                synchrony.push(0)
            }
        } else {
            synchrony.shift()
            synchrony.push(0)
        }
    }

        // Modify View Matrix
        mat4.invert(viewMatrix, viewMatrix);
        mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);
        mat4.rotateY(viewMatrix, viewMatrix, -diff_x*2*Math.PI/canvas.height);
        mat4.rotateX(viewMatrix, viewMatrix, -diff_y*2*Math.PI/canvas.width);
        mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
        mat4.invert(viewMatrix, viewMatrix);
        // mat4.rotateZ(viewMatrix, viewMatrix, -0.01);

        // Create container matrix for WebGL
        mat4.multiply(mvMatrix, viewMatrix, modelMatrix)
        mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix)

        // Update Uniforms
        gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix)
        gl.uniform1f(uniformLocations.noiseCoeff,distortion/5);
        gl.uniform1f(uniformLocations.distortion, distortion/100);
        gl.uniform1f(uniformLocations.u_time, t/200);
        gl.uniform1f(uniformLocations.synchrony, average(synchrony));
        gl.uniform1f(uniformLocations.aspect, window.innerWidth/window.innerHeight);

        let avg = [];

        // Update 3D brain color with your data
        for (let channel = 0; channel < eegCoords.length; channel++){
            if (displacement[0].length > channel){
            avg.push(averagePower(displacement[0][channel]));
            } else {
                avg.push(0);
            }
        }

        let totalAvg = average(avg);
        let std = standardDeviation(avg);

        let relPowers = new Array(eegCoords.length).fill(0)
        let pow;
        for (let channel = 0; channel < avg.length; channel++){
            pow = (avg[channel] - totalAvg)/std;
            if (isNaN(pow)){
                relPowers[channel] = 0;
            } else {
                relPowers[channel] = pow;
            }
        }
        gl.uniform1fv(uniformLocations.eeg_power, new Float32Array(relPowers));


        // Ease camera
        if (cameraHome != cameraCurr) {

            // Reset camera in context
            mat4.invert(viewMatrix, viewMatrix);
            mat4.translate(viewMatrix, viewMatrix, [0, 0, -cameraCurr]);

            // Update camera position
            diff = cameraHome - cameraCurr
            if (Math.abs(diff) <= epsilon) {
                cameraCurr = cameraHome;
            } else {
                cameraCurr += ease_array[state][animState] * diff;
            }

            // Move to new position
            mat4.translate(viewMatrix, viewMatrix, [0, 0, cameraCurr]);
            mat4.invert(viewMatrix, viewMatrix);
        }


        // Ease points around
        if (ease){
            // if (!holdStatus) {
            //
            // for (let ind in vertexHome){
            //     diff = vertexHome[ind] - vertexCurr[ind]
            //     if (diff <= Math.abs(.01)){
            //         vertexCurr[ind] = vertexHome[ind];
            //     } else {
            //         vertexCurr[ind] += DAMPING * diff;
            //     }
            // }

            for (let point =0; point < vertexHome.length/3; point++){
                for (let ind=0;ind < 3; ind++) {
                        diff = vertexHome[3 * point + ind] - vertexCurr[3 * point + ind]
                        if (Math.abs(diff) <= epsilon) {
                            vertexCurr[3 * point + ind] = vertexHome[3 * point + ind];
                        } else {
                            vertexCurr[3 * point + ind] += ease_array[state][animState] * diff;
                        }
                    }}
            // } else {
            //     forceSink = vec3.create()
            //     forceSink = vec3.set(forceSink,x,y,0); //(y-window.innerHeight/2)
            //     forceSink = vec3.transformMat4(forceSink,forceSink,mvpMatrix);
            //     console.log(forceSink);
            //     for (let point =0; point < vertexHome.length/3; point++) {
            //         for (let ind = 0; ind < 3; ind++) {
            //             // Specify x,y,z based on center = 0
            //             vertexVel[3 * point + ind] += (forceSink[ind] - vertexCurr[3 * point + ind]) / 1000
            //             vertexCurr[3 * point + ind] += vertexVel[3 * point + ind];
            //         }
            //     }
            // }
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexCurr), gl.DYNAMIC_DRAW);
        }

        // Draw
        gl.drawArrays(render_array[state][animState], 0, vertexCurr.length / 3);

        // Update states for next animation loop
        prevState = state;

        if (shape_array[state][animState] != 'voltage') {
            t++;
        }
    };
    animate()
}
