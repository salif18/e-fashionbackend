const Abonnees = require("../models/abonnees_model");

exports.registre = async (req, res) => {
    try {
        const { email } = req.body;
    console.log(email)
        // Vérifier si l'abonné existe déjà
        const abonneExist = await Abonnees.findOne({ email });
        if (abonneExist) {
            return res.status(400).json({
                message: 'Cet email est déjà abonné.',
            });
        }

        // Créer un nouvel abonné
        const abonne = new Abonnees({ email });
        
        // Enregistrer l'abonné dans la base de données
        await abonne.save();

        return res.status(201).json({
            message: 'Vous êtes abonné avec succès!',
            email: abonne.email,
        });
    } catch (e) {
        console.error("Erreur lors de l'enregistrement de l'abonné:", e);
        return res.status(500).json({
            message: 'Erreur interne du serveur.',
            error: e.message,
        });
    }
};

exports.getAbonnees = async (req, res) => {
    try {
        // Récupérer tous les abonnés
        const abonnees = await Abonnees.find();

        // Vérifier si des abonnés existent
        if (abonnees.length === 0) {
            return res.status(404).json({
                message: 'Aucun abonné trouvé.',
            });
        }

        // Retourner les abonnés
        return res.status(200).json({
            message: 'Liste des abonnés récupérée avec succès.',
            abonnees,
        });
    } catch (e) {
        console.error("Erreur lors de la récupération des abonnés:", e);
        return res.status(500).json({
            message: 'Erreur interne du serveur.',
            error: e.message,
        });
    }
};
