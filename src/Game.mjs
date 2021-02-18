export class Game {
    constructor(gameName = 'untitled') {
        this.initialize()
        this.gameName = gameName;
        this.bluetooth = {
            device: undefined,
            channelNames: [],
        }
    }

    initialize(ignoreMe=false) {

        // if (!ignoreMe || this.brains === undefined){
            this.brains = {
                public: new Map(),
                private: new Map()
            }         
        // } else {
        //     let usernames = this.getUsernames()
        //     let accessLevels = ['public','private']
        //     accessLevels.forEach(access => {
        //         if (access === this.info.access){
        //             usernames.forEach(username => {
        //         if (username !== this.me.username){
        //             this.brains[this.info.access].delete(username)
        //         }
        //         })
        //         } else {
        //             this.brains[access] = new Map();
        //         }
        //     })
        // }

        this.eegCoordinates = eegCoordinates

        this.usedChannels = []
        this.commonChannels = []
        this.usedChannelNames = []
        this.commonChannelNames = [];
        this.connectionMessageBuffer = [];

        if (!this.connection) {
            this.connection = {}
            this.connection.ws = undefined
            this.connection.status = false

            this.me = {
                username: 'me',
                index: undefined,
            };
        }

        this.info = {
            interfaces: 0,
            brains: 0,
            usernames: [],
            access: 'public',
            simulated: false
        }

        this.simulation = {
            generate: false,
            baseFrequency: 1,
            sampleRate: 250,
            duration: 1.0
        }

        this.metrics = {
            synchrony: {
                value: 0,
                channels: Array(Object.keys(this.eegCoordinates).length).fill(0),
            }
        }

        this.simulation.generatedSamples = Math.round(this.simulation.sampleRate * this.simulation.duration)
        this.initializeSession()
        this.setUpdateMessage()
    }

    newGame(name){
      this.initialize()
      this.gameName = name;
    }

    setUpdateMessage(obj) {
        if (obj === undefined) {
            this.connectionMessageBuffer = [{destination: []}];
        } else {
            if (this.connectionMessageBuffer[0].destination === undefined || this.connectionMessageBuffer[0].destination.length === 0) {
                this.connectionMessageBuffer = [obj]
            } else {
                this.connectionMessageBuffer.push(obj)

            }
        }
    }


    getMyIndex() {
        let user = 0;
        let gotMe = false;

        this.brains[this.info.access].forEach((_, key) => {
            if (key === this.me.username) {
                this.me.index = user;
                gotMe = true;
            }
            user++
        })

        if (!gotMe) {
            this.me.index = undefined;
        }
    }

    getUsernames(){
        return Array.from( this.brains[this.info.access].keys())
    }

    simulate(count) {
        if (!this.bluetooth.device){
            this.add('me')
        }
        for (let i = 0; i < count-1; i++) {
            this.add('other' + (i+1));
        }
        this.info.brains = count;
        this.getMyIndex()
        this.updateUsedChannels()

        this.simulation.buffers = {
            voltage: Array.from({length: count}, e => Array.from({length: this.usedChannels.length}, e => []),),
            time: []
        }
        this.simulation.generate = true;
        this.info.simulated = true;
    }


    add(id, channelNames, access = 'public') {
        let brain;
        if (channelNames === undefined) {
            brain = new Brain(id)
        } else {
            brain = new Brain(id, channelNames)
        }

        this.brains[access].set(id, brain)
        if (id === "me" && this.info.simulated === false) {
            this.info.brains = this.brains[access].size - 1
        } else {
            this.info.brains = this.brains[access].size
        }

        if (access === this.info.access) {
            this.getMyIndex()
            this.updateUsedChannels()
        }
    }

    remove(id, access = 'public') {
        this.brains[access].delete(id)
        this.info.brains = this.brains[access].size
        this.getMyIndex()
        this.updateUsedChannels()
    }

    generateSignal(amplitudes = [], frequencies = [], samplerate = 256, duration = 1, phaseshifts = new Array(amplitudes.length).fill(0)) {
        let al = amplitudes.length;
        let fl = frequencies.length;
        let pl = phaseshifts.length;

        if (al !== fl || fl !== pl) {
            console.error('Amplitude array, frequency array, and phaseshift array must be of the same length.')
        }

        let signal = new Array(Math.round(samplerate * duration)).fill(0)

        frequencies.forEach((frequency, index) => {
            for (let point = 0; point < samplerate * duration; point++) {
                signal[point] += amplitudes[index] * Math.sin(2 * Math.PI * frequency * (point + phaseshifts[index]) / samplerate)
            }
        })
        return signal
    }

    generateVoltageStream() {
        let n = 5;
        let usernames = this.getUsernames()
        usernames.forEach((username,ind) => {
            let user = this.brains['public'].get(username)
            if (this.me.username !== username || this.bluetooth.device === undefined){
            for (let channel = 0; channel < user.channelNames.length; channel++) {
                this.simulation.buffers.voltage[ind][channel].push(...this.generateSignal(new Array(n).fill(50), Array.from({length: n}, e => Math.random() * 50), this.simulation.sampleRate, this.simulation.duration, Array.from({length: n}, e => Math.random() * 2*Math.PI)));
            }
        }
        })

        let startTime = Date.now()
        let cardinality = (1 / this.simulation.baseFrequency) * this.simulation.sampleRate;
        let step = (1 / this.simulation.baseFrequency) / (cardinality - 1);
        for (let i = 0; i < cardinality; i++) {
            this.simulation.buffers.time.push(startTime + (step * i));
        }
    }

    update() {
        // Generate signal if specified
        if (this.simulation.generate) {
            if (this.simulation.generatedSamples === Math.round(this.simulation.sampleRate * this.simulation.duration)) {
                this.generateVoltageStream()
                this.simulation.generatedSamples = 0;
            } else {
                this.simulation.generatedSamples += 1
            }
            let usernames = this.getUsernames()
            usernames.forEach((username,ind) => {
                this.brains[this.info.access].get(username).loadData({
                    signal: this.simulation.buffers.voltage[ind].map((channel) => [channel.shift()]),
                    time: [this.simulation.buffers.time.shift()]
                })
            })
        }
        this.setUpdateMessage()
        this.updateSession()
    }

    async getMetric(metricName,username) {
        // if ((this.connection === undefined) || (location === 'local')){
        if (metricName === 'synchrony') {
            let dict = {}
            dict.channels = this.synchrony('pcc')
            let valuesOfInterest = [];
            this.usedChannels.forEach((channelInfo) => {
                valuesOfInterest.push(dict.channels[channelInfo.index])
            })
            let avg = valuesOfInterest.reduce((a, b) => a + b, 0) / valuesOfInterest.length;
            if (!isNaN(avg)) {
                dict.average = avg;
            } else {
                dict.average = 0;
            }
            return dict
        } else {
            if (this.brains[this.access].has(username)){
                return this.brains[this.access].get(username).getMetric(metricName)              
            } else {
                return this.brains[this.access].get(this.me.username).getMetric(metricName)              
            }
        } 
    // } else {
    //     if (this.connection === undefined){
    //         val = 0
    //     } else {
    //         val = await this.request({game:this.gameName},'POST',metricName)
    //     }
    // }
    }

    // NOTE: Fix
    flatten(metricName = 'voltage', normalize = false) {
        let _temp = this.metrics[metricName].buffer;
        if (normalize) {
            _temp = this.normalizeUserBuffers(this.metrics[metricName].buffer);
        }
        // Upsample Buffer
        return new Float32Array([..._temp.flat(2)])
    }

    updateUsedChannels() {
        this.usedChannels = [];
        this.usedChannelNames = [];
        this.commonChannels = [];
        this.commonChannelNames = [];

        // Extract All Used EEG Channels
        this.brains[this.info.access].forEach((user) => {
            user.usedChannels.forEach((channelData) => {
            let name = channelData.name
            if (channelData.index !== -1 && this.usedChannelNames.indexOf(name) === -1) {
                this.usedChannels.push({name: name, index: channelData.index})
                this.usedChannelNames.push(name)
            } else if (this.usedChannelNames.indexOf(name) !== -1 && this.commonChannelNames.indexOf(name) === -1){
                this.commonChannels.push({name: name, index: channelData.index})
                this.commonChannelNames.push(name)
            }
        })
    })
    }
    
    //
    //
    // Metric
    //
    //

    synchrony(method = "pcc") {
        let channelSynchrony = Array.from({length: Object.keys(this.eegCoordinates).length}, e => Array());
        if (this.brains[this.info.access].size > 1) {
            let edgesArray = [];
            let usernames = this.getUsernames()
            if (this.me.index && usernames.includes(this.me.username)) {
                usernames.splice(usernames.indexOf(this.me.username),1)
                usernames.forEach((username) => {
                    edgesArray.push([this.me.username, username])
                })
            } else {
                let pairwise = (list) => {
                    if (list.length < 2) {
                        return [];
                    }
                    var first = list[0],
                        rest = list.slice(1),
                        pairs = rest.map(function (x) {
                            return [first, x];
                        });
                    return pairs.concat(pairwise(rest));
                }
                edgesArray = pairwise(usernames)
            }

            if (method === 'pcc') {
                // Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/

                edgesArray.forEach((edge) => {
                    let xC = this.brains[this.info.access].get(edge[0]).getVoltage()
                    let yC = this.brains[this.info.access].get(edge[1]).getVoltage()
                    this.usedChannelNames.forEach((_,ind) => {
                        let channel = this.usedChannels[ind].index
                        let x = xC[channel]
                        let y = yC[channel]

                        var shortestArrayLength = 0;

                        if (x.length === y.length) {
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

                        if (!channelSynchrony[channel]) {
                            channelSynchrony[channel] = [];
                        }
                        channelSynchrony[channel].push(answer)
                    })
                })

                return channelSynchrony.map((channelData) => {
                    return channelData.reduce((a, b) => a + b, 0) / channelData.length
                })
            } else {
                return new Array(Object.keys(this.eegCoordinates).length).fill(0)
            }
        } else {
            return new Array(Object.keys(this.eegCoordinates).length).fill(0);
        }
    }

    //
    //
    // Access
    //
    //

    access(type) {
        if (type === undefined) {
            type = this.info.access
        } else {
            this.info.access = type;
        }
        this.info.brains = this.brains[this.info.access].size
        this.getMyIndex()
        this.updateUsedChannels()
        this.setUpdateMessage({destination: 'update'})
        return type
    }

    //
    //
    // Bluetooth Low Energy Connection
    //
    //

    async connectBluetoothDevice(connectedClient, type='muse'){
        if (connectedClient){ // && typeof window !== 'undefined' && typeof process === 'object'
            if (type === 'muse'){
        this.bluetooth.device = connectedClient
        this.bluetooth.channelNames = 'TP9,AF7,AF8,TP10,AUX' // Muse 
        await this.bluetooth.device.start();
        this.remove('me')
        if (this.connection.status){
            this.add('me', this.bluetooth.channelNames)
        } else {
            this.add(this.me.username, this.bluetooth.channelNames)
        }
        this.updateBrainRoutine()
        this.bluetooth.device.eegReadings.subscribe(r => {
            let me = this.brains[this.info.access].get(this.me.username)
            if (me !== undefined) {
                if ((this.connection.status)) {
                    let data = new Array(me.numChannels)
                    data[r.electrode] = r.samples;
                    let message = {
                        destination: 'bci', 
                        id: this.me.username,
                    'data': {signal:[r.samples],time:[r.timestamp],electrode:r.electrode}
                    }
                    message = JSON.stringify(message)
                    this.connection.ws.send(message)
                } else {
                    if (this.brains[this.info.access].get(this.me.username)){
                    this.brains[this.info.access].get(this.me.username).loadData({signal:[r.samples],time:[r.timestamp],electrode:r.electrode})
                    }
                }
            }
          })
        }
        
        } 
        else {
            console.error('A connected MuseClient object from the muse-js library must be passed.')
        }
    }

    //
    //
    // Data Management and Networking
    //
    //

    disconnect() {
        this.connection.ws.close();
        this.setUpdateMessage({destination: 'closed'})
    }

    updateBrainRoutine(obj = {}) {
        this.updateUsedChannels()
        this.getMyIndex()
        obj.destination = 'update'
        this.setUpdateMessage(obj)
    }

    establishWebsocket(type='interfaces'){
        
        let connection;
        let cookies;

        if (type==='interfaces'){
            cookies = [this.me.username, type, this.gameName]
        } else if (type==='bidirectional') {
            cookies = [this.me.username,type,this.gameName,this.info.access,...this.bluetooth.channelNames.split(',')]
        }

        if (this.url.protocol === 'http:') {
            connection = new WebSocket(`ws://` + this.url.hostname, cookies);
        } else if (this.url.protocol === 'https:') {
            connection = new WebSocket(`wss://` + this.url.hostname, cookies);
        } else {
            console.log('invalid protocol')
            return
        }
        connection = this.setWebsocketMethods(connection,type)
        this.connection.ws = connection
    }

    setWebsocketMethods(connection=undefined, type='interfaces'){
        if (connection){
                connection.onerror = () => {
                    this.setUpdateMessage({destination: 'error'})
                    this.info.simulated = true
                };
        
                connection.onopen = () => {
                    this.initialize()
                    this.send('initializeBrains')
                    this.info.brains = undefined
                    this.info.interfaces = undefined
                    this.connection.status = true
                };
        
                connection.onmessage = (msg) => {
        
                    let obj = JSON.parse(msg.data);
                    if (obj.destination === 'bci') {
                        if (this.brains[this.info.access].get(obj.id) !== undefined) {
                            this.brains[this.info.access].get(obj.id).loadData(obj.data)
                        }
                    } else if (obj.destination === 'init') {
                        if (obj.privateBrains) {
                            this.add(obj.privateInfo.id, obj.privateInfo.channelNames, 'private')
                        } else {
                            for (let newUser = 0; newUser < obj.nBrains; newUser++) {
                                if (this.brains.public.get(obj.ids[newUser]) === undefined && obj.ids[newUser] !== undefined) {
                                    console.log('added a brain',obj.ids[newUser])
                                    this.add(obj.ids[newUser], obj.channelNames[newUser])
                                }
                            }
                        }
        
                        this.simulation.generate = false;
                        this.updateUsedChannels()
                        this.info.interfaces = obj.nInterfaces;
                        this.getMyIndex()
                        this.setUpdateMessage(obj)
                    } else if (obj.destination === 'brains') {
                        let update = obj.n;
                        // Only update if access matches
                        if (update === 1) {
                            this.add(obj.id, obj.channelNames, obj.access)
                        } else if (update === -1) {
                            this.remove(obj.id, obj.access)
                        }
                        this.updateBrainRoutine(obj)
                    } else if (obj.destination === 'interfaces') {
                        this.info.interfaces += obj.n;
                        obj.destination = 'update'
                        this.setUpdateMessage(obj)
                    } else if (obj.destination === 'bidirectional') {
                        let update = obj.n;
                        // Only update if access matches
                        if (update === 1) {
                            this.add(obj.id, obj.channelNames, obj.access)
                        } else if (update === -1) {
                            this.remove(obj.id, obj.access)
                        }
                        this.info.interfaces += update;
                        obj.destination = 'update'
                        this.setUpdateMessage(obj)
                    } else {
                        console.log(obj)
                    }
                };
        
                connection.onclose = () => {
                    // this.initialize()
                    this.connection.ws = undefined
                    this.connection.status = false
                    this.info.interfaces = undefined;
                    this.simulate(2)
                    this.getMyIndex()
                };
        }
        return connection
    }

    async connect(dict = {'guestaccess': true}, url = 'https://brainsatplay.azurewebsites.net/') {

        let resDict;
        resDict = await this.login(dict, url)

        if (this.bluetooth.device){
            this.establishWebsocket('bidirectional')
        } else {
            this.establishWebsocket('interfaces')
        }


        return resDict
    }
    //
    //
    // Requests
    //
    //

    send(command) {
        if (command === 'initializeBrains') {
            if (this.connection.status){
            this.connection.ws.send(JSON.stringify({'destination': 'initializeBrains', 'public': false}));
            this.setUpdateMessage({destination: 'opened'})
            }
        }
    }

    checkURL(url) {
        if (url.slice(-1) !== '/') {
            url += '/'
        }
        return url
    }


    checkPathname(pathname) {
        if (pathname.slice(0) === '/') {
            pathname.splice(0,1)
        }
        return pathname
    }

    async request(body,method='POST',pathname='',baseURL=this.url.href){
        if (pathname !== ''){
            baseURL = this.checkURL(baseURL)
            pathname = this.checkPathname(pathname)
            let dict = {
                method: method,
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            };
            
            if (method === 'POST'){
                dict.body = JSON.stringify(body);
            }

            return await fetch(baseURL + pathname, dict).then((res) => {
            return res.json().then((dict) => {                 
                return dict.message
            })
        })
            .catch(function (err) {
                console.log(`\n${err.message}`);
            });
        } else {
            console.log(`You must provide a valid pathname to request resources from ${baseURL}`)
            return
        }
    }

    async login(dict, url = 'https://brainsatplay.azurewebsites.net/') {
        url = this.checkURL(url)
        this.url = new URL(url);

        let json = JSON.stringify(dict)

        let resDict = await fetch(url + 'login',
            {
                method: 'POST',
                mode: 'cors',
                headers: new Headers({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }),
                body: json
            }).then((res) => {
            return res.json().then((message) => message)
        })
            .then((message) => {
                return message
            })
            .catch(function (err) {
                console.log(`\n${err.message}`);
            });

        if (resDict.result === 'OK') {
            this.me.username = resDict.msg;
        }
        return resDict
    }

    async signup(dict, url = 'https://brainsatplay.azurewebsites.net/') {
        url = this.checkURL(url)
        this.url = new URL(url);
        let json = JSON.stringify(dict)
        let resDict = await fetch(url + 'signup',
            {
                method: 'POST',
                mode: 'cors',
                headers: new Headers({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }),
                body: json
            }).then((res) => {
            return res.json().then((message) => message)
        })
            .then((message) => {
                console.log(`\n${message}`);
                return message
            })
            .catch(function (err) {
                console.log(`\n${err.message}`);
            });

        return resDict
    }


    // BCI Methods
    initializeSession(settings){
        this.session = {
            samples: 0,
            count: 0,
            trial: 0,
            iti: 0,
            numTrials: 0,
            t:0,
            state:'',
            type: '',
            subset: 0,
            eventDuration: 0,
            currentEventState: {state: {}, chosen: []},
            data: {events:[], voltage:[], time: []},
            results: []
        };

        if (settings !== undefined){
            this.setSessionSettings(settings)
        }
    }

    setSessionSettings(settings) {
        this.session.samples = settings.numSamples
        this.session.trial = 0;
        this.session.numTrials = settings.trials;
        this.session.iti = settings.iti;
        this.session.t = Date.now();
        this.session.state = 'pre-session';
        this.session.type = settings.name;
        this.session.subset = settings.subset;
        this.session.eventDuration = settings.eventDuration;
        this.session.currentEventState = {state: {}, chosen: []};

        let stateDict = {};

        settings.objects.forEach((name) => {
            stateDict[name] = false;
        })
        let objectDict = {state: stateDict, chosen: []}
        this.session.data.events = Array.from({length: settings.trials}, e => objectDict)
        this.session.results = Array(settings.trials).fill(NaN)
        this.session.data.voltage = Array.from({length: settings.trials}, e => Array.from({length: Object.keys(this.eegCoordinates).length}, e => []))
        this.session.data.time = Array.from({length: settings.trials}, e => Array.from({length: Object.keys(this.eegCoordinates).length}, e => []))
    }

    updateSession(){
        if (this.session && this.session.state !=='done'){
        if (['pre-session','iti'].includes(this.session.state)){
            if (this.session.t+(this.session.iti) <= Date.now()){
                this.session.state = 'trial-on';
                this.brains[this.info.access].forEach((brain) => {
                        brain.initializeStorage()
                        brain.storage.store = true;
                        brain.storage.samples = this.session.samples;
                })
                this.session.currentEventState = this.objectSelection()
                this.session.t = Date.now();
            }
        } if (['trial-on','trial-off'].includes(this.session.state)){
            let ready = [];
            let brain = this.brains[this.info.access].get(this.me.username)
            brain.usedChannels.forEach((_,ind) => {
                ready.push(brain.storage.count[ind] === this.session.samples)
            })
            if (ready.every((val) => val === true)){
                    let brain = this.brains[this.info.access].get(this.me.username)
                    brain.storage.record = false;
                    brain.storage.count = brain.storage.count.map((val) => 0);
                    this.session.data.voltage[this.session.trial] = brain.storage.data.voltage
                    this.session.data.time[this.session.trial] = brain.storage.data.time
                this.session.trial++;
                if ((this.session.trial) === this.session.numTrials){
                    this.session.state = 'done';
                    this.session.trial = NaN;
                    this.session.currentEventState = this.objectSelection(false)
                } else {
                    this.session.state = 'iti';
                    this.session.currentEventState = this.objectSelection(false)
                    this.session.t = Date.now();
                }
            } else if (this.session.t+(this.session.eventDuration) <= Date.now() && this.session.state === 'trial-on'){
                this.session.state = 'trial-off';
                this.session.currentEventState = this.objectSelection(false)
            }
        }
    }
    }
    
    objectSelection(choose=true){
        let eventState;

        if (this.session.state !=='done'){
            eventState = this.session.data.events[this.session.trial].state
        } else {
            eventState = this.session.currentEventState.state
        }

        let objKeys;
        let chosen = [];

        if (choose){
            if (this.session.trial === 0){
                objKeys = Object.keys(eventState)
            } else {
                let prevSubset = this.session.data.events[this.session.trial-1].chosen
                objKeys = Object.keys(eventState).filter((key) => !prevSubset.includes(key))
            }
            
            for (let i = 0; i < this.session.subset*objKeys.length ; i++){
                chosen.push(objKeys.splice(Math.floor(Math.random()*objKeys.length),1)[0])
            }
        }

        
        Object.keys(eventState).forEach((object) => {
            if (chosen.includes(object)){
                eventState[object] = true;
            } else {
                eventState[object] = false;
            }
        })

        if (choose){
            this.session.data.events[this.session.trial] = {state: eventState, chosen: chosen};
        } 

        return {state: eventState, chosen: chosen}
    }
}


class Brain {
    constructor(userId, channelNames){
        this.id = userId;
        this.eegCoordinates = eegCoordinates
        this.usedChannels = []
        this.channelNames = []
        this.samplerate = 125;
        this.data = {}

        if (channelNames === undefined){
            // if (typeof process === 'object'){
                channelNames = 'TP9,AF7,AF8,TP10,AUX' // Muse 
            // } else {
            //     channelNames = 'Fz,C3,Cz,C4,Pz,PO7,Oz,PO8,F5,F7,F3,F1,F2,F4,F6,F8' // OpenBCI
            // }
        }

        channelNames = channelNames.toLowerCase().split(',')
        channelNames.forEach((name) => {
            let capName = name.charAt(0).toUpperCase() + name.slice(1)
            if (Object.keys(this.eegCoordinates).indexOf(capName) !== -1){
                this.channelNames.push(capName)
                this.usedChannels.push({name:capName, index: Object.keys(this.eegCoordinates).indexOf(capName)})
            } else {
                console.log(name + ' electrode is not currently supported.')
            }
        })

        this.bufferSize = 1000
        this.buffers = {
            voltage: Array.from(Object.keys(this.eegCoordinates), e => {if (this.channelNames.includes(e)){
                return Array(this.bufferSize).fill(0)
            } else {
                return [NaN]
            }}),
            time: Array.from({length: Object.keys(this.eegCoordinates).length}, e => [])
        }

        this.initializeStorage()
    }

    initializeStorage(){
        this.storage = {
            store: false,
            count: Array(this.usedChannels.length).fill(0),
            samples: 0,
            full: false,
            data: {
                voltage: Array.from({length: Object.keys(this.eegCoordinates).length}, e => []),
                time: Array.from({length: Object.keys(this.eegCoordinates).length}, e => [])
            }
        }
    }
    
    loadData(data) {

        let signal = data.signal
        let time = data.time


        // drop data if undefined or NaN
        signal = signal.filter((arr) => {if (!arr.includes(undefined) && !arr.includes(NaN)){return arr}})

        signal.forEach((channelData, channel) => {
            if (Array.isArray(channelData)) {
                if (channelData.length > 0) {
                    if (Object.keys(data).includes('electrode')){
                        channel = data.electrode
                    }
                    this.buffers.voltage[this.usedChannels[channel].index].splice(0,channelData.length)
                    this.buffers.voltage[this.usedChannels[channel].index].push(...channelData);
                    this.buffers.time[this.usedChannels[channel].index].splice(0,time.length)
                    this.buffers.time[this.usedChannels[channel].index].push(...time);

                    if (this.storage.store === true){
                        let diff = this.storage.samples - this.storage.count[channel];
                        if (diff > 0){
                            let pushedData;
                            let pushedTime;
                            if (diff < channelData.length){
                                pushedData = channelData.splice(0,diff)
                                pushedTime = time.splice(0,diff)
                            } else {
                                pushedData = channelData
                                pushedTime = time
                            }
                            this.storage.data.voltage[this.usedChannels[channel].index].push(...pushedData)
                            this.storage.data.time.push(...pushedTime)
                            this.storage.count[channel] += pushedData.length;
                        }
                    }
                }
            }
        })


        let arbitraryFields = Object.keys(data)
        arbitraryFields = arbitraryFields.filter(e => !['signal','time'].includes(e));

        arbitraryFields.forEach((field) =>{
            this.data[field] = data[field]
        })
    }

    getVoltage(normalize=false){
        if (normalize){
            return this.normalize(this.buffers.voltage)
        } else {
            return this.buffers.voltage
        }
    }

    getMetric(metricName){
            let dict = {};
            // Derive Channel Readouts
            if (metricName === 'power') {
                dict.channels = this.power(true)
            } else if (['delta', 'theta', 'alpha', 'beta', 'gamma'].includes(metricName)) {
                dict.channels = this.bandpower(metricName, false)
            }

            // Get Values of Interest
            let valuesOfInterest = [];
            this.usedChannels.forEach((channelInfo) => {
                valuesOfInterest.push(dict.channels[channelInfo.index])
            })

            // Derive Average Value
            let avg = valuesOfInterest.reduce((a, b) => a + b, 0) / valuesOfInterest.length;
            if (!isNaN(avg)) {
                dict.average = avg;
            } else {
                dict.average = 0;
            }
            return dict 
    }

    normalize(array) {
        return array.map((channelData) => {
            let max = Math.max(...channelData)
            let min = Math.min(...channelData)
            if (min !== max) {
                return channelData.map((val) => {
                    var delta = max - min;
                    return ((val - min) / delta)
                })
            } else {
                return channelData.map((val) => {
                    return val
                })
            }
        })
    }


    stdDev(data, ignoreNaN = true) {

        let dataOfInterest = [];
        let indicesOfInterest = [];
        if (ignoreNaN) {
            data.forEach((val,ind) => {
                if (!isNaN(val)) {
                    dataOfInterest.push(val)
                    indicesOfInterest.push(ind)
                }
            })
        }

        let avg = dataOfInterest.reduce((a, b) => a + b, 0) / dataOfInterest.length;
        let sqD = dataOfInterest.map(val => {
            let diff = val - avg;
            return diff * diff;
        })
        let aSqD = sqD.reduce((a, b) => a + b, 0) / sqD.length;
        let stdDev = Math.sqrt(aSqD);
        let dev;

        dataOfInterest.forEach((val, ind) => {
            dev = (val - avg) / stdDev;
            if (isNaN(dev)) {
                data[indicesOfInterest[ind]] = 0;
            } else {
                data[indicesOfInterest[ind]] = dev;
            }
        })

        return data
    }
    

    power(relative = false) {

            let power = new Array(Object.keys(this.eegCoordinates).length);
            this.buffers.voltage.forEach((channelData,ind) => {
                power[ind] = channelData.reduce((acc, cur) => acc + ((cur * cur) / 2), 0) / channelData.length
            })

            if (relative) {
                power = this.stdDev(power, true)
            }

            return power
    }

    bandpower(band, relative = false) {
            let bandpower = new Array(Object.keys(this.eegCoordinates).length).fill(NaN);
            this.buffers.voltage.forEach((channelData,ind) => {
                // NOTE: Not actually the correct samplerate
                if (!channelData.includes(NaN)){
                    bandpower[ind] = bci.bandpower(channelData, this.samplerate, band, {relative: true});
                }
            })

            if (relative) {
                bandpower = this.stdDev(bandpower)
            }
            return bandpower
    }
}

const eegCoordinates = {
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
    Cp2: [25.8, -47.1, 66.0],
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
    O2: [25.0, -95.2, 6.2],

    // From https://sccn.ucsd.edu/pipermail/eeglablist/2003/000008.html
    Tp9: [-0.2852*100,	    0.8777*100,	   -0.3826*100],
    Tp10: [-0.2853*100,	   -0.8777*100,	   -0.3826*100]
}