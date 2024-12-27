const express = require("express");
const Router = express.Router();

const Rebours_Controller = require("../controller/promoRebours_controller")

Router.post("/",Rebours_Controller.CreerRebours);
Router.get("/",Rebours_Controller.getRebours);

module.exports = Router