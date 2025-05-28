const mongoose = require("mongoose");

let patientSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    minlength: [3, "El nombre debe tener al menos 3 caracteres"],
    maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
    trim: true,
  },
  surname: {
    type: String,
    require: true,
    minlength: [3, "El apellido debe tener al menos 3 caracteres"],
    maxlength: [50, "El apellido no puede tener más de 50 caracteres"],
    trim: true,
  },
  birthDate: {
    type: Date,
    require: true,
  },
  address: {
    type: String,
    maxlenght: [100, "La dirección no puede tener más de 100 caracteres"],
    trim: true,
  },
  insuranceNumber: {
    type: String,
    require: true,
    unique: [true, "El número de seguro ya existe"],
    match: [
      /^[a-zA-Z0-9]{9}$/,
      "El número de seguro debe tener 9 caracteres alfanuméricos",
    ],
  },
  email: {
    type: String,
    require: true,
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  avatar: {
    type: String,
    default:
      "https://olexanderg.net/img/logomiguel.jpg",
  },
  lat: {
    type: Number,
    default: 0,
  },
  lng: {
    type: Number,
    default: 0,
  },
});
let Patient = mongoose.model("patient", patientSchema);
module.exports = Patient;
