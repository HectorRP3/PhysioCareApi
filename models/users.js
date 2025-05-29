const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  login: {
    type: String,
    minlenght: 4,
    trim: true,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
    minlenght: 3,
    trim: true,
  },
  rol: {
    type: String,
    require: true,
    enum: ["admin", "physio", "patient"],
  },
  firebaseToken: {
    type: String,
    default: "",
  },
});

let User = mongoose.model("Users", userSchema);
module.exports = User;
