const PromoCompteRebour = require("../models/compterebours_model")
const Produits = require("../models/produits_model")
// Route pour ajouter une promotion
exports.CreerRebours =async (req, res) => {
    try {
      const { name, startTime, endTime } = req.body;
  
      // Validation des dates
      if (new Date(startTime) >= new Date(endTime)) {
        return res
          .status(400)
          .json({ error: "La date de fin doit être postérieure à la date de début." });
      }
  
      const promotion = new PromoCompteRebour({ name, startTime, endTime });
      await promotion.save();

    
    // Activer la promotion sur les produits concernés
    // await Product.updateMany(
    //     { _id: { $in: products } },
    //     {
    //       $set: {
    //         is_promo: true,
    //         promo_price: /* Calcul basé sur votre logique */
    //         discount_percentage: /* Calcul basé sur votre logique */,
    //       },
    //     }
    //   );

      res.status(201).json({ message: "Promotion créée avec succès", promotion });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Route pour obtenir la promotion active
exports.getRebours =async (req, res) => {
    try {
      const now = new Date();
      const activePromotion = await PromoCompteRebour.findOne({
        startTime: { $lte: now },
        endTime: { $gte: now },
      });
  
      if (activePromotion) {
        return res.status(200).json(activePromotion);
      } else {
        return res.status(404).json({ message: "Aucune promotion active" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


// Désactiver les produits après l'expiration de la promotion
exports.checkExpiredPromotions = async () => {
  try {
    const now = new Date();

    // Récupérer les promotions actives expirées
    const expiredPromotions = await PromoCompteRebour.find({
      endTime: { $lt: now },
      isActive: true,
    });

    for (const promo of expiredPromotions) {
      // Désactiver la promotion
      promo.isActive = false;
      await promo.save();

      // Mettre à jour les produits associés
      await Produits.updateMany(
        { _id: { $in: promo.products } }, // Filtre pour les produits liés à cette promotion
        {
          $set: {
            is_promo: false,
            promo_price: null, // Supprime le prix promotionnel
            discount_percentage: null, // Supprime le pourcentage de remise
          },
        }
      );

      console.log(`Produits associés à la promotion "${promo.name}" désactivés.`);
    }
  } catch (error) {
    console.error("Erreur lors de la gestion des promotions expirées :", error);
  }
};