const express = require("express");
const Router = express.Router();

const Comment_Controller = require("../controller/commentaires_controller");



Router.post("/:id",Comment_Controller.addCommentToProduct);
Router.get("/",Comment_Controller.getComments);


module.exports = Router;