const util = require("util");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");

var storage = new GridFsStorage({
  url: "mongodb+srv://default-user:JgMmIChJd7IoyOJY@cluster0.bdgxr.mongodb.net/brains-and-games?retryWrites=true&w=majority",
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = file.originalname;
      return filename;
    }

    return {
      bucketName: "photos",
      filename: file.originalname
    };
  }
});

console.log('sending file to storage')
var uploadFiles = multer({ storage: storage }).fields([{
  name: 'game-image', maxCount: 1
}, {
  name: 'additional-images', maxCount: 5}
])
// var files = uploadFile.push(uploadFiles)
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;