const mongoose = require("mongoose");

// nominee
const nomineeSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  department: String,
  email: {type: String},
  category: [],
  image: String,
  votes: [], 
});


const nomineeModel = mongoose.model("nominee", nomineeSchema);

module.exports = {
  nomineeModel,
};
