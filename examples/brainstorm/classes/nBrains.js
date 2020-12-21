
class BrainsAtPlay {
    constructor(input) {
        this.users = new Map();
        if (input == undefined){
            this.userVoltageBuffers = []
            this.userOtherBuffers = []
        } else{
            this.add(input)
        }
        this.synchronyBuffer = new Array(SYNCHRONY_BUFFER_SIZE).fill(0)
        this.synchronyChannels = new Array(channels).fill(0);
        this.synchrony = 0;
        this.eegChannelCoordinates = this.getEEGCoordinates()
        this.eegChannelsOfInterest = []
        this.connection;
        this.me;
        this.username;
        this.nInterfaces = 0;
        this.public = true;

        this.generate = false;
        this.base_freq = 1;
        this.samplerate = 125;
        this.generatedSamples = 0;
    }


    getMyIndex(){
        let user = 0;
        let gotMe = false;

        this.users.forEach((_,key) => {
            if (key == this.username || key == 'me'){
                this.me = user;
                gotMe = true;
            }
            user++
        })

        if (!gotMe){
            this.me = undefined;
        }
    }

    simulate(count){
        this.users.clear()
        this.add('me')
        for (let i = 1; i < count; i++){
            this.add('other'+i);
        }
        this.getMyIndex()
        this.updateEEGChannelsOfInterest()
        this.username = "me"
        this.generate = true;
    }

    add(id,channelNames) {
        let brain; 
        if (channelNames == undefined){
            brain = new Brain(id)
        } else {
            brain = new Brain(id,channelNames)
        }
        this.users.set(id, brain)
        this.initializeBuffer('userOtherBuffers')
        this.initializeBuffer('userVoltageBuffers')
    }

    remove(id){
        this.users.delete(id)
        this.initializeBuffer('userOtherBuffers')
        this.initializeBuffer('userVoltageBuffers')
    }

    getMaxChannelNumber(){
        let chansPerUser = []
        this.users.forEach((brain) => {
            chansPerUser.push(brain.numChannels)
        })
        return chansPerUser.reduce((acc,curr) => {return (Math.max(acc,curr))})
    }


    stdev(dataOfInterest){
        let totalAvg = average(dataOfInterest);
        let std = standardDeviation(dataOfInterest);

        let relData = new Array(this.eegChannelsOfInterest.length).fill(0)
        let dev;

        this.eegChannelsOfInterest.forEach((channel,ind) => {
            dev = (dataOfInterest[ind] - totalAvg)/std;
            if (isNaN(dev) && ['voltage','delta','theta','alpha','beta','gamma'].includes(scenes[state].signaltype)){
                relData[channel] = 0;
            } else if (isNaN(dev) && ['synchrony'].includes(scenes[state].signaltype)) {
                relData[channel] = projectionData[channel];
            }
            else {
                relData[channel] = dev;
            }
        })
        return relData
    }

    getPower(relative=false){
        let dataOfInterest = [];
        let power = new Array(this.eegChannelsOfInterest.length).fill(NaN);
        this.eegChannelsOfInterest.forEach((channel,ind) => {
            if (this.userVoltageBuffers[this.me].length > ind){
                power[channel] = averagePower(this.userVoltageBuffers[this.me][ind])
                dataOfInterest.push(power[channel])
            }
        })

        if (relative){
            power = this.stdev(dataOfInterest)
        }

        return power
    }

    getBandPower(band, relative=false){
        let dataOfInterest = [];
        let bandpower = new Array(this.eegChannelsOfInterest.length).fill(NaN);
        this.eegChannelsOfInterest.forEach((channel,ind) => {
            if (this.userVoltageBuffers[this.me].length > ind){
                bandpower[channel] = bci.bandpower(this.userVoltageBuffers[this.me][ind], this.samplerate, band, {relative: false});
                dataOfInterest.push(bandpower[channel])
            }
        })

        if (relative){
            bandpower = this.stdev(dataOfInterest)
        }

        return bandpower
    }


