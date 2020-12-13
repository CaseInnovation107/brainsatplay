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

    TYPE =  'CYTON_DAISY' # 'SYNTHETIC' #'CYTON_DAISY' # 
                            # Streams
                                # CYTON_DAISY
                                # SYNTHETIC

                            # Ports
                                # Mac: '/dev/cu.usbserial-DM01N7AE'
                                # Windows: 'COM4'
                                # Synthetic: None
    PORT = '/dev/cu.usbserial-DM01N7AE' # None # /dev/cu.usbserial-DM01N7AE

    URL = 'http://localhost' # 'https://brainsatplay.azurewebsites.net' # 'http://localhost' # 'https://brainsatplay.azurewebsites.net'

    USERID = '205c159c-04aa-439c-8c44-51587fc3a188'; # 'f51ff9e3-621a-4df2-81e7-79ee7872316e'
                    # Options
                        # None
                        # [get your ID from Website UI]

    brain = asyncio.create_task(beginStream(TYPE, PORT, URL,USERID))
    await brain

if __name__ == "__main__":
    asyncio.run(main())