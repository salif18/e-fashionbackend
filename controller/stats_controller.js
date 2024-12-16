const Commandes = require("../models/commandes_model")
const moment = require("moment");
const mongoose = require("mongoose");

exports.getStatsDay=async(req,res,next)=>{
  try{
    const now  = new Date()
    const starOfDay = new Date(now)
    starOfDay.setHours(0,0,0,0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23,59,59,999)
    const results = await Commandes.aggregate([
        {
            $match: {
                createdAt: { $gte: starOfDay, $lte: endOfDay }
            }
        },
        {
            $group: {
                _id:  { $hour: "$createdAt" },
                    
                nombre_commandes: { $sum: 1 },
                total_ventes: { $sum: "$total" }
            }
        },
        {
            $project: {
                _id: 0,
                hour: "$_id",
                nombre_commandes: 1,
                total_ventes: 1

            }
        },

        {$sort:{_id:1}}
    ]);

    // Réponse au client
    return res.status(200).json({
        stats: results,
       
    });
} catch (error) {
    // Gestion des erreurs
    return res.status(500).json({
        status: false,
        error: error.message,
    });
}
}

exports.getStatsHebdo = async (req, res, next) => {
    try {

        // Début et fin de la semaine en cours
        const startOfWeek = moment().startOf('isoWeek').toDate();
        const endOfWeek = moment().endOf('isoWeek').toDate();

        let data = [];
        let currentDate = moment(startOfWeek);

        // Boucle pour chaque jour de la semaine
        while (currentDate <= endOfWeek) {
            const total = await Commandes.aggregate([
                {
                    $match: {
                        status: "Livrée", // Filtrer uniquement les commandes livrées
                        createdAt: {
                            $gte: currentDate.toDate(), // Début de la journée
                            $lt: currentDate.clone().add(1, 'days').toDate(), // Fin de la journée
                        },
                    },
                },
                {
                    $group: {
                        _id: null, // Pas de regroupement spécifique
                        total: { $sum: "$total" }, // Somme des totaux de commande
                    },
                },
            ]);

            // Ajout des données journalières
            data.push({
                date: currentDate.format('DD-MM-YYYY'),
                total: total.length > 0 ? total[0].total : 0,
            });

            currentDate.add(1, 'day'); // Passer au jour suivant
        }

        // Calcul du total hebdomadaire
        const totalHebdomendaire = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée", // Filtrer uniquement les commandes livrées
                    createdAt: {
                        $gte: startOfWeek, // Début de la semaine
                        $lte: endOfWeek, // Fin de la semaine
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total" }, // Somme des totaux hebdomadaires
                },
            },
        ]);

        // Réponse au client
        return res.status(200).json({
            statsWeek: data,
            totalHebdo: totalHebdomendaire.length > 0 ? totalHebdomendaire[0].total : 0,
        });
    } catch (error) {
        // Gestion des erreurs
        return res.status(500).json({
            status: false,
            error: error.message,
        });
    }
}

exports.getStatCurrentMonth = async (req, res, next) => {
    const now = new Date()
    const starMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    starMonth.setHours(0, 0, 0, 0)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endMonth.setHours(23, 59, 59, 999)
    try {
        const results = await Commandes.aggregate([
            {
                $match: {
                    createdAt: { $gte: starMonth, $lte: endMonth }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                    },
                    nombre_commandes: { $sum: 1 },
                    total_ventes: { $sum: "$total" }
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day",
                    nombre_commandes: 1,
                    total_ventes: 1

                }
            }
        ]);

        return res.status(200).json({
            message: "ok",
            stats: results
        })
    } catch (e) {
        return res.status(500).json({
            error: 'Une erreur s\'est produite lors de la récupération des statistiques de commandes.',
            message: e.message,
        })
    }
}

exports.getStatsCurrentYear = async (req, res, next) => {
    //   const starYear = new Date(new Date().getFullYear() , 0,1)
    //   const endYear = new Date(new Date().getFullYear() +1 , 0, 1)
    const now = new Date()
    const starYear = new Date(now.getFullYear(), 0, 1)
    starYear.setHours(0, 0, 0, 0)
    const endYear = new Date(now.getFullYear(), 11, 31);
    endYear.setHours(23, 59, 59, 999)
    try {
        const results = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée", // Filtrer uniquement les commandes livrées
                    createdAt: {
                        $gte: starYear,
                        $lte: endYear
                    }
                }
            },
            {
                $group: {
                    _id: {
                        annee: { $year: "$createdAt" }, // Extraire l'année
                        mois: { $month: "$createdAt" }  // Extraire le mois
                    },
                    nombre_commandes: { $sum: 1 }, // Compte le nombre de commandes
                    total_ventes: { $sum: "$total" } // Somme des totaux des commandes
                }
            },
            {
                $sort: { "_id.annee": 1, "_id.mois": 1 } // Tri par année et mois
            },
            {
                $project: {
                    _id: 0, // Supprime l'ID MongoDB par défaut
                    annee: "$_id.annee",
                    mois: "$_id.mois",
                    nombre_commandes: 1,
                    total_ventes: 1
                }
            }
        ]);

        return res.status(200).json({
            message: 'Statistiques par mois (commandes livrées) récupérées avec succès',
            stats: results,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Une erreur s\'est produite lors de la récupération des statistiques de commandes.',
            message: err.message,
        });
    }
};


