const Commandes = require("../models/commandes_model")
const moment = require("moment");
const mongoose = require("mongoose");

exports.getStatsDay = async (req, res, next) => {
    try {
        const now = new Date()
        const starOfDay = new Date(now)
        starOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        const results = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée", // Filtrer uniquement les commandes livrées
                    createdAt: { $gte: starOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },

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

            { $sort: { _id: 1 } }
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

// exports.getStatsHebdo = async (req, res, next) => {
//     try {
//         const now = new Date()
//         const today = now.getDay()
//         // Début et fin de la semaine en cours
//         const startOfWeek = new Date(now)
//         startOfWeek.setDate(now.getDate() - (today === 0 ? 6 : today - 1))
//         startOfWeek.setHours(0, 0, 0, 0)
//         const endOfWeek = new Date(startOfWeek)
//         endOfWeek.setDate(startOfWeek.getDate() + 6)
//         endOfWeek.setHours(23, 59, 59, 999)

//         const results = await Commandes.aggregate([
//             {
//                 $match: {
//                     status: "Livrée", // Filtrer uniquement les commandes livrées
//                     createdAt: {
//                         $gte: startOfWeek, // Début de la semaine
//                         $lte: endOfWeek, // Fin de la semaine
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: {
//                         $dateToString: { format: "%d-%m-%Y", date: "$createdAt" },
//                     },
//                     total: { $sum: "$total" }, // Somme des totaux hebdomadaires
//                 },
//             },



//         ])

//            // Calcul du total hebdomadaire
//            const totalHebdomendaire = await Commandes.aggregate([
//             {
//                 $match: {
//                     status: "Livrée", // Filtrer uniquement les commandes livrées
//                     createdAt: {
//                         $gte: startOfWeek, // Début de la semaine
//                         $lte: endOfWeek, // Fin de la semaine
//                     },
//                 },
//             },
//             {
//                 $group: {
//                     _id: null,
//                     total: { $sum: "$total" }, // Somme des totaux hebdomadaires
//                 },
//             },
//         ]);

//         // Réponse au client
//         return res.status(200).json({
//             statsWeek: results,
//             totalHebdo: totalHebdomendaire.length > 0 ? totalHebdomendaire[0].total : 0,
//         });
//     } catch (error) {
//         // Gestion des erreurs
//         return res.status(500).json({
//             status: false,
//             error: error.message,
//         });
//     }
// }

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
                    status: "Livrée", // Filtrer uniquement les commandes livrées
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
            { $sort: { "_id.day": 1 } },// Tri par année et mois
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
            message: 'Statistiques de lannee courante (commandes livrées) récupérées avec succès',
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
            stats: results,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Une erreur s\'est produite lors de la récupération des statistiques de commandes.',
            message: err.message,
        });
    }
};

exports.clientFidel = async (req, res) => {
    try {
        const result = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée" // Filtrer uniquement les commandes livrées
                }
            },
            {
                $group: {
                    _id: "$userId",
                    nombreAchat: { $sum: 1 },

                }
            },
            { $sort: { nombreAchat: -1 } },
            { $limit: 10 },
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


exports.clientGrosAcheteur = async (req, res) => {
    try {
        const result = await Commandes.aggregate([
            {
                $match: {
                    status: "Livrée" // Filtrer uniquement les commandes livrées
                }
            },
            {
                $group: {
                    _id: "$userId",
                    sommeRendu: { $sum: "$total" }
                }
            },
            { $sort: { sommeRendu: -1 } },
            { $limit: 10 },
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

exports.countStatsOrders = async (req, res) => {
    try {
        const totalOrders = await Commandes.aggregate([
            {
                $facet: {
                    livrees: [
                        {
                            $match: { status: 'Livrée' }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 }
                            }
                        }
                    ],
                    annulees: [
                        {
                            $match: { status: 'Annulée' }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);

        // Restructuration des résultats pour une sortie simplifiée
        const countCommandes = {
            livrees: totalOrders[0].livrees.length > 0 ? totalOrders[0].livrees[0].total : 0,
            annulees: totalOrders[0].annulees.length > 0 ? totalOrders[0].annulees[0].total : 0,
        };

        return res.status(200).json({
            status: true,
            message: "ok",
            countCommandes
        });
    } catch (err) {
        return res.status(500).json({
            error: "Une erreur s'est produite lors de la récupération des statistiques de vente.",
            message: err.message,
        });
    }
};

exports.getProduitsLesPlusAchetés = async (req, res) => {
    try {
        const produitsLesPlusAchetés = await Commandes.aggregate([
            { $match: { status: "Livrée" } },
            { $unwind: "$cart" },
            {
                $group: {
                    _id: "$cart.producId",
                    totalQuantity: { $sum: "$cart.qty" },
                },
            },
            {
                $lookup: {
                    from: "produits",
                    localField: "_id",
                    foreignField: "_id",
                    as: "produitDetails",
                },
            },
            { $unwind: { path: "$produitDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    produitId: "$_id",
                    totalQuantity: 1,
                    name: "$produitDetails.name",
                    image: {
                        $cond: {
                            if: {
                                $and: [
                                    { $isArray: "$produitDetails.othersColors.images" },
                                    { $gt: [{ $size: "$produitDetails.othersColors.images" }, 0] },
                                ],
                            },
                            then: { $arrayElemAt: ["$produitDetails.othersColors.images", 0] },
                            else: "default_image_url.jpg",
                        },
                    },
                    categorie: "$produitDetails.category",
                    sousCategorie: "$produitDetails.subCategory",
                },
            },
            { $sort: { totalQuantity: -1, produitId: 1 } },
            { $limit: 10 },
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
