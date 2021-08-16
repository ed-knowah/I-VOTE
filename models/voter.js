const mongoose = require("mongoose");



const voterSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    password: String,
    votedFor: []
  });
  
const voter = mongoose.model("voter", voterSchema);

module.exports = {
    voter
  };