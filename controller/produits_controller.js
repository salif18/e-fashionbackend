const Produits = require("../models/produits_model");
// const fs = require('fs');
// const cloudinary = require("../middlewares/cloudinary")

exports.create = async (req, res, next) => {
  try {


    //valeur initial
    // let imageUrl = "";
    // let cloudinaryId = "";
    // // Vérifier s'il y a un fichier
    // if (req.file) {
    //     // Upload de l'image sur Cloudinary
    //     const result = await cloudinary.uploader.upload(req.file.path);
    //     imageUrl = result.secure_url;
    //     cloudinaryId = result.public_id;
    // }

    // Création d'un nouvel objet produit
    const nouveauProduit = new Produits({
      ...req.body,
      // // STOKER IMAGE EN LOCAL
      // // image: req.file ? `${req.protocol}://${req.get("host")}/images/${req.file.filename}` : "",
      // image: imageUrl,  // URL Cloudinary renvoyée dans req.file.path
      // userId: req.auth.userId,// Associer le produit à l'utilisateur
      // cloudinaryId: cloudinaryId, // Enregistrer l'ID Cloudinary si nécessaire
    });
    // Sauvegarde du produit dans la base de données
    const produitSauvegarde = await nouveauProduit.save();

    // Retourner une réponse avec le produit sauvegardé
    return res.status(201).json({ message: "Ajouté", produits: produitSauvegarde });
  } catch (err) {

    return res.status(500).json({ message: "Erreur", error: err.message });
  }
};

exports.getProduits = async (req, res) => {
  try {
    const produits = await Produits.find();

    // Ajouter un champ `image` à chaque produit
    const produitsAvecImage = produits.map(produit => {
      const firstColorImage = produit.othersColors?.[0]?.images || null; // Vérifier si l'image existe
      return {
        ...produit._doc, // Utiliser `_doc` pour inclure les champs existants
        image: firstColorImage // Ajouter le champ `image`
      };
    });
    return res.status(200).json({ message: "OK", produits: produitsAvecImage, });
  } catch (err) {
    return res.status(500).json({ message: "Erreur", error: err.message });
  }
};

