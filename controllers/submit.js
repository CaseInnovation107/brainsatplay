const submitGame = async (req, res) => {
  try {
    await req.app.get('mongo_client').db("brains-and-games").collection("submissions").insertOne(req.body)
    return res.send(`Submission has been received.`);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  submitGame: submitGame
};