const uuid = require('uuid');


function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const url = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const dbName = "brainsatplay";

module.exports.attemptLogin = async (req, res) => {
  
    // let cookie = getCookie(req,'id')

    let username = req.body.username
    let password = req.body.password
    let guestaccess = req.body.guestaccess
    let msg;

    if (guestaccess != true){
    if (username != undefined && password != undefined) {
      let client = req.app.get('mongo_client')
      const db = client.db(dbName);
      let correct_pass 
      await db.collection('profiles').find({ username: username }).forEach(doc => {correct_pass = doc.password});
      if (correct_pass === password){
        msg = username
        res.send({ result: 'OK', msg: msg });
      } else {
        msg = 'no profile exists with this username. please try again.'
        res.send({ result: 'incomplete', msg: msg });
      }
    } 
  } else {
      msg = uuid.v4();
      res.send({ result: 'OK', msg: msg });
  }
}
