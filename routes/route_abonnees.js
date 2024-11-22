const express = require("express");
const Router = express.Router();

const Abonnees_Controller = require("../controller/abonnees_controller");



Router.post("/",Abonnees_Controller.registre);
Router.get("/",Abonnees_Controller.getAbonnees);

module.exports = Router;