import sys
import os
from brainsatplay.core import Brain 
import numpy as np
import asyncio
import time
import math

async def beginStream(BOARD, PORT, URL, LOGIN_DATA, GAME, ACCESS, DATA_STREAM, ARBITRARY_EVENT_FUNCTION):

    # Initialize the Trace
    brain = Brain()

    # Connect Websocket and (if applicable) start streaming a Brainflow-compatible EEG device
    await brain.stream(url=URL,login_data=LOGIN_DATA,game=GAME,access=ACCESS, data_stream=DATA_STREAM, arbitraryEventFunction=ARBITRARY_EVENT_FUNCTION, board=BOARD, port=PORT)

async def main():

    BOARD = 'SYNTHETIC_BOARD' 
    # Synthetic Stream: 'SYNTHETIC_BOARD'
    # OpenBCI Board: 'CYTON_DAISY_BOARD'
    # Neurosity Boards: 'NOTION_1_BOARD' or 'NOTION_2_BOARD'

    PORT = None
    # Synthetic Stream: None
    # Mac: '/dev/cu.usbserial-________'
    # Windows: 'COM_'
                    
    URL = 'http://localhost/'#'https://brainsatplay.azurewebsites.net'
    # Local: 'http://localhost'
    # Deployed Game: 'https://brainsatplay.azurewebsites.net'

    LOGIN_DATA = { 'guestaccess': True }#,'guestId': '9e90cd6f-35a9-45b2-9d7b-229968275025' }
    # Guests: { 'guestaccess': True, 'guestId': '********'}
    # Authenticated Users: { 'username': '********', 'password': '********' }
    
    GAME = 'template'
    # Current Games: template, brainstorm

    ACCESS = 'public'
    # Anyone Can Access Data (required to play games): 'public'
    # Only Interfaces with Same USERID Access Data: 'private'

    DATA_STREAM = ['brainflow', 'arbitrary']
    # Stream raw voltages using Brainflow: 'brainflow'
    # EXTEND THIS ARRAY WITH ARBITRARY VALUES TO PASS TO THE FRONT END

    def arbitraryEventFunction(brain): # PASS ARBITRARY DATA TO THE FRONT END
        brain.passData('arbitrary', math.sin(time.time())) # include this line to pass data corresponding to the arbitrary fields in DATA_STREAM

    brain = asyncio.create_task(beginStream(BOARD, PORT, URL, LOGIN_DATA, GAME, ACCESS, DATA_STREAM,arbitraryEventFunction))
    await brain

if __name__ == "__main__":
    asyncio.run(main())