exports.getStatsByYears = async (req, res, next) => {
    try {
        const results = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée" // Filtrer uniquement les commandes livrées
                }
            },
            {
                $group: {
                    _id: {
                        annee: { $year: "$createdAt" }, // Extraire l'année
                        mois: { $month: "$createdAt" }  // Extraire le mois
                    },
                    nombre_commandes: { $sum: 1 }, // Compte le nombre de commandes
                    total_ventes: { $sum: "$total" } // Somme des totaux des commandes
                }
            },
            {
                $sort: { "_id.annee": 1, "_id.mois": 1 } // Tri par année et mois
            },
            {
                $project: {
                    _id: 0, // Supprime l'ID MongoDB par défaut
                    annee: "$_id.annee",
                    mois: "$_id.mois",
                    nombre_commandes: 1,
                    total_ventes: 1
                }
            }
        ]);

        return res.status(200).json({
            message: 'Statistiques par mois (commandes livrées) récupérées avec succès',
            statsMonth: results,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Une erreur s\'est produite lors de la récupération des statistiques de commandes.',
            message: err.message,
        });
    }
};

exports.clientFidelAndGrosAcheteur = async (req, res) => {
    try {
        const result = await Commandes.aggregate([
            {
                $group: {
                    _id: "$userId",
                    nombreAchat: { $sum: 1 },
                    sommeRendu: { $sum: "$total" }
                }
            },
            { $sort: { nombreAchat: -1, sommeRendu: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    name: "$userInfo.name",
                    email: "$userInfo.email",
                    nombreAchat: 1,
                    sommeRendu: 1
                }
            }
        ])
        return res.status(200).json({
            status: true,
            message: "ok",
            stats: result
        })
    } catch (err) {
        return res.status(500).json(
            { error: 'Une erreur s\'est produite lors de la récupération des statistiques de vente.', message: err.message },

        );
    }
}


exports.countAllOrders = async (req, res) => {
    try {
        const totalOrders = await Commandes.countDocuments(); // Compte toutes les commandes
        return res.status(200).json({
            status: true,
            message: "ok",
            countCommandes: totalOrders
        })
    } catch (err) {
        return res.status(500).json(
            { error: 'Une erreur s\'est produite lors de la récupération des statistiques de vente.', message: err.message },

        );
    }
}

exports.getProduitsLesPlusAchetés = async (req, res) => {
    try {
        const produitsLesPlusAchetés = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée", // Seulement les commandes livrées
                },
            },
            {
                $unwind: "$cart",
            },
            {
                $group: {
                    _id: "$cart.producId", // Groupement par productId
                    totalQuantity: { $sum: "$cart.qty" }, // Somme des quantités
                },
            },
            {
                $lookup: {
                    from: "produits", // Collection des produits
                    localField: "_id", // Correspond à productId dans la collection Commandes
                    foreignField: "_id", // Correspond à _id dans la collection Produits
                    as: "produitDetails", // Nom donné à la collection jointe
                },
            },
            {
                $project: {
                    _id: 0,
                    produitId: "$_id",
                    totalQuantity: 1,
                    name: { $arrayElemAt: ["$produitDetails.name", 0] },
                    // Vérification si `othersColors.images` est un tableau non vide
                    image: {
                        $cond: {
                            if: {
                                $and: [
                                    { $isArray: "$produitDetails.othersColors.images" },
                                    { $gt: [{ $size: "$produitDetails.othersColors.images" }, 0] },
                                ],
                            },
                            then: { $arrayElemAt: ["$produitDetails.othersColors.images", 0] },
                            else: "default_image_url.jpg", // Remplacez par l'URL d'une image par défaut
                        },
                    },
                    categorie: { $arrayElemAt: ["$produitDetails.category", 0] },
                    sousCategorie: { $arrayElemAt: ["$produitDetails.subCategory", 0] },
                },
            },
            {
                $sort: {
                    totalQuantity: -1, // Tri par quantité décroissante
                },
            },
            {
                $limit: 5, // Limiter aux 5 produits les plus achetés
            },
        ]);

        return res.status(200).json({
            produitsLesPlusAchetés,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la récupération des produits les plus achetés.",
            error: error.message,
        });
    }
};