exports.getProductByCategory = async (req, res) => {
  try {
    const categories = await Produits.aggregate([
      {
        $group: {
          _id: "$category", // Grouper par catégorie
          product: { $first: "$$ROOT" }, // Prendre le premier produit de chaque catégorie
        },
      },
      {
        $sort: {
          _id: 1
        }
      },
      {
        $addFields: {
          firstColor: {
            $cond: [
              { $gt: [{ $size: "$product.othersColors" }, 0] }, // Vérifie si `othersColors` contient des données
              { $arrayElemAt: ["$product.othersColors", 0] }, // Prend le premier élément
              null, // Sinon, retourne `null`
            ],
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclure l'ID par défaut du groupement
          category: "$_id", // Renommer `_id` en `category`
          image: "$firstColor.images", // Extraire l'image
        },
      },
    ]);



    return res.status(200).json({ message: "OK", categories });
  } catch (err) {
    return res.status(500).json({ message: "Erreur", error: err.message });
  }
};


exports.getPromos = async (req, res) => {
  try {
    // Étape 1 : Trouver le produit spécial avec le plus grand `discount_percentage`
    let produitSpecial = await Produits.findOne({ is_promo: true })
      .sort({ discount_percentage: -1 }) // Trier par `discount_percentage` en ordre décroissant
      .limit(1); // Récupérer seulement un produit

    if (!produitSpecial) {
      return res.status(404).json({ message: "Actuellement pas de promo" });
    }

    // Ajouter la première image du premier élément de `othersColors` pour le produit spécial
    const firstColorSpecial = produitSpecial.othersColors?.[0]; // Vérifier si `othersColors` n'est pas vide
    const firstImageSpecial = firstColorSpecial?.images || null; // Récupérer l'image si elle existe
    produitSpecial = {
      ...produitSpecial.toObject(),
      image: firstImageSpecial, // Ajouter l'image au résultat
    };

    // Étape 2 : Trouver les autres produits en promo, en excluant le produit spécial
    const autresPromos = await Produits.find({
      is_promo: true,
      _id: { $ne: produitSpecial._id }, // Exclure l'ID du produit spécial
    });

    // Ajouter la première image de `othersColors` pour chaque produit des autres promos
    const autresPromosAvecImages = autresPromos.map((produit) => {
      const firstColor = produit.othersColors?.[0]; // Vérifier si `othersColors` n'est pas vide
      const firstImage = firstColor?.images || null; // Récupérer l'image si elle existe
      return {
        ...produit.toObject(),
        image: firstImage, // Ajouter l'image à chaque produit
      };
    });

    if (!autresPromos || autresPromosAvecImages.length === 0) {
      return res.status(404).json({ message: "Aucun autre produit en promotion trouvé" });
    }

    // Réponse avec le produit spécial et les autres promotions
    return res.status(200).json({
      message: "Requête reçue",
      specialOffre: produitSpecial,
      allOffre: autresPromosAvecImages,
    });
  } catch (err) {
    return res.status(500).json({ message: "Erreur", error: err.message });
  }
};

exports.getAllPromo =async(req,res)=>{
  try{
    // Étape 1 : Trouver le produit spécial avec le plus grand `discount_percentage`
    let promos = await Produits.find({ is_promo: true })
      .sort({ discount_percentage: -1 }) // Trier par `discount_percentage` en ordre décroissant
  
      // Ajouter la première image de `othersColors` pour chaque produit des autres promos
    const offres = promos.map((produit) => {
      const firstColor = produit.othersColors?.[0]; // Vérifier si `othersColors` n'est pas vide
      const firstImage = firstColor?.images || null; // Récupérer l'image si elle existe
      return {
        ...produit.toObject(),
        image: firstImage, // Ajouter l'image à chaque produit
      };
    });

    if (!promos || offres.length === 0) {
      return res.status(404).json({ message: "Aucun autre produit en promotion trouvé" });
    }

     // Réponse avec le produit spécial et les autres promotions
     return res.status(200).json({
      message: "Requête reçue",
      offres:offres
    });

  }catch(e){
    return res.status(500).json({ message: "Erreur", error: err.message });
  }
}


exports.getOneProduits = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le produit par ID
    const produit = await Produits.findById(id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Ajouter une image au produit principal
    const firstImage = produit.othersColors?.[0]?.images || null;

    // Générer les termes de recherche à partir du nom du produit
    const searchTerms = (produit.name || "").split(" ");

    // Récupérer tous les produits pour les recommandations
    const data = await Produits.find();

    // Ajouter le champ `image` pour chaque produit dans les recommandations
    const recommandations = data
      .filter(item =>
        item.category.includes(produit.category) && // Catégorie correspondante
        item.subCategory.includes(produit.subCategory) && // Sous-catégorie correspondante
        searchTerms.some(term =>
          item.name.toLowerCase().includes(term.toLowerCase()) // Nom similaire
        )
      )
      .map(item => ({
        ...item._doc,
        image: item.othersColors?.[0]?.images || null // Ajouter le champ `image`
      }));

    // Retourner le produit principal et les recommandations avec les images
    return res.status(200).json({
      message: 'ok',
      produit: {
        ...produit._doc,
        image: firstImage
      },
      recommandations
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id)

    if (!id) {
      return res.status(400).json({ message: 'ID du produit manquant' });
    }

    // Récupérer le produit existant
    const produit = await Produits.findById(id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Préparer les données à mettre à jour
    const { name, category, subCategory, brand, description, price,
      is_promo, discount_percentage, stockGlobal,
      othersColors, commentaires } = req.body;

    // Mettre à jour uniquement les champs nécessaires
    produit.name = name || produit.name;
    produit.category = category || produit.category;
    produit.subCategory = subCategory || produit.subCategory;
    produit.brand = brand || produit.brand;
    produit.description = description || produit.description;
    produit.price = price || produit.price;
    produit.is_promo = is_promo !== undefined ? is_promo : produit.is_promo;
    produit.promo_price = is_promo && discount_percentage > 0
      ? price - (price * discount_percentage / 100)
      : null,
      produit.discount_percentage = discount_percentage || produit.discount_percentage;
    produit.stockGlobal = stockGlobal || produit.stockGlobal;

    // Mettre à jour les autres couleurs (si spécifiées)
    if (othersColors) {
      produit.othersColors = othersColors.map(color => ({
        color: color.color || undefined,
        images: color.images || undefined,
        stock: color.stock || 0,
        sizes: color.sizes ? color.sizes.map(size => ({
          size: size.size || undefined,
          stock: size.stock || 0,
        })) : [],
      }));
    }

    // Ajouter ou mettre à jour les commentaires (si spécifiés)
    if (commentaires) {
      produit.commentaires = commentaires.map(comment => ({
        userId: comment.userId || undefined,
        name: comment.name || undefined,
        rating: comment.rating || undefined,
        avis: comment.avis || undefined,
        date: comment.date || new Date(),
      }));
    }

    // Sauvegarder les modifications
    const produitMisAJour = await produit.save();

    return res.status(200).json({
      message: 'Produit mis à jour avec succès',
      produit: produitMisAJour,
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



exports.delete = async (req, res) => {
  try {

    const { id } = req.params
    const produit = await Produits.findByIdAndDelete(id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }


    // if (produit.userId.toString() !== req.auth.userId) {
    //     return res.status(401).json({ message: 'Non autorisé' });
    // }
    // METHODE SI LES FICHIER SON STOCKER EN LOCAL
    // const filename = produit.image.split('/images/')[1];
    // Supprimer l'image du serveur
    // fs.unlink(`public/images/${filename}`, async (err) => {
    //     if (err) {
    //         return res.status(500).json({ message: "Erreur lors de la suppression de l'image", error: err });
    //     }

    //     // Supprimer le produit après avoir supprimé l'image
    //     await produit.deleteOne({ _id: id });
    //     return res.status(200).json({ message: 'Produit supprimé avec succès' });
    // });

    //  Extraire l'identifiant public de l'image sur Cloudinary

    // Si le produit a un cloudinaryId, supprimer l'image sur Cloudinary
    // if (produit.cloudinaryId) {
    //     await cloudinary.uploader.destroy(produit.cloudinaryId);
    // }

    // Supprimer le produit
    await produit.deleteOne({ _id: id });
    // Si l'image est supprimée avec succès, supprimer le produit
    // await produit.deleteOne({ _id: id });
    return res.status(200).json({ message: 'Produit et image supprimés avec succès' });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.getTotalStock = async (req, res) => {
  try {
    const totalStock = await Produits.aggregate([
      {
        $group: {
          _id: null, // Pas de regroupement par catégorie ou autre
          totalQuantite: { $sum: "$stockGlobal" }, // Calcul de la somme de stockGlobal
        },
      },
    ]);

    return res.status(200).json({
      message: "Quantité totale calculée avec succès.",
      totalStock: totalStock.length > 0 ? totalStock[0].totalQuantite : 0,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Une erreur est survenue lors du calcul du stock total.",
      error: error.message,
    });
  }
};

exports.getTotalCost = async (req, res) => {
  try {
    const totalCost = await Produits.aggregate([
      {
        $project: {
          totalValue: { $multiply: ["$price", "$stockGlobal"] }, // Calculer la valeur totale par produit
        },
      },
      {
        $group: {
          _id: null, // Pas de regroupement
          totalCost: { $sum: "$totalValue" }, // Somme des valeurs totales
        },
      },
    ]);

    return res.status(200).json({
      message: "Coût total calculé avec succès.",
      totalCost: totalCost.length > 0 ? totalCost[0].totalCost : 0,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Une erreur est survenue lors du calcul du coût total.",
      error: error.message,
    });
  }
};


exports.getProduitsStockEpuisé = async (req, res) => {
  try {
    // Récupérer les produits dont le stock est épuisé (stockGlobal <= 0)
    const produitsStockEpuisé = await Produits.aggregate([
      {
        $match: {
          stockGlobal: { $lte: 5 },  // Filtrer les produits dont le stock est épuisé
        },
      },
      {
        $project: {
          name: 1,               // Inclure le nom du produit
          category: 1,           // Inclure la catégorie du produit
          stockGlobal: 1,        // Inclure le stockGlobal
          othersColors: 1,       // Garder othersColors tel quel pour vérifier son type
        },
      },
      {
        $project: {
          name: 1,
          category: 1,
          stockGlobal: 1,
          // Vérification que othersColors est bien un tableau avant de l'utiliser
          image: {
            $cond: {
              if: { $eq: [{ $type: "$othersColors" }, "array"] }, // Vérifier si othersColors est un tableau
              then: { $arrayElemAt: ["$othersColors.images", 0] },  // Extraire la première image
              else: ""  // Si ce n'est pas un tableau, renvoyer une chaîne vide
            }
          },
          color: {
            $cond: {
              if: { $eq: [{ $type: "$othersColors" }, "array"] }, // Vérifier si othersColors est un tableau
              then: { $arrayElemAt: ["$othersColors.color", 0] },  // Extraire la couleur
              else: ""  // Si ce n'est pas un tableau, renvoyer une chaîne vide
            }
          },
        },
      },
    ]);

    // Retourner la réponse avec les produits stock épuisé
    return res.status(200).json({
      produitsStockEpuisé,
    });
  } catch (error) {
    // Gérer l'erreur et afficher dans la console pour débogage
    console.error("Erreur:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des produits en stock épuisé.",
      error: error.message,
    });
  }
};
