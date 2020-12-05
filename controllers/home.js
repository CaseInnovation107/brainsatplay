const path = require("path");

const home = (req, res) => {
  return res.sendFile(path.join(`${__dirname}/../examples/${req.app.get('example')}/index.html`));
};

module.exports = {
  getHome: home
};