    getSynchrony(method="pcc") {

        let channelSynchrony = [];

        this.synchronyBuffer.shift()
        if (this.users.size > 1){
            // Generate edge array
            let keys = brains.users.keys()
            let edgesArray = [];
            let currentEdge = []
            // pairwise
            currentEdge.push(keys.next().value) // Brain 1
            currentEdge.push(keys.next().value) // Brain 2
            edgesArray.push(currentEdge)

            if (method == 'pcc') {
                
                // Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/

                edgesArray.forEach((edge) => {

                    let xC = this.users.get(edge[0]).buffer
                    let yC = this.users.get(edge[1]).buffer
                    let numChannels = Math.min(xC.length,yC.length)

                    for (let channel = 0; channel < numChannels; channel++){

                    let x = xC[channel]
                    let y = yC[channel]

                    var shortestArrayLength = 0;

                    if (x.length == y.length) {
                        shortestArrayLength = x.length;
                    } else if (x.length > y.length) {
                        shortestArrayLength = y.length;
                        // console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
                    } else {
                        shortestArrayLength = x.length;
                        // console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
                    }

                    var xy = [];
                    var x2 = [];
                    var y2 = [];

                    for (var i = 0; i < shortestArrayLength; i++) {
                        xy.push(x[i] * y[i]);
                        x2.push(x[i] * x[i]);
                        y2.push(y[i] * y[i]);
                    }

                    var sum_x = 0;
                    var sum_y = 0;
                    var sum_xy = 0;
                    var sum_x2 = 0;
                    var sum_y2 = 0;

                    for (var i = 0; i < shortestArrayLength; i++) {
                        sum_x += x[i];
                        sum_y += y[i];
                        sum_xy += xy[i];
                        sum_x2 += x2[i];
                        sum_y2 += y2[i];
                    }

                    var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
                    var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
                    var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
                    var step4 = Math.sqrt(step2 * step3);
                    var answer = step1 / step4;

                    if (channel >= channelSynchrony.length){
                        channelSynchrony.push([answer])
                    } else {
                        channelSynchrony[channel].push(answer)
                    }
                }
                })

                this.synchronyChannels = channelSynchrony.map((channelData) => {return channelData.reduce(sum, 0) / channelData.length})
            } else {
                this.synchronyChannels = new Array(channels).fill(0)
            }

            if (!isNaN(average(this.synchronyChannels))) {
                this.synchronyBuffer.push(average(this.synchronyChannels))
            } else {
                this.synchronyBuffer.push(0)
            }        
        } else {
            this.synchronyChannels = new Array(channels).fill(0);
            this.synchronyBuffer.push(this.synchronyChannels)
        }

        this.synchrony = average(this.synchronyBuffer)
    }

    initializeBuffer(buffer=undefined) {

        let b = [];
        let user;
        let users;
        if (buffer == 'userOtherBuffers'){
            users = 1;
        } else {
            users = this.users.size;
        }

        let perUser = Math.floor(pointCount/(users*channels))

        for(user=0; user < users; user++){
            b.push([])
            for(let chan=0; chan < channels; chan++){
                b[user].push(new Array(perUser).fill(0.0));
            }
        }

        let remainder = pointCount - channels*users*perUser
            for (let chan = 0; chan < channels; chan++) {
                for (user = 0; user < users; user++)
                    if (remainder > 0) {
                        remainder--;
                        b[user][chan].push(0.0)
                    }
            }
        
        if (buffer != undefined){
            this[buffer] = b;
        }
    }

    // reallocateUserBuffers(ind) {

    //     console.log('reallocating')
    //     let currUsers = this.userVoltageBuffers.length
    //     let targetUsers = this.users.size     
    //     let perUser = Math.floor(pointCount/(targetUsers*channels))

    //     if (targetUsers - currUsers > 0){

    //         this.userVoltageBuffers.forEach((userData, user) => {
    //             this.userVoltageBuffers[user].splice(0,this.userVoltageBuffers[user].length - perUser)
    //         })
            
    //         this.userVoltageBuffers.push(new Array(perUser).fill(0))

    //     } else {
    //         this.userVoltageBuffers.splice(ind,1)
    //         this.userVoltageBuffers.forEach((userData, user) => {
    //             this.userVoltageBuffers[user].push(new Array(perUser - this.userVoltageBuffers[user].length).fill(0))
    //         })
    //     }
    // }

    generateVoltageStream(){
            let channels = this.eegChannelsOfInterest.length

            this.users.forEach((user) => {
                let signal = new Array(channels);
                // let amp = Math.random()
                for (let channel =0; channel < channels; channel++) {
                    signal[channel] = bci.generateSignal([Math.random()], [this.base_freq+Math.random()*40], this.samplerate, (1/this.base_freq));
                }
        
                let startTime = Date.now()
                let time = makeArr(startTime,startTime+(1/this.base_freq),(1/this.base_freq)*this.samplerate)
        
                let data = {
                    signal: signal,
                    time: time
                }
                user.streamIntoBuffer(data)
            })
        }
    

