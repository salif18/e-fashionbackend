const Produits = require("../models/produits_model");

exports.addCommentToProduct = async (req, res) => {
  const { id } = req.params; // Id du produit passé dans l'URL
  const { user, rating, commentaires } = req.body; // Données reçues

  if (!user || !rating || !commentaires) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    // Trouver le produit par son ID
    const produit = await Produits.findById(id);
    if (!produit) {
      return res.status(404).json({ message: "Produit introuvable." });
    }

    // Ajouter le nouveau commentaire
    produit.commentaires.push({ name: user, rating, avis: commentaires });
    
    // Ajouter le nouveau rating à l'ancien existant
    produit.rating += rating;

    // Sauvegarder les modifications
    await produit.save();

    return res.status(200).json({ message: "Commentaire ajouté avec succès.", produit });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un commentaire :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};





exports.getComments =async(req,res, next)=>{
    try{

    }catch(err){
        
    }
}