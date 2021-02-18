const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require('fs');

let appsDir = {}
fs.readdir(path.join('public','examples'), (err, files) => {
  files.forEach(file => {
    let dir = path.join('public', 'examples',file)
    let info = fs.readFileSync(path.join('public', 'examples',file,'info.json'));
    appsDir[file] = JSON.parse(info)
    appsDir[file].path = dir
    });
  });

let routes = app => {

//   router.get('/:name', function(req, res, next) {
//     res.render(path.join(__dirname,'public','examples',req.params.name,'index'));
// });

router.get("/", function(req, res, next) {
  return res.render("index", { apps: appsDir});
});
  return app.use("/", router);
};

module.exports = routes;
