const express = require("express");
const Router = express.Router();

const Commandes_Controller = require("../controller/commandes_controller");
const middleware = require("../middlewares/AuthMiddleware");

Router.post("/",Commandes_Controller.create);
Router.get("/",Commandes_Controller.getCommandes);
Router.get("/single/:id",Commandes_Controller.getOneCommandes);
Router.get("/order/:userId",Commandes_Controller.getUserCommandes);
Router.get("/",Commandes_Controller.getStatsByCategories);
Router.get("/stats-by-hebdo/:userId",middleware,Commandes_Controller.getStatsHebdo);
Router.get("/stats-by-month/:userId",middleware,Commandes_Controller.getStatsByMonth);
Router.delete("/single/:id",middleware,Commandes_Controller.delete);

module.exports = Router;