    update() {
        // Generate signal if specified
        if (this.generate) {
            if (this.generatedSamples == Math.round(this.samplerate*(1/this.base_freq))-1){
                this.generateVoltageStream()
                this.generatedSamples = 0;
            } else {
                this.generatedSamples += 1
        }}

        this.getSynchrony('pcc')
        this.updateBuffer('brains','userVoltageBuffers')
    }

    updateBuffer(source='brains',buffer='userVoltageBuffers'){
        let userInd;

        if (source == 'brains'){
            userInd = 0;
            this.users.forEach((brain) => {
                brain.buffer.forEach((channelData, channel) => {
                    let sustain;
                    if(this[buffer][userInd][channel] != undefined){
                        if (this[buffer][userInd][channel].every(item => item === 0)){
                            sustain = this[buffer][userInd][channel].length;
                        } else {
                            sustain = SIGNAL_SUSTAIN
                        }
                    if (channelData.length != 0){
                        channelData = new Array(sustain).fill(brain.buffer[channel].shift())
                    } else {
                        channelData = new Array(sustain).fill(0)
                    }
                    this[buffer][userInd][channel].splice(0,sustain)
                    this[buffer][userInd][channel].push(...channelData)
                }
                }
                )
                userInd++;
            })
        } else {
                userInd = this.me 
                if (userInd != undefined){      
                    let userData = this[buffer][userInd]
                    userData.forEach((channelData,channel) => {
                        if (channelData.length != 0){
                            channelData = new Array(SIGNAL_SUSTAIN).fill(source[channel])
                        } else {
                            channelData = new Array(SIGNAL_SUSTAIN).fill(0)
                        }
                        this[buffer][userInd][channel].splice(0,SIGNAL_SUSTAIN)
                        this[buffer][userInd][channel].push(...channelData)
                    })
            }
        }
    }

    BufferToWebGL(buffer='userVoltageBuffers'){
            return new Float32Array([...this[buffer].flat(2)])
    }

    BufferToWebGL_Normalized(buffer='userVoltageBuffers'){
        let _temp = this.normalizeUserBuffers(this[buffer]);
        return new Float32Array([..._temp.flat(2)])
    }

    normalizeUserBuffers(buffer) {
        let _temp = buffer.map((userData) => {
            return userData.map((channelData) => {
                let chanMax = max(channelData)
                let chanMin = min(channelData)
                let scaling = (window.innerHeight/6)/channels;
                if (chanMin != chanMax){
                    return channelData.map(normalize(chanMin,chanMax,scaling))
                } else{
                    return channelData.map((val) => {return val*scaling})
                }
                
            })
        })
        return _temp
    }

    updateEEGChannelsOfInterest() {
        this.eegChannelsOfInterest = []
        let myBrain;        
        Object.keys(this.eegChannelCoordinates).forEach((name,ind) => {
            myBrain = brains.users.get(this.username)
            if (myBrain == undefined){
                myBrain = brains.users.get('me')
            }
    
            if (myBrain != undefined){
                if (myBrain.channelNames.includes(name)){
                    this.eegChannelsOfInterest.push(ind)
                }
            }
        })
    }

