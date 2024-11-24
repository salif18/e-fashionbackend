const mongoose = require("mongoose");

// Sous-schéma pour l'utilisateur
const UserSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    numero: { type: String, required: true },
    email: { type: String, required: true },
  });
  
  // Sous-schéma pour l'adresse
  const AddressSchema = new mongoose.Schema({
    ville: { type: String, required: true },
    rue: { type: String, required: true },
    logt: { type: String, required: false },
  });
  
  // Sous-schéma pour un élément du panier
  const CartItemSchema = new mongoose.Schema({
    producId: { type: mongoose.Schema.Types.ObjectId, ref: "Produits", required: true },
    image:{ type: String, required: false },
    name:{ type: String, required: false },
    price: { type: Number, required: true },
    promotion: { type: Boolean , default:false},
    qty: { type: Number, required: true },
    size: { type: String, required: false }, // La taille peut être facultative
    color: { type: String, required: false }, // La couleur peut être facultative
  });
  
  // Schéma principal pour la commande
  const OrderSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // Référence à l'utilisateur
      user: { type: UserSchema, required: true }, // Informations utilisateur
      address: { type: AddressSchema, required: true }, // Adresse
      payementMode: { type: String, required: true}, // Mode de paiement
      status: { type: String, required: true, default: "En attente" }, // Statut de la commande
      cart: { type: [CartItemSchema], required: true }, // Articles dans le panier
      total: { type: Number, required: true }, // Total de la commande
    },
    { timestamps: true } // Ajoute `createdAt` et `updatedAt`
  );
  
  module.exports = mongoose.model("Commandes", OrderSchema);
    


