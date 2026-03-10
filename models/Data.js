const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
  name: String,
  email: String,
  sales: Number,
  city: String
});

module.exports = mongoose.model("Data", DataSchema);