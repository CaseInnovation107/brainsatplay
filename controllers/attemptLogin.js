const uuid = require('uuid');


function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

module.exports.attemptLogin = async (req, res) => {
    //
    // "Log in" user and set userId to session.
    let cookie = getCookie(req,'id')

    if (cookie === undefined) {
      const id = uuid.v4();
      res.cookie('id',id, { maxAge: 30*24*60*60*1000, httpOnly: true });
      cookie = id;
    } else {
      console.log(`Updating session for user ${cookie}`);
    }


    res.send({ result: 'OK', userId: cookie });
  };
