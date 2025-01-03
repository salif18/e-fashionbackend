const express = require("express");
const Router = express.Router();

const Commandes_Controller = require("../controller/commandes_controller");
const Stats_Controller = require("../controller/stats_controller");
const middleware = require("../middlewares/AuthMiddleware");

Router.post("/",Commandes_Controller.create);
Router.get("/",Commandes_Controller.getCommandes);
Router.get("/single/:id",Commandes_Controller.getOneCommandes);
Router.put("/order/:id/updateStatus",Commandes_Controller.updateOrderStatus);
Router.get("/order/:userId",Commandes_Controller.getUserCommandes);
Router.delete("/single/:id",Commandes_Controller.delete);

Router.get("/count",Stats_Controller.countAllOrders);
Router.get("/count_stats",Stats_Controller.countStatsOrders);
Router.get("/plus-achetes",Stats_Controller.getProduitsLesPlusAchetés);
Router.get("/revenu",Commandes_Controller.getRevenu);
Router.get("/benefice",Commandes_Controller.getBenefice);
Router.get("/stats-by-day",Stats_Controller.getStatsDay);
Router.get("/stats-by-hebdo",Stats_Controller.getStatsHebdo);
Router.get("/stats-by-month-current",Stats_Controller.getStatCurrentMonth);
Router.get("/stats-by-year-current",Stats_Controller.getStatsCurrentYear);
Router.get("/stats-by-year",Stats_Controller.getStatsByYears);
Router.get("/client-fidel",Stats_Controller.clientFidel);
Router.get("/gros-acheteur",Stats_Controller.clientGrosAcheteur)
module.exports = Router;