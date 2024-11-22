const mongoose = require("mongoose");

// Définition des sous-schémas
const SizeSchema = new mongoose.Schema({
    size: { type: String, },
    stock: { type: Number, default: 0 },
  });
  
  const ColorSchema = new mongoose.Schema({
    color: { type: String},
    images: { type: String}, // Tableau de liens d'images
    stock: { type: Number, default: 0 },
    sizes: { type: [SizeSchema], }, // Stock par taille
  });

  const CommentSchema = new mongoose.Schema({
    userId:{type: mongoose.Schema.Types.ObjectId, ref: "Users"},
    name:{type:String},
    rating: { type: Number},
    avis: { type: String},
    date:{type:Date ,default: Date.now}
  });
  
  // Définition du schéma principal
  const schema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    brand: { type: String, required: false },
    rating: { type: Number, required: false, default: 0 },
    commentaires:{type: [CommentSchema] },
    description: { type: String, required: false },
    price: { type: Number, required: true },
    is_promo:{type:Boolean , default:false},
    promo_price:{type: Number },
    discount_percentage:{type: Number},
    stockGlobal: { type: Number, required: true, default: 0 },
    othersColors: { type: [ColorSchema], required: true },
  },{ timestamps: true });
  

module.exports = mongoose.model("Produits", schema);

