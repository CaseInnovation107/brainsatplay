const example = (req, res) => {
    return res.sendFile(path.join(`${__dirname}/../examples/${req.app.get('example')}/index.html`));
};

module.exports = {
    getExample: example
};
