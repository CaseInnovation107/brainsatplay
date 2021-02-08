const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const submitController = require("../controllers/submit");
const attemptLoginController = require("../controllers/attemptLogin");
const attemptLogoutController = require("../controllers/attemptLogout");
const attemptSignupController = require("../controllers/attemptSignup");

const getFileController = require("../controllers/getFile");
const getSubmissionsController = require("../controllers/getSubmissions");
const getExampleController = require("../controllers/getExample");
const getSynchronyController = require("../controllers/getSynchrony");

const downloadAppController = require("../controllers/downloadApp");

const path = require("path");
const muse = require('muse-js');

let routes = app => {
  router.get("/", 
  homeController.getHome
  );

  // User Management
  router.post("/login", attemptLoginController.attemptLogin);
  router.post("/logout", attemptLogoutController.attemptLogout);
  router.post("/signup", attemptSignupController.attemptSignup);

  // Platform Commands
  router.get('/getexample', getExampleController.getExample);
  router.get('/downloadapp', downloadAppController.downloadApp)
  router.post('/synchrony', getSynchronyController.getSynchrony);


  // Competition Management
  router.post("/submit", submitController.submitGame);
  router.post("/upload", uploadController.uploadFiles);
  router.get('/getsubmissions', homeController.getHome);
  router.post("/getsubmissions", getSubmissionsController.getSubmissions);
  
  return app.use("/", router);
};

module.exports = routes;
