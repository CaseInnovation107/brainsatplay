# brainsatplay

A full-stack framework for developing multiplayer brain-computer interface (BCI) applications for the web.

[![Github badge](https://img.shields.io/badge/github-source_code-blue.svg?logo=github&logoColor=white)](https://github.com/brainsatplay/brainsatplay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Getting Started](#getting-started) | [Examples](#examples) | [Support](#Support) | [Acknowledgements](#Acknowledgments)

## Getting Started <a name="getting-started" />
### Running a Local Server
1. Install [NPM](https://www.npmjs.com/) and [Node](https://nodejs.org/en/).
2. In the project folder, install the required Node modules by typing this into your command line:
```bash
npm install
``` 
3. Specify the example you'll run on Line 16 of app.js (optional) 
```javascript
let example = 'brainstorm'
``` 
4. In your command line:
```bash
npm start
```
5. Click on the link in the terminal to navigate to http://localhost


### Stream Data into the Server
1. Use your favorite environment management system (e.g. [Miniconda](https://docs.conda.io/en/latest/miniconda.html)) to create a new environment.
2. Install the brainsatplay package
```bash
pip install brainsatplay
```
3. Navigate to this project's /resources/python-package directory
4. In stream.py, configure the following settings for your specific use-case:
```python
BOARD = 'SYNTHETIC_BOARD' 
  # Synthetic Stream: 'SYNTHETIC_BOARD'
  # OpenBCI Board: 'CYTON_DAISY_BOARD'
  # Neurosity Boards: 'NOTION_1_BOARD' or 'NOTION_2_BOARD'

PORT = None
  # Synthetic Stream: None
  # Mac: '/dev/cu.usbserial-________'
  # Windows: 'COM_'
                
URL = 'http://localhost'
  # Local: 'http://localhost'
  # Deployed Game: 'https://brainsatplay.azurewebsites.net'

LOGIN_DATA = {
        'guestaccess': True, 
        'guestId': '********' 
    }
  # Guests: { 'guestaccess': True, 'guestId': '********'}
  # Authenticated Users: { 'username': '********', 'password': '********' }

GAME = 'brainstorm'
    # Current Games: brainstorm

ACCESS = 'public'
  # Anyone Can Access Data (required to play games): 'public'
  # Only Interfaces with Same USERID Access Data: 'private'

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
**brainsatplay** was supported by [OpenBCI](https://openbci.com/) and [USC Visions and Voices](https://visionsandvoices.usc.edu/) for the production of [Livewire: A Stimulating Night of Neurotechnology](https://visionsandvoices.usc.edu/eventdetails/?event_id=33741435186601&s_type=&s_genre=) 

### Code
#### JavaScript (Front-End)
- [bci.js](https://bci.js.org/)
#### JavaScript (Back-End)
- [NPM](https://www.npmjs.com/) and [Node](https://nodejs.org/en/).
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [ws](https://www.npmjs.com/package/ws)
#### Python
- [Brainflow](https://brainflow.readthedocs.io/en/stable/index.html)
- [websockets](https://websockets.readthedocs.io/en/stable/intro.html)
- [requests](https://requests.readthedocs.io/en/master/)


