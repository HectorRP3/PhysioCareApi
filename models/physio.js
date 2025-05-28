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
    default:
      "https://imgs.search.brave.com/6I9aKfyfJFCO-_3OXDRc0osyE8JTnjCUiIO2ccf1aWc/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pbWdz/LnNlYXJjaC5icmF2/ZS5jb20vUjBOOUla/VGM2WHRveFZ1Q1hk/VVBsTV9wS0k4clZM/eEdXZkNISWR2UUlR/SS9yczpmaXQ6NTAw/OjA6MDowL2c6Y2Uv/YUhSMGNITTZMeTl0/WVhKci9aWFJ3YkdG/alpTNWpZVzUyL1lT/NWpiMjB2UlVGSGFI/WlovWW5ZMk1YY3ZN/Uzh3THpFMi9NREIz/TDJOaGJuWmhMV1p2/L2RHOHRaR1V0Y0dW/eVptbHMvTFdSbExX/bHVjM1JoWjNKaC9i/UzF0ZFdwbGNpMXRi/MlJsL2NtNXZMVGQw/VmpseFgwbFAvZEVN/d0xtcHdadw.jpeg",
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
