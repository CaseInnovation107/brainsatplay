const MongoClient = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

//I used an mlab Sandbox DB. Substitute the details with your own
const url = "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority";
const dbName = "brains-and-games";

module.exports.getFile = async (req, res) => {
  //Accepting user input directly is very insecure and should 
  //never be allowed in a production app. Sanitize the input.
  let fileName = req.body.filename;
  console.log(req.body)
  
    client = req.app.get('mongo_client')
    const db = client.db(dbName);
    
    const collection = db.collection('photos.files');
    const collectionChunks = db.collection('photos.chunks');
    collection.find({filename: fileName}).toArray(function(err, docs){
      if(!docs || docs.length === 0){
        console.log('No file found by the name of ' + fileName)
        return res.send('No file found');
      }else{
        //Retrieving the chunks from the db
        collectionChunks.find({files_id : docs[0]._id}).sort({n: 1}).toArray(function(err, chunks){
          //Append Chunks
          let fileData = [];
          for(let i=0; i<chunks.length;i++){
            //This is in Binary JSON or BSON format, which is stored
            //in fileData array in base64 endocoded string format
            fileData.push(chunks[i].data.toString('base64'));
          }
          //Display the chunks using the data URI format
          let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
          res.send(finalFile)
        });
      }
      
    });
  };