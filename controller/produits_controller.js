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
        return res.status(200).json({ message: "OK", produits: produitsAvecImage,});
    } catch (err) {
        return res.status(500).json({ message: "Erreur", error: err.message });
    }
};

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
                is_promo, promo_price, discount_percentage, stockGlobal, 
                othersColors, commentaires } = req.body;

        // Mettre à jour uniquement les champs nécessaires
        produit.name = name || produit.name;
        produit.category = category || produit.category;
        produit.subCategory = subCategory || produit.subCategory;
        produit.brand = brand || produit.brand;
        produit.description = description || produit.description;
        produit.price = price || produit.price;
        produit.is_promo = is_promo !== undefined ? is_promo : produit.is_promo;
        produit.promo_price = promo_price || produit.promo_price;
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


        if (produit.userId.toString() !== req.auth.userId) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
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
        if (produit.cloudinaryId) {
            await cloudinary.uploader.destroy(produit.cloudinaryId);
        }

        // Supprimer le produit
        await produit.deleteOne({ _id: id });
        // Si l'image est supprimée avec succès, supprimer le produit
        await produit.deleteOne({ _id: id });
        return res.status(200).json({ message: 'Produit et image supprimés avec succès' });



    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};