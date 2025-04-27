const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const Record = require(__dirname + "/../models/record");
const Patient = require(__dirname + "/../models/patient");
const Physio = require(__dirname + "/../models/physio");

router.get("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.find()
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Record not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// router.get(
//   "/patient/:id/appointsments/dates",
//   protegerRuta(["admin", "physio", "patient"]),
//   async (req, res) => {
//     let id = req.params.id;
//     let patient = await Patient.findById(id);
//     console.log(patient);
//     if (!patient) {
//       res.status(404).send({
//         ok: false,
//         error: "No existe paciente con id " + req.params.id,
//       });
//     }

//     Record.findOne({ patient: patient }).then((result) => {
//       //   res.status(200).send({ ok: true, resultado: result });
//       //   console.log(appointments);
//       // let app = result.appointments.map(r);
//       // console.log(app);
//       // res.status(200).send({ ok: true, resultado: app });
//       if (result.appointments) {
//         res.status(200).send({ ok: true, result: result.appointments });
//       } else {
//         res.status(404).send({ ok: false, result: "No hay citas registradas" });
//       }
//     });
//   }
// );

router.get("/find", protegerRuta(["admin", "physio"]), async (req, res) => {
  let result;
  const { surname } = req.query;
  try {
    if (surname) {
      let patients = await Patient.find({ surname: { $regex: surname } });
      result = await Record.find({
        patient: { $in: patients.map((s) => s._id) },
      });
    } else {
      result = await Record.find();
    }
    res.status(200).send({ ok: true, resultado: result });
  } catch (err) {
    if (res.length === 0) {
      res.status(404).send({ ok: false, error: "Record not found" });
    } else {
      res.status(500).send({ ok: false, error: "Internal server error" });
    }
  }
});

// MOVILES
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
/**
 * Coger appointments por id de aPpointment
 */
//buscar appointment por id de appointment
router.get(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.find({})
      .then((result) => {
        let appointments = result.flatMap((record) => record.appointments);
        let appointment = appointments.find(
          (r) => r._id.toString() === req.params.id.toString()
        );
        if (!appointment) {
          return res.status(404).send({
            ok: false,
            error: "No existe appointment con id " + req.params.id,
          });
        }
        res.status(200).send({ ok: true, resultado: appointment });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Record not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);
/**
 * Las dos rutas que tengo aqui son para buscar appointments por id de patient o de physio
 * En el caso de que no haya appointments, se devuelve un 404
 * En el caso de que haya appointments, se devuelve un 200 y el resultado
 * En el caso de que no haya patient o physio, se devuelve un 404
 * En el caso de que haya un error, se devuelve un 500
 */
//Buscar Appointment por id del patient
router.get(
  "/appointments/patients/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    Patient.findById(req.params.id).then((patient) => {
      if (!patient) {
        return res.status(404).send({
          ok: false,
          error: "No existe paciente con id " + req.params.id,
        });
      }
      Record.find({ patient: patient._id })
        .then((result) => {
          let appointments = result.map((record) => record.appointments);
          appointments = appointments.flatMap((record) => record);

          res.status(200).send({ ok: true, resultado: appointments });
        })
        .catch((err) => {
          if (res.length === 0) {
            res.status(404).send({ ok: false, error: "Record not found" });
          } else {
            res.status(500).send({ ok: false, error: "Internal server error" });
          }
        });
    });
  }
);
//Buscar Appointment por id del fisio
router.get(
  "/appointments/physio/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Physio.findById(req.params.id).then((physio) => {
      if (!physio) {
        return res.status(404).send({
          ok: false,
          error: "No existe physio con id " + req.params.id,
        });
      }

      Record.find({})
        .then((result) => {
          let appointments = result.flatMap((record) => record.appointments);
          let physios = appointments.filter(
            (r) => r.physio.toString() === physio.id.toString()
          );
          res.status(200).send({ ok: true, resultado: physios });
        })
        .catch((err) => {
          if (res.length === 0) {
            res.status(404).send({ ok: false, error: "Record not found" });
          } else {
            res.status(500).send({ ok: false, error: "Internal server error" });
          }
        });
    });
  }
);

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
    Record.findById(req.params.id)
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Record not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

router.get(
  "/:id/appointments",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.findById(req.params.id)
      .populate("appointments")
      .then((result) => {
        console.log(result.appointments);
        res.status(200).send({ ok: true, resultado: result.appointments });
      })
      .catch((err) => {
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Record not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

router.post("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { patient, medicalRecord, appointments } = req.body;
  const newRecord = new Record({
    patient,
    medicalRecord,
    appointments,
  });
  newRecord
    .save()
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: "Internal server error" });
    });
});

router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { date, patient, physio, treatment } = req.body;
  Record.findByIdAndUpdate(req.params.id, {
    date,
    patient,
    physio,
    treatment,
  })
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: "Internal server error" });
    });
});

router.delete("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Record not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

module.exports = router;
