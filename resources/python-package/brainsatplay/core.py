""" 
This module defines :class:'Brain'
"""

import sys, signal
import numpy as np
import time
import os
import datetime
import websockets
from urllib.parse import urlparse
import json
import requests
from brainflow.board_shim import BoardShim, BrainFlowInputParams, LogLevels, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes


class Brain(object):
    def __init__(self):
        """
        This is the constructor for the Brain data object
        """

        self.id = None
        self.all_channels = True
        self.channels = [-1] # Ignored if all_channels is True
        self.date = datetime.datetime.now().strftime("%d-%m-%Y_%I-%M-%S_%p")
        s = requests.Session()
        s.headers['mode'] = 'cors'
        s.headers['credentials'] = 'include'
        self.session = s
        self.reader = []
        self.data = []

    def __repr__(self):
        return "Brain('{},'{}',{})".format(self.id, self.date)

    def __str__(self):
        return '{} _ {}'.format(self.id, self.date)

    async def stream(self, url, userId):

        # Authenticate
        res = self.session.post(url + '/login')

        cookieDict = res.cookies.get_dict()
        cookieDict['connectionType'] = 'brains'
        

        # Convert Cookies into Proper Format
        cookies = ""        
        for cookie in (cookieDict):
            if (cookie == 'id'):
                if (userId != None):
                    cookieDict[cookie] = userId
                self.id = cookieDict[cookie]

            cookies += str(cookie + '=' + cookieDict[cookie] + '; ')
            
        # Add connectionType Cookie
        o = urlparse(url)
        if (o.scheme == 'http'):
            uri = "ws://" + o.netloc
        elif (o.scheme == 'https'):
            uri = "wss://" + o.netloc
        else:
            print('not a valid url scheme')

        async with websockets.connect(uri,ping_interval=None, extra_headers=[('cookie', cookies)]) as websocket:
            
            msg = await websocket.recv()

            try: 
                msg = json.loads(msg)
            except:
                print('\n\nError: ' + msg + '\n\n')
                return

            print('\n\nStarting to stream into the brainstorm.\n\n')
            self.board.start_stream(num_samples=450000)
            self.start_time = time.time()
            signal.signal(signal.SIGINT, self.stop)

            while True:

                # Get Data
                pass_data = []
                rate = DataFilter.get_nearest_power_of_two(self.board.rate)
                data = self.board.get_board_data()
                t = data[self.board.time_channel]

                if self.all_channels:
                    data = data[self.board.eeg_channels] 
                else:
                    data = data[self.board.eeg_channels][self.channels]

                for entry in data:
                    pass_data.append((entry).tolist())
                    
                message = {
                    'destination': 'bci', 
                'data': {'signal':pass_data,'time':t.tolist()}
                }
                message = json.dumps(message, separators=(',', ':'))
                
                
                # (Re)Open Websocket Connection
                if not websocket.open:
                    try:
                        print('Websocket is NOT connected. Reconnecting...')
                        websocket = await websockets.connect(uri,ping_interval=None, extra_headers=[('cookie', cookies)])
                    except:
                        print('Unable to reconnect, trying again.')

                await websocket.send(message)


    def connect(self, board='SYNTHETIC_BOARD', port = None):

        if board == 'CYTON_DAISY_BOARD':

            board_id = BoardIds.CYTON_DAISY_BOARD.value
            params = BrainFlowInputParams()
            params.serial_port = port
            self.board = BoardShim(board_id, params)
            self.board.rate = BoardShim.get_sampling_rate(board_id)
            self.board.channels = BoardShim.get_eeg_channels(board_id)
            self.board.time_channel = BoardShim.get_timestamp_channel(board_id)
            self.board.eeg_channels = BoardShim.get_eeg_channels(board_id)

        else:
            BoardShim.enable_dev_board_logger()
            board_id = BoardIds[board].value
            params = BrainFlowInputParams()
            self.board = BoardShim(board_id, params)
            self.board.rate = BoardShim.get_sampling_rate(board_id)
            self.board.channels = BoardShim.get_eeg_channels(board_id)
            self.board.time_channel = BoardShim.get_timestamp_channel(board_id)
            self.board.eeg_channels = BoardShim.get_eeg_channels(board_id)

        self.board.prepare_session()

    def stop(self, signal, frame):

        # Stop stream
        self.board.stop_stream()

        self.board.release_session()

        sys.exit('\n\nBrains-at-play data stream has been stopped.\n\n')