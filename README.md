# brains-at-play

A full-stack framework for developing multiplayer brain-computer interface (BCI) applications for the web.

[![Github badge](https://img.shields.io/badge/github-source_code-blue.svg?logo=github&logoColor=white)](https://github.com/brains-at-play/brains-at-play)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Getting Started](#getting-started) | [Examples](#examples) | [Support](#Support) | [Acknowledgements](#Acknowledgments)

## Getting Started <a name="getting-started" />
### Running a Local Server
1. Install [NPM](https://www.npmjs.com/) and [Node](https://nodejs.org/en/).
2. In the project folder, install the required Node modules by typing this into your command line:
```bash
npm install
``` 
3. Specify the example you'll run in app.js (optional) 
```bash
16 | let example = 'brainstorm'
``` 
4. In your command line:
```bash
npm start
```
5. Click on the link in the terminal to navigate to http://localhost


### Stream Data into the Server
1. Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
2. Navigate to the project's /resources/python directory
3. Create a conda environment from the environment.yml file:
```bash
conda env create -f environment.yml
```
4. Activate the environment:
```bash
conda activate brains-at-play
```
5. In stream.py, specify:
```bash
TYPE =  'SYNTHETIC' 
# Synthetic Stream: 'SYNTHETIC'
# OpenBCI Board: 'CYTON_DAISY'

PORT = 'None' 
# Synthetic Stream: None
# Mac: '/dev/cu.usbserial-________'
# Windows: 'COM_'
                
URL = 'http://localhost'
# Local: 'http://localhost'
# Deployed Game: 'https://brainsatplay.azurewebsites.net'

USERID = None
# Replace this with the USERID found on the client to view your brain activity
```
6. Begin streaming:
```bash
python stream.py
```

##  Examples
### [Brainstorm](https://brainsatplay.azurewebsites.net/) 

Brainstorm is a web-based BCI game that computes, visualizes, and promotes the synchronization of brains across geographic, political, and social barriers. To generate public discussion about the ethical, legal, and social implications of emerging commercial devices to monitor brain activity, Brainstorm will be showcased at [Livewire: A Stimulating Night of Neurotechnology](https://visionsandvoices.usc.edu/eventdetails/?event_id=33741435186601&s_type=&s_genre=)—a USC Visions and Voices event combining neuroscience, neuroethics, and interactive media for participatory technology design.

## Support

If you are having issues, please email Garrett Flynn at gflynn@usc.edu

## Acknowledgments
### Funding
**brains-at-play** was supported by [OpenBCI](https://openbci.com/) and [USC Visions and Voices](https://visionsandvoices.usc.edu/) for the production of [Livewire: A Stimulating Night of Neurotechnology](https://visionsandvoices.usc.edu/eventdetails/?event_id=33741435186601&s_type=&s_genre=) 

### Code
#### JavaScript (Front-End)
- [bci.js](https://bci.js.org/)
- [jQuery](https://jquery.com/)
- [Font Awesome](https://fontawesome.com/)
#### JavaScript (Back-End)
- [NPM](https://www.npmjs.com/) and [Node](https://nodejs.org/en/).
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [ws](https://www.npmjs.com/package/ws)
#### Python
- [Brainflow](https://brainflow.readthedocs.io/en/stable/index.html)
- [websockets](https://websockets.readthedocs.io/en/stable/intro.html)
- [requests](https://requests.readthedocs.io/en/master/)


