const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();
const dotenv = require("dotenv");
const e = require("express");
dotenv.config();
const bycrypt = require("bcryptjs");

const Patient = require(__dirname + "/../models/patient");
const User = require(__dirname + "/../models/users");
const Auth = require(__dirname + "/../auth/auth");
const Record = require(__dirname + "/../models/record");

// ------------------------------------------------------------
// patientRoutes.js
// ------------------------------------------------------------
// Rutas relacionadas con el modelo Patient.
// Cada ruta está protegida por el middleware "protegerRuta" que
// restringe el acceso según los roles indicados.
//
// ▸ GET    /               — Lista de pacientes.
// ▸ GET    /find           — Búsqueda filtrada por apellido.
// ▸ GET    /user/:id       — Obtiene el _id del paciente a partir
//                             del id de usuario (para la app móvil).
// ▸ GET    /:id            — Obtiene un paciente por su _id.
// ▸ POST   /               — Crea un nuevo paciente.
// ▸ PUT    /:id            — Modifica un paciente existente.
// ▸ DELETE /:id            — Elimina un paciente.
// ------------------------------------------------------------
router.get("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  Patient.find()
    .then((result) => {
      console.log("entrando");

      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Patient not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

router.get("/find", protegerRuta(["admin", "physio"]), async (req, res) => {
  let result;
  const { surname } = req.query;
  try {
    if (surname) {
      result = await Patient.find({
        surname: {
          $regex: surname,
        },
      });
    } else {
      result = await Patient.find();
    }
    res.status(200).send({ ok: true, resultado: result });
  } catch (err) {
    if (res.length === 0) {
      res.status(404).send({ ok: false, error: "Patient not found" });
    } else {
      res.status(500).send({ ok: false, error: "Internal server error" });
    }
  }
});

router.get(
  "/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    let { id } = req.params.id;
    let user = req.user.login;
    let userRole = req.user.rol;

    if (userRole !== "admin" && userRole !== "physio") {
      let userID = await Patient.findOne({ name: user }).then((result) => {
        u = result._id.toString();
        return u;
      });
      if (userRole === "patient" && req.params.id !== userID) {
        return res.status(403).send({
          ok: false,
          error: "Only the patient can see his/her own data",
        });
      }
    }
    Patient.findById(req.params.id)
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Patient not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

router.post("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  const {
    name,
    surname,
    birthDate,
    address,
    insuranceNumber,
    email,
    password,
    avatar, //nuevo
    lat,
    lng
  } = req.body;
  const newUser = new User({
    login: name,
    password: await bycrypt.hash(password, 10), // Hash the password
    rol: "patient",
  });
  newUser.save().then((result) => {
    console.log("Usuario creado:", result);
  });
  const newPatient = new Patient({
    name,
    surname,
    birthDate,
    address,
    insuranceNumber,
    email,
    userID: newUser._id, // Assign the user ID to the patient
    avatar,
    lat,
    lng
  });
  newPatient
    .save()
    .then(async (result) => {
      const newRecord = new Record({
        patient: result._id,
        medicalRecord: "",
        appointments: [],
      });
      await newRecord.save();
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      // res.status(500).send({ ok: false, error: "Internal server error" });
      if (err.code === 11000) {
        res.status(409).send({
          ok: false,
          error: "El número de seguro ya existe",
        });
      } else if (err.errors) {
        res.status(400).send({
          ok: false,
          error: err.errors[Object.keys(err.errors)[0]].message,
        });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { name, surname, birthDate, address, insuranceNumber, email } =
    req.body;
  Patient.findByIdAndUpdate(
    req.params.id,
    {
      name,
      surname,
      birthDate,
      address,
      insuranceNumber,
      email,
    },
    { new: true }
  )
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      // if (res.length === 0) {
      //   res.status(404).send({ ok: false, error: "Patient not found" });
      // } else {
      //   res.status(500).send({ ok: false, error: "Internal server error" });
      // }
      if (err.code === 11000) {
        res.status(409).send({
          ok: false,
          error: "El número de seguro ya existe",
        });
      } else if (err.errors) {
        res.status(400).send({
          ok: false,
          error: err.errors[Object.keys(err.errors)[0]].message,
        });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

router.delete("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.findOneAndDelete({ patient: req.params.id }).then((result) => {
    if (result) {
      console.log("Record deleted");
    } else {
      console.log("Record not found");
    }
  });
  Patient.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Patient not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

module.exports = router;
