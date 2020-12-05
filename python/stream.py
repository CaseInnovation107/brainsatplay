import sys
import os
from BrainsAtPlayStreamer import BrainsAtPlayStreamer 
import numpy as np
import pickle
import asyncio

async def beginStream(TYPE, PORT, URL):

    # Initialize the Trace
    brain = BrainsAtPlayStreamer()

    # Connect Websocket + EEG headset through Brainflow
    await brain.connect(streamType=TYPE,port=PORT)
    await brain.stream(url=URL)

async def main():

    TYPE =  'SYNTHETIC' #'CYTON_DAISY' # 
                            # Streams
                                # CYTON_DAISY
                                # SYNTHETIC

                            # Ports
                                # Mac: '/dev/cu.usbserial-DM01N7AE'
                                # Windows: 'COM4'
                                # Synthetic: None
    PORT =     None #'/dev/cu.usbserial-DM01N7AE' #

    URL = 'https://brainsatplay.azurewebsites.net' # 'http://localhost' # 

    brain = asyncio.create_task(beginStream(TYPE, PORT, URL))
    await brain

if __name__ == "__main__":
    asyncio.run(main())