const express = require("express");
const Router = express.Router();

const Product_Controller = require("../controller/produits_controller");
const middleware = require("../middlewares/AuthMiddleware");
// const uploadFile = require("../middlewares/multerlocale")
const cloudFile = require("../middlewares/multercloudinar")

Router.post("/",Product_Controller.create);
Router.get("/",Product_Controller.getProduits);
Router.get("/promo",Product_Controller.getPromos);
Router.get("/single/:id",Product_Controller.getOneProduits);
Router.put("/single/:id",Product_Controller.update);
Router.delete("/single/:id",Product_Controller.delete);

module.exports = Router;