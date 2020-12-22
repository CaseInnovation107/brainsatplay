import sys
import os
from brainsatplay.core import Brain 
import numpy as np
import asyncio

async def beginStream(BOARD, PORT, URL, LOGIN_DATA, GAME, ACCESS):

    # Initialize the Trace
    brain = Brain()

    # Connect Websocket + EEG headset through Brainflow
    brain.connect(board=BOARD,port=PORT)
    await brain.stream(url=URL,login_data=LOGIN_DATA,game=GAME,access=ACCESS)

async def main():

    BOARD = 'SYNTHETIC_BOARD' 
    # Synthetic Stream: 'SYNTHETIC_BOARD'
    # OpenBCI Board: 'CYTON_DAISY_BOARD'
    # Neurosity Boards: 'NOTION_1_BOARD' or 'NOTION_2_BOARD'

    PORT = None
    # Synthetic Stream: None
    # Mac: '/dev/cu.usbserial-________'
    # Windows: 'COM_'
                    
    URL = 'http://localhost'
    # Local: 'http://localhost'
    # Deployed Game: 'https://brainsatplay.azurewebsites.net'

    LOGIN_DATA = { 'guestaccess': True }
    # Guests: { 'guestaccess': True, 'guestId': '********'}
    # Authenticated Users: { 'username': '********', 'password': '********' }
    
    GAME = 'brainstorm'
    # Current Games: brainstorm

    ACCESS = 'public'
    # Anyone Can Access Data (required to play games): 'public'
    # Only Interfaces with Same USERID Access Data: 'private'

    brain = asyncio.create_task(beginStream(BOARD, PORT, URL, LOGIN_DATA, GAME, ACCESS))
    await brain

if __name__ == "__main__":
    asyncio.run(main())