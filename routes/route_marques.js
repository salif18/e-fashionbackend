const express = require("express")
const Router = express.Router()
const Marques_controller = require('../controller/marques_controller')

Router.post("/",Marques_controller.createMarques)
Router.get("/",Marques_controller.getMarques)
Router.get("/:id",Marques_controller.getOneMarque)
Router.put("/:id",Marques_controller.updateMarques)
Router.delete("/:id",Marques_controller.DeleteMarques)

module.exports = Router