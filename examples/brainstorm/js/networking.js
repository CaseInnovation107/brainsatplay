// Request Handling
function clientAction(destination,method){
    fetch(url + destination, { method: method,
        mode: 'cors',
        credentials: 'include'
    }).then(handleResponse)
        .then(showMessage)
        .catch(function (err) {
            showMessage(err.message);
        });
}

function handleResponse(res) {
    return res.ok
        ? res.json().then((data) => data)
        : Promise.reject(new Error('Unexpected response'));
}

function showMessage(res) {
    if (res.userId != undefined){
        document.getElementById('userId').innerHTML = 'Client ID: ' + res.userId
    } else {
        console.log(`\n${res}`);
    }
}

// Websockets
function establishWebsocketConnection() {
    if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
    }

    if (url.protocol == 'http:'){
    ws = new WebSocket(`ws://` + url.hostname);
    } else if (url.protocol == 'https:'){
        ws = new WebSocket(`wss://` + url.hostname);
    } else{
        console.log('invalid protocol')
        return
    }

    ws.onerror = function () {
        showMessage('WebSocket error');
    };

    ws.onopen = function () {
        showMessage('WebSocket connection established');
    };

    ws.onmessage = function (msg) {
        let obj = JSON.parse(msg.data);
        if (obj.destination == 'chat'){
            $('#messages').append($('<li>').text(obj.msg));
        }
        else if (obj.destination == 'bci'){
            passSignal(obj)
        } else if (obj.destination == 'nBrains'){
            newUsers = obj.msg;
            if (numUsers != newUsers){
                let diff = newUsers - numUsers
                numUsers = newUsers
                if (state != 0){
                announceUsers(diff)
                stateManager(animState)
            }
            displacement = resetDisplacement();
            }
        }
        else {
            console.log(obj)
        }
    };

    ws.onclose = function () {
        showMessage('WebSocket connection closed');
        // document.getElementById('app').innerHTML = 'Websocket closed'
        ws = null;
    };
}


// Cookies
function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(req,name) {
    const value = `; ${req.headers.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}