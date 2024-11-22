//CREATION DE MON APPLICATION 
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();
const Auth_Router = require("./routes/route_auth");
const Reset_Router = require("./routes/route_reset");
const Products_Router = require("./routes/route_products")
const Commandes_Router = require("./routes/route_commandes")
const Categories_Router = require("./routes/route_categories")
const Fournisseurs_Router = require("./routes/route_fournisseurs")
const Comments_Router = require("./routes/route_commentaires")
const Abonnees_Router = require("./routes/route_abonnees")

app.use(cors());
app.use(express.json());

// Middleware pour servir les fichiers statiques
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/photos', express.static(path.join(__dirname, 'public/photos')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// Établir la connexion à la base de données
mongoose.connect(process.env.DB_NAME)
  .then(() => console.log("Base de donneés connectées"))
  .catch(() => console.log("Echec de connection à la base des données"));

// Configurer les routes
app.use("/api/auth", Auth_Router);
app.use("/api/reset", Reset_Router);
app.use("/api/products", Products_Router);
app.use("/api/commandes", Commandes_Router);
app.use("/api/categories", Categories_Router);
app.use("/api/fournisseurs", Fournisseurs_Router);
app.use("/api/commentaires",Comments_Router)
app.use("/api/newletter",Abonnees_Router)

module.exports = app;
