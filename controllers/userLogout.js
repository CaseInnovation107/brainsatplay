const path = require("path");

const userLogout = (req, res) => {
    return res.sendFile(path.join(`${__dirname}/../public/userLogout.html`));
};

module.exports = {
    getLogout: userLogout
};
