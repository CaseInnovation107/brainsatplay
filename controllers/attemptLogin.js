const uuid = require('uuid');

module.exports.attemptLogin = async (req, res) => {
    //
    // "Log in" user and set userId to session.
    //
    const id = uuid.v4();

    console.log(`Updating session for user ${id}`);
    req.session.userId = id;
    console.log('adding userId: ' + req.session.userId)

    res.send({ result: 'OK', message: 'Session updated' });
  };
