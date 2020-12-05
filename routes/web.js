const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");
const uploadController = require("../controllers/upload");
const submitController = require("../controllers/submit");
const loginController = require("../controllers/userLogin");
const attemptLoginController = require("../controllers/attemptLogin");
const logoutController = require("../controllers/userLogout");
const attemptLogoutController = require("../controllers/attemptLogout");
const getFileController = require("../controllers/getFile");
const getSubmissionsController = require("../controllers/getSubmissions");
const getExampleController = require("../controllers/getExample");



let routes = app => {
  router.get("/", homeController.getHome);

  // User Management
  router.post("/login", attemptLoginController.attemptLogin);
  router.post("/logout", attemptLogoutController.attemptLogout);
  
  // Platform Commands
  router.get('/getexample', getExampleController.getExample);

  // Competition Management
  router.post("/submit", submitController.submitGame);
  router.post("/upload", uploadController.uploadFiles);
  router.get('/getsubmissions', homeController.getHome);
  router.post("/getsubmissions", getSubmissionsController.getSubmissions);
  return app.use("/", router);
};

module.exports = routes;
