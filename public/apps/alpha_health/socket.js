    //WebSocket Setup:
    //Example code from Git repo: Vuka951/tutorial-code

    // Create WebSocket connection.
    const socket = new WebSocket('ws://localhost:5000');

    // Connection opened
    socket.addEventListener('open', function (event) {
        console.log('websocket connected')
    });

    // Connection closed
    socket.addEventListener('close', function (event) {
        console.log('websocket connected')
    });
