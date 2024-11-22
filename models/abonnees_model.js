const mongoose = require("mongoose");

const schema = mongoose.Schema({
    email: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Abonnees", schema);
