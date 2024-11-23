const Commandes = require("../models/commandes_model")
const Produits = require("../models/produits_model");
const moment = require("moment");
const mongoose = require("mongoose");

exports.create = async (req, res) => {
  try {
    const { userId, user, address, payementMode, cart, total } = req.body;

    for (const item of cart) {
      const { producId, qty, size, color } = item;

      // Trouver le produit correspondant
      const produit = await Produits.findById(producId);
      if (!produit) {
        return res.status(404).json({ message: `Produit avec l'ID ${producId} introuvable.` });
      }

      // Vérifier le stock global
      if (produit.stockGlobal < qty) {
        return res.status(400).json({
          message: `Stock insuffisant pour le produit "${produit.name}". Stock disponible : ${produit.stockGlobal}.`,
        });
      }

      // Trouver la variante de couleur
      const colorVariant = produit.othersColors.find((c) => c.color === color);
      if (!colorVariant || colorVariant.stock < qty) {
        return res.status(400).json({
          message: `Stock insuffisant pour la couleur "${color}" du produit "${produit.name}".`,
        });
      }

      // Vérifier et mettre à jour la variante de taille si spécifiée
      if (size) {
        const sizeVariant = colorVariant.sizes.find((s) => s.size === size);
        if (!sizeVariant || sizeVariant.stock < qty) {
          return res.status(400).json({
            message: `Stock insuffisant pour la taille "${size}" de la couleur "${color}" du produit "${produit.name}".`,
          });
        }

        // Réduire le stock pour la taille
        sizeVariant.stock -= qty;
      }

      // Réduire le stock pour la couleur
      colorVariant.stock -= qty;

      // Réduire le stock global
      produit.stockGlobal -= qty;

      // Sauvegarder les changements dans le produit
      await produit.save();
    }

    // Créer la commande
    const newOrder = new Commandes({
      userId,
      user,
      address,
      payementMode,
      status:"En attente",
      cart,
      total,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({ message: "Commande créée avec succès", order: savedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Trouver la commande à annuler
    const order = await Commandes.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: `Commande avec l'ID ${orderId} introuvable.` });
    }

    if (order.status === "annulé") {
      return res.status(400).json({ message: "La commande est déjà annulée." });
    }

    // Restaurer les stocks pour chaque article du panier
    for (const item of order.cart) {
      const { producId, qty, size, color } = item;

      const produit = await Produits.findById(producId);
      if (!produit) {
        return res.status(404).json({ message: `Produit avec l'ID ${producId} introuvable.` });
      }

      // Restaurer le stock global
      produit.stockGlobal += qty;

      // Trouver la variante de couleur
      const colorVariant = produit.othersColors.find((c) => c.color === color);
      if (colorVariant) {
        // Restaurer le stock de la couleur
        colorVariant.stock += qty;

        // Restaurer le stock de la taille, si applicable
        if (size) {
          const sizeVariant = colorVariant.sizes.find((s) => s.size === size);
          if (sizeVariant) {
            sizeVariant.stock += qty;
          }
        }
      }

      // Sauvegarder les changements dans le produit
      await produit.save();
    }

    // Mettre à jour le statut de la commande
    order.status = "annulé";
    await order.save();

    res.status(200).json({ message: "Commande annulée et stock restauré avec succès.", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Route pour obtenir toutes les ventes
exports.getCommandes = async (req, res, next) => {
  try {
    //   RECUPERER LES Orders
    const orders = await Commandes.find().sort({ createdAt: -1 });
    return res.status(200).json(
      {
        message: "ok",
        orders: orders,
      },

    );
  } catch (err) {
    return res.status(500).json(
      { message: "Erreur lors de la récupération des ventes", error: err },

    );
  }
};

exports.getOneCommandes = async (req, res) => {
  try {
    const { id } = req.params;

    // Étape 1 : Récupérer la commande
    const order = await Commandes.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Étape 2 : Extraire les IDs des produits
    const productIds = order.cart.map((item) => item.producId);

    // Étape 3 : Récupérer les produits correspondants
    const products = await Produits.find({ _id: { $in: productIds } });

    // Étape 4 : Enrichir le panier avec les informations des produits
    const enrichedCart = order.cart
      .map((item) => {
        const product = products.find(
          (prod) => prod._id.toString() === item.producId.toString()
        );
        return product
          ? {
            id: product._id,
            name: product.name,
            image: product.othersColors[0].images,
            qty: item.qty,
            price: product.price,
            color: item.color,
            size: item.size,
          }
          : null;
      })
      .filter(Boolean); // Supprimer les entrées nulles

    return res.status(200).json({
      message: 'Commande récupérée avec succès',
      order: {
        ...order.toObject(),
        cart: enrichedCart,
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erreur lors de la récupération de la commande',
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body
  
    // Rechercher la commande par ID
    const order = await Commandes.findById(id);

    // Vérifier si la commande existe
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    // Vérifier si le statut actuel est "livré"
    if (order.status === 'Livrée') {
      return res.status(400).json({ message: 'La commande est déjà livrée et ne peut pas être modifiée.' });
    }

    // Restaurer les stocks si la commande est annulée
    if (order.status !== "Annulée" && newStatus === "Annulée") {
      const restoreStocks = async () => {
        for (const item of order.cart) {
          const { producId, qty, size, color } = item;

          const produit = await Produits.findById(producId);
          if (!produit) {
            throw new Error(`Produit avec l'ID ${producId} introuvable.`);
          }

          // Restaurer le stock global
          produit.stockGlobal += qty;

          // Trouver la variante de couleur
          const colorVariant = produit.othersColors.find((c) => c.color === color);
          if (colorVariant) {
            // Restaurer le stock de la couleur
            colorVariant.stock += qty;

            // Restaurer le stock de la taille, si applicable
            if (size) {
              const sizeVariant = colorVariant.sizes.find((s) => s.size === size);
              if (sizeVariant) {
                sizeVariant.stock += qty;
              }
            }
          }

          // Sauvegarder les changements dans le produit
          await produit.save();
        }
      };

      await restoreStocks();
    }

    // Mettre à jour le statut de la commande
    order.status = newStatus;

    // Sauvegarder la commande mise à jour
    await order.save();

    // Répondre avec la commande mise à jour
    return res.status(200).json({ message: 'Statut de la commande mis à jour avec succès.', order });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande :', error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


exports.getUserCommandes = async (req, res) => {
  try {
    const { userId } = req.params;

    // Étape 1 : Récupérer toutes les commandes de l'utilisateur
    const orders = await Commandes.find({ userId });
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Aucune commande trouvée pour cet utilisateur.' });
    }

    // Étape 2 : Récupérer tous les IDs des produits des commandes
    const productIds = orders
      .flatMap((order) => order.cart.map((item) => item.producId));

    // Étape 3 : Récupérer les produits correspondants
    const products = await Produits.find({ _id: { $in: productIds } });

    // Étape 4 : Enrichir chaque commande avec les informations des produits
    const enrichedOrders = orders.map((order) => {
      const enrichedCart = order.cart
        .map((item) => {
          const product = products.find(
            (prod) => prod._id.toString() === item.producId.toString()
          );
          return product
            ? {
              id: product._id,
              name: product.name,
              image: product.othersColors?.[0]?.images || null,
              qty: item.qty,
              price: product.price,
              color: item.color,
              size: item.size,
            }
            : null;
        })
        .filter(Boolean); // Supprimer les entrées nulles

      return {
        ...order.toObject(),
        cart: enrichedCart,
      };
    });

    // Étape 5 : Retourner les commandes enrichies
    return res.status(200).json({
      message: 'Commandes récupérées avec succès',
      orders: enrichedOrders,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erreur lors de la récupération des commandes',
      error: error.message,
    });
  }
};



exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Trouver la commande par ID
    const order = await Commandes.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier le statut de la commande
    if (order.status !== "en attente") {
      return res.status(400).json({
        message: 'Seules les commandes en attente peuvent être annulées.'
      });
    }

    // Restaurer les stocks pour chaque article du panier avant suppression
    for (const item of order.cart) {
      const { producId, qty, size, color } = item;

      const produit = await Produits.findById(producId);
      if (!produit) {
        return res.status(404).json({ message: `Produit avec l'ID ${producId} introuvable.` });
      }

      // Restaurer le stock global
      produit.stockGlobal += qty;

      // Trouver la variante de couleur
      const colorVariant = produit.othersColors.find((c) => c.color === color);
      if (colorVariant) {
        // Restaurer le stock de la couleur
        colorVariant.stock += qty;

        // Restaurer le stock de la taille, si applicable
        if (size) {
          const sizeVariant = colorVariant.sizes.find((s) => s.size === size);
          if (sizeVariant) {
            sizeVariant.stock += qty;
          }
        }
      }

      // Sauvegarder les changements dans le produit
      await produit.save();
    }

    // Supprimer la commande
    await order.deleteOne();

    res.status(200).json({
      message: "Commande supprimée et stock restauré avec succès.",
      order: order,
    });


  } catch (err) {
    return res.status(500).json({
      message: 'Erreur lors de l\'annulation de la commande',
      error: err.message,
    });
  }
};


exports.getStatsByCategories = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json(
        { message: 'userId est requis' },
      );
    }
    const results = await Vente.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: { nom: "$nom", categories: "$categories" },
          total_vendu: { $sum: "$qty" }
        }
      },
      {
        $sort: { total_vendu: -1 } // Trier par total_vendu en ordre décroissant
      }
    ]);

    return res.status(200).json(
      { message: 'ok', results: results },
    );
  } catch (err) {
    return res.status(500).json(
      { error: 'Une erreur s\'est produite lors de la récupération des statistiques de vente.', message: err.message },
    );
  }
};

