import { Game } from './Game.mjs';
import muse from "muse-js";
window.brainsatplay = {};
window.brainsatplay.museClient = new muse.MuseClient()

// import bci from "bcijs";

window.brainsatplay.game = new Game()