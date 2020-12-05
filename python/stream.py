import sys
import os
from nBrainStreamer import nBrainStreamer 
import numpy as np
import pickle
import asyncio

async def beginStream(TYPE, PORT, URL):

    # Initialize the Trace
    nStream = nBrainStreamer()

    # Connect Websocket + EEG headset through Brainflow
    if TYPE == 'SYNTHETIC':
        await nStream.connect(streamType=TYPE)
        await nStream.stream(url=URL)
    elif TYPE == 'OPENBCI':
        await nStream.connect(streamType=TYPE,port=PORT)
        await nStream.stream(url=URL)

async def main():

    TYPE =  'SYNTHETIC' #'OPENBCI' # 
                            # Streams
                                # OPENBCI
                                # SYNTHETIC

                            # Ports
                                # Mac: '/dev/cu.usbserial-DM01N7AE'
                                # Windows: 'COM4'
                                # Synthetic: None
    PORT =     None #'/dev/cu.usbserial-DM01N7AE' #

    URL = 'https://brainsatplay.azurewebsites.net' # 'http://localhost' # 

    stream = asyncio.create_task(beginStream(TYPE, PORT, URL))
    await stream

if __name__ == "__main__":
    asyncio.run(main())