    // Networking Suite
    connect(url){

    let BrainsAtPlay = this;

    if (this.connection) {
        this.connection.onerror = connection.onopen = connection.onclose = null;
        this.connection.close();
    }

    if (url.protocol == 'http:'){
        this.connection = new WebSocket(`ws://` + url.hostname,[this.username, 'interfaces']);
    } else if (url.protocol == 'https:'){
        this.connection = new WebSocket(`wss://` + url.hostname,[this.username, 'interfaces']);
    } else{
        console.log('invalid protocol')
        return
    }

    this.connection.onerror = function () {
        console.log('error')
        showMessage('WebSocket error');
        announcement('WebSocket error.\n Please refresh your browser and try again.');
    };

    this.connection.onopen = function () {
        showMessage('WebSocket connection established')
        BrainsAtPlay.connection.send(JSON.stringify({'destination':'initializeBrains','public': BrainsAtPlay.public}));
        state = 3;
    };

    this.connection.onmessage = function (msg) {

        let obj = JSON.parse(msg.data);
        if (obj.destination == 'bci'){
            if (BrainsAtPlay.users.get(obj.id) != undefined){
                BrainsAtPlay.users.get(obj.id).streamIntoBuffer(obj.data)
            } 
            updateChannels(BrainsAtPlay.getMaxChannelNumber())

        } else if (obj.destination == 'init'){

            BrainsAtPlay.users.clear()

            if (obj.privateBrains && BrainsAtPlay.public === false){
                BrainsAtPlay.add(obj.privateInfo.id, obj.privateInfo.channelNames)
            } else {
                for (let newUser = 0; newUser < obj.nBrains; newUser++){
                    if (BrainsAtPlay.users.get(obj.ids[newUser]) == undefined && obj.ids[newUser] != undefined){
                        if (BrainsAtPlay.public){
                            BrainsAtPlay.add(obj.ids[newUser], obj.channelNames[newUser])
                        } else {
                            if (obj.ids[newUser] == this.username){
                                BrainsAtPlay.add(obj.ids[newUser], obj.channelNames[newUser])
                            }
                        }
                    }
                }
            }

            if (BrainsAtPlay.users.size == 0){
                BrainsAtPlay.add('me');
            }

            BrainsAtPlay.generate = false;
            stateManager(true)
            BrainsAtPlay.updateEEGChannelsOfInterest()
            BrainsAtPlay.initializeBuffer('userVoltageBuffers')

            BrainsAtPlay.nInterfaces = obj.nInterfaces;

            // Announce number of brains currently online

            if (BrainsAtPlay.public === true && (obj.nBrains > 0) && BrainsAtPlay.users.get('me') == undefined){
                announcement(`<div>Welcome to the Brainstorm
                                <p class="small">${BrainsAtPlay.users.size} brains online</p></div>`)
                document.getElementById('nBrains').innerHTML = `${BrainsAtPlay.users.size}`
            } else if (BrainsAtPlay.public === false) {
                if (obj.privateBrains){
                    document.getElementById('nBrains').innerHTML = `1`
                } else {
                    if (BrainsAtPlay.users.has("me")){
                        document.getElementById('nBrains').innerHTML = `0`
                    } else {
                        document.getElementById('nBrains').innerHTML = `${BrainsAtPlay.users.size}`
                    }
                }
            } else {
                announcement(`<div>Welcome to the Brainstorm
                                <p class="small">No brains online</p></div>`)
                document.getElementById('nBrains').innerHTML = `0`
            }
            if (BrainsAtPlay.public === false) {
                document.getElementById('nInterfaces').innerHTML = `1`
            } else {
                document.getElementById('nInterfaces').innerHTML = `${BrainsAtPlay.nInterfaces}`
            }

            BrainsAtPlay.getMyIndex()
        }

        else if (obj.destination == 'brains'){
            // let reallocationInd;
            update = obj.n;

            // Only update if access matches
            if ((BrainsAtPlay.public) || (!BrainsAtPlay.public && obj.access === 'private')){
                if (update == 1){
                        if (BrainsAtPlay.public){
                            document.getElementById('nBrains').innerHTML = `${BrainsAtPlay.users.size + 1}`
                            BrainsAtPlay.add(obj.id, obj.channelNames)
                            BrainsAtPlay.remove('me')
                        } else if (!BrainsAtPlay.public && obj.access === 'private') {
                            BrainsAtPlay.add(obj.id, obj.channelNames)
                            document.getElementById('nBrains').innerHTML = `1`
                            BrainsAtPlay.remove('me')
                        }
                        reallocationInd = BrainsAtPlay.users.size - 1
                } else if (update == -1){
                    // get index of removed id
                    let iter = 0;
                    BrainsAtPlay.users.forEach((key) =>{
                        if (key == obj.id){
                            reallocationInd = iter
                        }
                        iter++
                    })

                    if (BrainsAtPlay.public){
                        if (BrainsAtPlay.users.size == 0){
                            announcement('all users left the brainstorm')
                            document.getElementById('nBrains').innerHTML = `0`
                            BrainsAtPlay.add('me')
                        } else {
                            document.getElementById('nBrains').innerHTML = `${BrainsAtPlay.users.size-1}`
                        }
                    } else if (!BrainsAtPlay.public && obj.access === 'private'){
                        document.getElementById('nBrains').innerHTML = `0`
                        BrainsAtPlay.add('me')
                    }

                    // delete id from map
                    BrainsAtPlay.remove(obj.id)
                }
                
                if (state != 0){
                    stateManager(true)
                    // brains.reallocateUserBuffers(reallocationInd);
                }
                BrainsAtPlay.initializeBuffer('userVoltageBuffers')
                BrainsAtPlay.updateEEGChannelsOfInterest()
            }

            BrainsAtPlay.getMyIndex()

            } 
            else if (obj.destination == 'interfaces'){
                BrainsAtPlay.nInterfaces += obj.n;
                document.getElementById('nInterfaces').innerHTML = `${BrainsAtPlay.nInterfaces}`
            } 
            else {
            console.log(obj)
        }
    };

    this.connection.onclose = function () {
        showMessage('WebSocket connection closed');
        BrainsAtPlay.connection = undefined;
        announcement(`<div>Exiting the Brainstorm
        <p class="small">Thank you for playing!</p></div>`)
        if (window.innerWidth >= 768) {
            document.getElementById('id-params').style.display = `none`;
            document.getElementById('nBrains-params').style.display = `none`;
            document.getElementById('nInterfaces-params').style.display = `none`;
        }
        document.getElementById('access-mode-div').innerHTML = ` 
        <p id="access-mode" class="small">Not Connected</p>
          `
        BrainsAtPlay.nInterfaces = undefined;
        document.getElementById("connection-button").innerHTML = 'Connect'; 
        BrainsAtPlay.simulate(2)
        stateManager(true)
        BrainsAtPlay.generate = true;
        BrainsAtPlay.getMyIndex()
    };
}

