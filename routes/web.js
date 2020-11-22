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
const getBrainstormController = require("../controllers/getBrainstorm");



let routes = app => {
  router.get("/", homeController.getHome);

  // User Management
  // router.get("/login", loginController.getLogin);
  router.post("/login", attemptLoginController.attemptLogin);
  // router.get("/logout", logoutController.getLogout);
  router.post("/logout", attemptLogoutController.attemptLogout);

  // Competition Management
  router.post("/submit", submitController.submitGame);
  router.post("/upload", uploadController.uploadFiles);
  router.get('/getsubmissions', homeController.getHome);
  router.post("/getsubmissions", getSubmissionsController.getSubmissions);
  router.get('/brainstorm', getBrainstormController.getBrainstorm);





  return app.use("/", router);
};

module.exports = routes;
