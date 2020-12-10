import sys
import os
from BrainsAtPlayStreamer import BrainsAtPlayStreamer 
import numpy as np
import pickle
import asyncio

async def beginStream(TYPE, PORT, URL, USERID):

    # Initialize the Trace
    brain = BrainsAtPlayStreamer()

    # Connect Websocket + EEG headset through Brainflow
    await brain.connect(streamType=TYPE,port=PORT)
    await brain.stream(url=URL,userId=USERID)

async def main():

    TYPE =  'SYNTHETIC' # 'SYNTHETIC' #'CYTON_DAISY' # 
                            # Streams
                                # CYTON_DAISY
                                # SYNTHETIC

                            # Ports
                                # Mac: '/dev/cu.usbserial-DM01N7AE'
                                # Windows: 'COM4'
                                # Synthetic: None
    PORT = None # None # /dev/cu.usbserial-DM01N7AE

    URL = 'http://localhost' # 'https://brainsatplay.azurewebsites.net' # 'http://localhost' # 

    USERID = 'aed638af-8d93-4824-810e-38200ac16a11' 
                    # Options
                        # None
                        # [get your ID from Website UI]

    brain = asyncio.create_task(beginStream(TYPE, PORT, URL,USERID))
    await brain

if __name__ == "__main__":
    asyncio.run(main())