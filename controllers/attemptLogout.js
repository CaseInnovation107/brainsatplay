module.exports.attemptLogout = async (req, res) => {
    const ws = req.app.get('map').get(req.sessionID);
    console.log('deleting userId: ' + req.sessionID)

    console.log('Destroying session');
    req.session.destroy(function () {
        if (ws) ws.close();
        res.send({ result: 'OK', message: 'Session destroyed' });
    });
  };
