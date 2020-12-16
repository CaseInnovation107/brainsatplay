import sys
import os
from brainsatplay.core import Brain 
import numpy as np
import asyncio

async def beginStream(BOARD, PORT, URL, USERID):

    # Initialize the Trace
    brain = Brain()

    # Connect Websocket + EEG headset through Brainflow
    brain.connect(board=BOARD,port=PORT)
    await brain.stream(url=URL,userId=USERID)

async def main():

    BOARD = 'SYNTHETIC_BOARD' 
    PORT = None
    URL = 'https://brainsatplay.azurewebsites.net'
    USERID = None
    
                                # Board Types
                                    # SYNTHETIC_BOARD                          
                                    # CYTON_DAISY_BOARD
                                    # NOTION_1_BOARD
                                    # NOTION_2_BOARD

                                # Port Syntax (required for CYTON_DAISY_BOARD only)
                                    # Mac Style: '/dev/cu.usbserial-DM01N7AE'
                                    # Windows Style: 'COM4'
                                    # Synthetic: None

                                # ID Styles
                                    # None (get a random ID)
                                    # Get ID string from website to view data on the browser


    brain = asyncio.create_task(beginStream(BOARD, PORT, URL, USERID))
    await brain

if __name__ == "__main__":
    asyncio.run(main())