exports.getStatsHebdo = async (req, res, next) => {

  try {

    const { userId } = req.params

    const startOfWeek = moment().startOf('isoWeek').toDate();
    const endOfWeek = moment().endOf('isoWeek').toDate();

    let data = [];
    let currentDate = moment(startOfWeek);

    while (currentDate <= endOfWeek) {
      const total = await Vente.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date_vente: {
              $gte: currentDate.toDate(),
              $lt: currentDate.clone().add(1, 'days').toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$prix_vente" },
          },
        },
      ]);

      data.push({
        date: currentDate.format('DD-MM-YYYY'),
        total: total.length > 0 ? total[0].total : 0,
      });

      currentDate.add(1, 'day');
    }

    const totalHebdomendaire = await Vente.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date_vente: {
            $gte: startOfWeek,
            $lte: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$prix_vente" },
        },
      },
    ]);

    return res.status(200).json({
      stats: data,
      totalHebdo: totalHebdomendaire.length > 0 ? totalHebdomendaire[0].total : 0,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

exports.getStatsByMonth = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json(
        { message: 'userId est requis' },
      );
    }

    const results = await Vente.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            annee: { $year: "$date_vente" },
            mois: { $month: "$date_vente" }
          },
          nombre_ventes: { $sum: "$qty" }, // Somme des quantités de produits vendus,
          total_ventes: { $sum: { $multiply: ["$prix_vente", "$qty"] } }
        }
      },
      {
        $sort: { "_id.annee": 1, "_id.mois": 1 }
      },
      {
        $project: {
          _id: 0,
          annee: "$_id.annee",
          mois: "$_id.mois",
          nombre_ventes: 1,
          total_ventes: 1
        }
      }
    ]);

    return res.status(200).json(
      { message: 'ok', results },

    );
  } catch (err) {
    return res.status(500).json(
      { error: 'Une erreur s\'est produite lors de la récupération des statistiques de vente.', message: err.message },

    );
  }
};








