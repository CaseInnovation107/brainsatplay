#Noel Case, 2-20-21
# WS for the Brains@Play game "alpha_health"

import asyncio
import websockets
import time
import datetime
import serial

# communication test: greeting
async def hello(websocket, path):
    name = await websocket.recv()
    print(f"< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f"> {greeting}")

start_server = websockets.server(hello, "localhost", 5000)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()


# communication with arduino: sending brain data over serial
rest_time = 0.05
arduino = serial.Serial(port='COM4', baudrate=9600, timeout=0.2)
def write_to_arduino(x):
    arduino.write(bytes(x, 'utf-8'))
    time.sleep(rest_time)
    data = arduino.readline()
    return data
# sending data to the arduino once it ahs connected
while True:
