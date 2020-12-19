function getCookie(req,name) {
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const url = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const dbName = "brainsatplay";

module.exports.attemptSignup = async (req, res) => {
  
    //
    // "Log in" user and set userId to session.
    let username = req.body.username
    let password = req.body.password

    if (username != undefined && password != undefined) {
      let client = req.app.get('mongo_client')
      const db = client.db(dbName);
      let numDocs = await db.collection('profiles').find({ username: username }).count()
      if (numDocs == 0){
        console.log(`Creating account for user ${username}`);
        await db.collection('profiles').insertOne(req.body)
        res.send({ result: 'OK', userId: username });
      } else {
        res.send({result: 'incomplete', msg: 'username already exists. please try again.'});
      }
    }
  };
