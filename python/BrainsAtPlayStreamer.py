""" 
This module defines :class:'BrainsAtPlayStreamer'
"""

import sys, signal
import matplotlib.pyplot as plt
import numpy as np
import time
import matplotlib.animation as animation
import os
import pickle
import datetime
import websockets
from urllib.parse import urlparse
import json
import requests
from brainflow.board_shim import BoardShim, BrainFlowInputParams, LogLevels, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes


class BrainsAtPlayStreamer(object):
    def __init__(self):
        """
        This is the constructor for the BrainsAtPlayStreamer data object
        """

        self.id = None
        self.all_channels = True
        self.channels = [-1,-2,-3,-4,-5,-6,-7,-8] # Ignored
        self.date = datetime.datetime.now().strftime("%d-%m-%Y_%I-%M-%S_%p")
        s = requests.Session()
        s.headers['mode'] = 'cors'
        s.headers['credentials'] = 'include'
        self.session = s
        self.reader = []
        self.data = []

    def __repr__(self):
        return "BrainsAtPlayStreamer('{},'{}',{})".format(self.id, self.date)

    def __str__(self):
        return '{} _ {}'.format(self.id, self.date)

    async def stream(self, url):

        # Authenticate
        res = self.session.post(url + '/login')

        # Convert Cookies into Proper Format
        cookies = ""
        cookieDict = res.cookies.get_dict()
        for cookie in (cookieDict):
            cookies += str(cookie + '=' + cookieDict[cookie] + '; ')

            if (cookie == 'userId'):
                self.id = cookieDict[cookie]
                print('userId: ' + self.id)

        # Add connectionType Cookie
        cookies += str('connectionType=BrainsAtPlayStreamer; ')

        
        o = urlparse(url)
        if (o.scheme == 'http'):
            uri = "ws://" + o.netloc
        elif (o.scheme == 'https'):
            uri = "wss://" + o.netloc
        else:
            print('not a valid url scheme')

        async with websockets.connect(uri,ping_interval=None, extra_headers=[('cookie', cookies)]) as websocket:
            print('Starting stream')
            self.board.start_stream(num_samples=450000)
            self.start_time = time.time()
            signal.signal(signal.SIGINT, self.signal_handler)

            while True:

                # Get Data
                pass_data = []
                rate = DataFilter.get_nearest_power_of_two(self.board.rate)
                data = self.board.get_current_board_data(num_samples=rate)#1)
                t = data[self.board.time_channel]

                if self.all_channels:
                    data = data[self.board.eeg_channels] # SCALED
                else:
                    data = data[self.board.eeg_channels][self.channels] # SCALED

                for entry in data:
                    DataFilter.perform_highpass(entry, self.board.rate, 3.0, 4, FilterTypes.BUTTERWORTH.value, 0)
                    pass_data.append((entry).tolist())

                if len(t) > 0:
                    t = t - self.start_time

                message = {
                    'destination': 'bci', 
                'data': {'ts_filtered':pass_data}
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

    async def connect(self, streamType, port=None):
            print('Connecting to board')
            self.board = initialize_board(streamType,port)
    
    def signal_handler(self, signal, frame):

        # Stop stream
        self.board.stop_stream()

        self.board.release_session()

        sys.exit('Brains-at-play data stream has been stopped.')

def initialize_board(name='SYNTHETIC',port = None):
    if name == 'SYNTHETIC':
        BoardShim.enable_dev_board_logger()

        # use synthetic board for demo
        params = BrainFlowInputParams()
        board_id = BoardIds.SYNTHETIC_BOARD.value
        board = BoardShim(board_id, params)
        board.rate = BoardShim.get_sampling_rate(board_id)
        board.channels = BoardShim.get_eeg_channels(board_id)
        board.time_channel = BoardShim.get_timestamp_channel(board_id)
        board.eeg_channels = BoardShim.get_eeg_channels(board_id)
        board.accel_channels = BoardShim.get_accel_channels(board_id)

    elif name == 'CYTON_DAISY':

        board_id = BoardIds.CYTON_DAISY_BOARD.value
        params = BrainFlowInputParams()
        params.serial_port = port
        board_id = BoardIds.CYTON_DAISY_BOARD.value
        board = BoardShim(board_id, params)
        board.rate = BoardShim.get_sampling_rate(board_id)
        board.channels = BoardShim.get_eeg_channels(board_id)
        board.time_channel = BoardShim.get_timestamp_channel(board_id)
        board.eeg_channels = BoardShim.get_eeg_channels(board_id)
        board.accel_channels = BoardShim.get_accel_channels(board_id)

    board.prepare_session()
    return board