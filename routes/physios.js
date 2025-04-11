const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const Physio = require(__dirname + "/../models/physio");

router.get(
  "/",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    Physio.find()
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Physio not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

router.get(
  "/find",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    let result;
    const { specialty } = req.query;
    try {
      if (specialty) {
        result = await Physio.find({
          specialty: {
            $regex: specialty,
          },
        });
      } else {
        result = await Physio.find();
      }
      res.status(200).send({ ok: true, resultado: result });
    } catch (err) {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Physio not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    }
  }
);

router.get(
  "/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    Physio.findById(req.params.id)
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Physio not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

router.post("/", protegerRuta(["admin"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email } = req.body;
  const newPhysio = new Physio({
    name,
    surname,
    specialty,
    licenseNumber,
    email,
  });
  console.log("newPhysio", newPhysio);
  newPhysio
    .save()
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      // res.status(500).send({ ok: false, error: "Internal server error" });
      if (err.code === 11000) {
        res.status(400).send({
          ok: false,
          error: "El número de licencia ya existe",
        });
      } else if (err.name === "ValidationError") {
        res.status(400).send({
          ok: false,
          error: err.message,
        });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

router.put("/:id", protegerRuta(["admin"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email } = req.body;
  Physio.findByIdAndUpdate(
    req.params.id,
    {
      name,
      surname,
      specialty,
      licenseNumber,
      email,
    },
    { new: true }
  )
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      // if (res.length === 0) {
      //   res.status(404).send({ ok: false, error: "Physio not found" });
      // } else {
      //   res.status(500).send({ ok: false, error: "Internal server error" });
      // }
      if (err.code === 11000) {
        res.status(400).send({
          ok: false,
          error: "El número de licencia ya existe",
        });
      } else if (err.name === "ValidationError") {
        res.status(400).send({
          ok: false,
          error: err.message,
        });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

router.delete("/:id", protegerRuta(["admin"]), async (req, res) => {
  Physio.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Physio not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

module.exports = router;
