const brainstorm = (req, res) => {
    return res.sendFile(path.join(`${__dirname}/../public/brainstorm.html`));
};

module.exports = {
    getBrainstorm: brainstorm
};
