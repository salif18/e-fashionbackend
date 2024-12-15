const express = require("express");
const Router = express.Router();

const Commandes_Controller = require("../controller/commandes_controller");
const middleware = require("../middlewares/AuthMiddleware");

Router.post("/",Commandes_Controller.create);
Router.get("/",Commandes_Controller.getCommandes);
Router.get("/single/:id",Commandes_Controller.getOneCommandes);
Router.put("/order/:id/updateStatus",Commandes_Controller.updateOrderStatus);
Router.get("/order/:userId",Commandes_Controller.getUserCommandes);
Router.delete("/single/:id",Commandes_Controller.delete);

Router.get("/count",Commandes_Controller.countAllOrders);
Router.get("/plus-achetes",Commandes_Controller.getProduitsLesPlusAchetés);
Router.get("/revenu",Commandes_Controller.getRevenu);
Router.get("/benefice",Commandes_Controller.getBenefice);
Router.get("/stats-by-hebdo",Commandes_Controller.getStatsHebdo);
Router.get("/stats-by-year-current",Commandes_Controller.getStatsByYearEnCours);
Router.get("/stats-by-year",Commandes_Controller.getStatsByYears);
Router.get("/client-fidel-gros-acheteur",Commandes_Controller.clientFidelAndGrosAcheteur);

module.exports = Router;