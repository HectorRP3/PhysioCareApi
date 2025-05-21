const mongoose = require("mongoose");
let appointmentsSchema = new mongoose.Schema({
  date: {
    type: Date,
    require: true,
  },
  physio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "physio",
    require: true,
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: 500,
    minlength: 10,
  },
  treatment: {
    type: String,
    trim: true,
  },
  observations: {
    type: String,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "completed", "cancelled"],
      message: "{VALUE} no es un estado válido",
    },
    default: "pending",
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "patient",
    require: false,
  },
  // añadir la referecnia del patient
});
let recordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "patient",
    require: true,
  },
  medicalRecord: {
    type: String,
    require: false,
    maxlength: 1000,
  },
  appointments: [appointmentsSchema],
});

let Record = mongoose.model("record", recordSchema);
module.exports = Record;
