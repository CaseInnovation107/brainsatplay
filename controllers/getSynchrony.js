const synchrony = (req, res) => {
    // let serverSideGame = req.app.get('games').get(req.body.game).game
    return serverSideGame.getMetric('synchrony').then((synchrony) => {
        return res.send(JSON.stringify(
            {message:'sorry, our server is not fast enough to handle this feature yet!'}
        ));
    }
    )
};

module.exports = {
    getSynchrony: synchrony
};
