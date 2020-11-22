const path = require("path");

const userLogin = (req, res) => {
    return res.sendFile(path.join(`${__dirname}/../public/userLogin.html`));
};

module.exports = {
    getLogin: userLogin
};
