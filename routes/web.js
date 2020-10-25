const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const submitController = require("../controllers/submit");
const getFileController = require("../controllers/getFile");
const getSubmissionsController = require("../controllers/getSubmissions");



let routes = app => {
  router.get("/", homeController.getHome);

  router.post("/submit", submitController.submitGame);

  router.post("/upload", uploadController.uploadFiles);

    router.get('/getsubmissions', homeController.getHome);
  router.post("/getsubmissions", getSubmissionsController.getSubmissions);




  return app.use("/", router);
};

module.exports = routes;