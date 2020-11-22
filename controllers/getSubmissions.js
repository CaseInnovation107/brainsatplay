var bodyParser = require('body-parser');

//I used an mlab Sandbox DB. Substitute the details with your own
const url = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const dbName = "brains-and-games";

module.exports.getSubmissions = async (req, res) => {
  //Accepting user input directly is very insecure and should 
  //never be allowed in a production app. Sanitize the input.

    client = req.app.get('mongo_client')
    const db = client.db(dbName);
    var submissionJSON = {};

    console.log(Object.keys(req.body)[0])

    let request = Object.keys(req.body)[0]

    if ("gamename" == request){
      var submissionJSON = {};
      var docArray = [];
    await db.collection('submissions').find({"game-name": req.body.gamename}).forEach(doc => {docArray.push(doc), submissionJSON[doc['game-name']] = doc});

    getSubmissionFiles(docArray,submissionJSON,db).then(output => {
      if (Object.keys(output).length === 0){
        res.send({'error':'no results'})
      } else {
        res.send(output)
      }
    }).catch(error => {
      res.send({'error':'error'})
    });
  }
  if ("request" == request){
    var nameDict = {};
    console.log('loading existing submission')

      if (req.body.request == "all"){
        await db.collection('submissions').find().forEach(doc => nameDict[doc['team-name']] = doc['game-name']);

        if (Object.keys(nameDict).length != 0){
          res.send(nameDict)
        } else {
          res.send({'error':'no submissions yet'})
        }
      }
  }

  };

async function getSubmissionFiles(docs, subJSON, db) {

  for (ind in docs){
  const collection = db.collection('photos.files');
  const collectionChunks = db.collection('photos.chunks');
  let game_img;
  let fields = ['game-image', 'additional-images']
  for (field in fields){
      files = docs[ind][fields[field]]
  for (file in files){
    collection_docs = await collection.find({filename: files[file]}).toArray();
  if(!collection_docs || collection_docs.length === 0){
        console.log('No file found by the name of ' + game_img)
        subJSON = 'No file found';
        }else{
      let chunks = await collectionChunks.find({files_id : collection_docs[0]._id}).sort({n: 1}).toArray();
        //Append Chunks
        let fileData = [];
        for(let i=0; i<chunks.length;i++){
          fileData.push(chunks[i].data.toString('base64'));
        }
        //Display the chunks using the data URI format
        let finalFile = 'data:' + collection_docs[0].contentType + ';base64,' + fileData.join('');
        subJSON[docs[ind]['game-name']][fields[field]][file] = finalFile
    }
  }
}
  }
  return subJSON
}
