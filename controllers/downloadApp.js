const path = require("path");

const downloadApp = (req, res) => {
    const file = path.join(__dirname,'..','examples', req.app.get('example'), 'app.zip');
    return res.download(file, `${req.app.get('example')}.zip`); // Set disposition and send it.
  };
  
  module.exports = {
    downloadApp: downloadApp
  };