    // Included Data
    getEEGCoordinates(){
        return {
            Fp1: [-21.2, 66.9, 12.1],
            Fpz: [1.4, 65.1, 11.3],
            Fp2: [24.3, 66.3, 12.5],
            Af7: [-41.7, 52.8, 11.3],
            Af3: [-32.7, 48.4, 32.8],
            Afz: [1.8, 54.8, 37.9],
            Af4: [35.1, 50.1, 31.1],
            Af8: [43.9, 52.7, 9.3],
            F7: [-52.1, 28.6, 3.8],
            F5: [-51.4, 26.7, 24.7],
            F3: [-39.7, 25.3, 44.7],
            F1: [-22.1, 26.8, 54.9],
            Fz: [0.0, 26.8, 60.6],
            F2: [23.6, 28.2, 55.6],
            F4: [41.9, 27.5, 43.9],
            F6: [52.9, 28.7, 25.2],
            F8: [53.2, 28.4, 3.1],
            Ft9: [-53.8, -2.1, -29.1],
            Ft7: [-59.2, 3.4, -2.1],
            Fc5: [-59.1, 3.0, 26.1],
            Fc3: [-45.5, 2.4, 51.3],
            Fc1: [-24.7, 0.3, 66.4],
            Fcz: [1.0, 1.0, 72.8],
            Fc2: [26.1, 3.2, 66.0],
            Fc4: [47.5, 4.6, 49.7,],
            Fc6: [60.5, 4.9, 25.5],
            Ft8: [60.2, 4.7, -2.8],
            Ft10: [55.0, -3.6, -31.0],
            T7: [-65.8, -17.8, -2.9],
            C5: [-63.6, -18.9, 25.8],
            C3: [-49.1, -20.7, 53.2],
            C1: [-25.1, -22.5, 70.1],
            Cz: [0.8, -21.9, 77.4],
            C2: [26.7, -20.9, 69.5],
            C4: [50.3, -18.8, 53.0],
            C6: [65.2, -18.0, 26.4],
            T8: [67.4, -18.5, -3.4],
            Tp7: [-63.6, -44.7, -4.0],
            Cp5: [-61.8, -46.2, 22.5],
            Cp3: [-46.9, -47.7, 49.7],
            Cp1: [-24.0, -49.1, 66.1],
            Cpz: [0.7, -47.9, 72.6],
            Cp2: [25.8 ,-47.1, 66.0],
            Cp4: [49.5, -45.5, 50.7],
            Cp6: [62.9, -44.6, 24.4],
            Tp8: [64.6, -45.4, -3.7],
            P9: [-50.8, -51.3, -37.7],
            P7: [-55.9, -64.8, 0.0],
            P5: [-52.7, -67.1, 19.9],
            P3: [-41.4, -67.8, 42.4],
            P1: [-21.6, -71.3, 52.6],
            Pz: [0.7, -69.3, 56.9],
            P2: [24.4, -69.9, 53.5],
            P4: [44.2, -65.8, 42.7],
            P6: [54.4, -65.3, 20.2],
            P8: [56.4, -64.4, 0.1],
            P10: [51.0, -53.9, -36.5],
            PO7: [-44.0, -81.7, 1.6],
            PO3: [-33.3, -84.3, 26.5],
            POz: [0.0, -87.9, 33.5],
            PO4: [35.2, -82.6, 26.1],
            PO8: [43.3, -82.0, 0.7],
            O1: [-25.8, -93.3, 7.7],
            Oz: [0.3, -97.1, 8.7],
            O2: [25.0,-95.2,6.2],
            }
    }
}
