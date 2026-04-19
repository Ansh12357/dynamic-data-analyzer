const mongoose = require("mongoose");

// Dynamic schema (koi v dataset chalega)
const dataSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("Data", dataSchema);