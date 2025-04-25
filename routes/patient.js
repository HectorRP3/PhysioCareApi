const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const Patient = require(__dirname + "/../models/patient");
const User = require(__dirname + "/../models/users");
const Auth = require(__dirname + "/../auth/auth");

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
//Moviles
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
/**
 * Esta ruta es para coger el id del paciente a partir del id de usuario
 */
// This route is used to get the patient ID from the user Id Moviles ruta
router.get("/user/:id", async (req, res) => {
  let { id } = req.params.id;

  let userID = await Patient.findOne({ userID: id }).then((result) => {
    res.status(200).send({ ok: true, resultado: result._id });
  });
  return res.status(403).send({
    ok: false,
    error: "Only the patient can see his/her own data",
  });
});
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

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
  const { name, surname, birthDate, address, insuranceNumber, email } =
    req.body;
  const newPatient = new Patient({
    name,
    surname,
    birthDate,
    address,
    insuranceNumber,
    email,
  });
  newPatient
    .save()
    .then((result) => {
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
      // if (err.code === 11000) {
      //   res.status(409).send({
      //     ok: false,
      //     error: "El número de seguro ya existe",
      //   });
      // } else {
      //   if (err.errors.name) {
      //     res.status(400).send({
      //       ok: false,
      //       error: err.errors.name.message,
      //     });
      //   }
      // }
    });
});

router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { name, surname, birthDate, address, insuranceNumber } = req.body;
  Patient.findByIdAndUpdate(
    req.params.id,
    {
      name,
      surname,
      birthDate,
      address,
      insuranceNumber,
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
