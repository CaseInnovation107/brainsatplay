//I used an mlab Sandbox DB. Substitute the details with your own
const url = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const dbName = "brains-and-games";

module.exports.getSubmissions = async (req, res) => {
  //Accepting user input directly is very insecure and should 
  //never be allowed in a production app. Sanitize the input.

    let client = req.app.get('mongo_client')
    const db = client.db(dbName);
    var submissionJSON = {};
    var docArray = [];

    if (req.body.filter === 'approved'){
      await db.collection('submissions').find({approved: true}).forEach(doc => {docArray.push(doc), submissionJSON[doc['game-name']] = doc});
    } else {
      await db.collection('submissions').find().forEach(doc => {docArray.push(doc), submissionJSON[doc['game-name']] = doc});
    }

    if (docArray.length > 0){
    if (req.body.get !== 'all'){
    getSubmissionFiles(docArray,submissionJSON,db,['game-image', 'additional-images']).then(output => {
      if (Object.keys(output).length === 0){
        res.send({'error':'no results'})
      } else {
        res.send(output)
      }
    }).catch(error => {
      res.send({'error':'error'})
    });
  } else {
        getSubmissionFiles(docArray,submissionJSON,db,['game-image']).then(output => {
          if (Object.keys(output).length === 0){
            res.send({'error':'no results'})
          }
          else {
            res.send(output)
          }
        }).catch(error => {
          res.send({'error':'error'})
        });
      }
} else {
  res.send({'error':'no results'})
}
}

async function getSubmissionFiles(docs, subJSON, db,fields) {

  for (ind in docs){
  const collection = db.collection('photos.files');
  const collectionChunks = db.collection('photos.chunks');
  let game_img;
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
