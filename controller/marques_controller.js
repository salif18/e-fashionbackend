const Marques = require("../models/marques_model");

// Créer une nouvelle marque
exports.createMarques = async (req, res) => {
  try {
    const newMarques = new Marques({
      ...req.body,
    });

    const marquesSave = await newMarques.save();

    return res.status(201).json({
      status: true,
      message: "Marque ajoutée dans la base avec succès.",
      marques: marquesSave,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Erreur lors de l'insertion de la marque dans la base.",
      error: err.message,
    });
  }
};

// Obtenir toutes les marques
exports.getMarques = async (req, res) => {
  try {
    const marques = await Marques.find();

    if (!marques || marques.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Aucune marque trouvée dans la base de données.",
      });
    }

    return res.status(200).json({
      status: true,
      marques: marques,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Erreur lors de la récupération des marques.",
      error: err.message,
    });
  }
};


// Mettre à jour une marque
exports.getOneMarque = async (req, res) => {
    try {
      const { id } = req.params;
  
      const marque = await Marques.findById(id);
  
      if (!marque) {
        return res.status(404).json({
          status: false,
          message: "Cette marque n'est pas dans la base.",
        });
      }
  
  
      return res.status(200).json({
        status: true,
        message: "Marque mise à jour avec succès.",
        marque: marque,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la mise à jour de la marque.",
        error: err.message,
      });
    }
  };
  

// Mettre à jour une marque
exports.updateMarques = async (req, res) => {
  try {
    const { id } = req.params;

    const marque = await Marques.findById(id);

    if (!marque) {
      return res.status(404).json({
        status: false,
        message: "Cette marque n'est pas dans la base.",
      });
    }

    marque.name = req.body.name || marque.name;
    marque.image = req.body.image || marque.image;

    const updateMarque = await marque.save();

    return res.status(200).json({
      status: true,
      message: "Marque mise à jour avec succès.",
      marques: updateMarque,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Erreur lors de la mise à jour de la marque.",
      error: err.message,
    });
  }
};

// Supprimer une marque
exports.DeleteMarques = async (req, res) => {
  try {
    const { id } = req.params;

    const marque = await Marques.findById(id);

    if (!marque) {
      return res.status(404).json({
        status: false,
        message: "Cette marque n'est pas dans la base.",
      });
    }

    await marque.remove();

    return res.status(200).json({
      status: true,
      message: "Marque supprimée avec succès.",
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Erreur lors de la suppression de la marque.",
      error: err.message,
    });
  }
};
