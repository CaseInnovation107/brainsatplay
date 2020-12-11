import sys
import os
from BrainsAtPlayStreamer import BrainsAtPlayStreamer 
import numpy as np
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
    PORT = 'None' # None # /dev/cu.usbserial-DM01N7AE

    URL = 'https://brainsatplay.azurewebsites.net' # 'http://localhost' # 'https://brainsatplay.azurewebsites.net'

    USERID = '63a38269-ebd9-47b2-9fa8-0683bb7a113a'
                    # Options
                        # None
                        # [get your ID from Website UI]

    brain = asyncio.create_task(beginStream(TYPE, PORT, URL,USERID))
    await brain

if __name__ == "__main__":
    asyncio.run(main())