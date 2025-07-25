const mongoose = require("mongoose");

let physioSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    minlength: [2, "El nombre debe tener al menos 2 caracteres"],
    maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
    trim: true,
  },
  surname: {
    type: String,
    require: true,
    minlength: [2, "El apellido debe tener al menos 2 caracteres"],
    maxlength: [50, "El apellido no puede tener más de 50 caracteres"],
    trim: true,
  },
  specialty: {
    type: String,
    require: true,
    enum: {
      values: [
        "Sports",
        "Neurological",
        "Pediatric",
        "Geriatric",
        "Oncological",
      ],
      message: "{VALUE} no es una especialidad válida",
    },
  },
  licenseNumber: {
    type: String,
    require: true,
    unique: [true, "El número de licencia ya existe"],
    match: [
      /^[a-zA-Z0-9]{8}$/,
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
    default: "https://hectorrp.com/api/img/physios/1748288535717.jpg",
  },
  starts: {
    type: Number,
    default: 1,
    min: [1, "Las estrellas deben ser un número positivo"],
    max: [5, "Las estrellas no pueden ser más de 5"],
  },
});

let Physio = mongoose.model("Physio", physioSchema);
module.exports = Physio;
