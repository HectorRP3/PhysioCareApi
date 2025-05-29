const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const Record = require(__dirname + "/../models/record");
const Patient = require(__dirname + "/../models/patient");
const Physio = require(__dirname + "/../models/physio");
const { sendNotification } = require("../firebase/firebase.service");
// ------------------------------------------------------------
// recordRoutes.js
// ------------------------------------------------------------
// Rutas relacionadas con el modelo Record.
// Cada ruta está protegida por el middleware "protegerRuta" que
// restringe el acceso según los roles indicados.
//
// ▸ GET    /                               — Lista de historiales clínicos.
// ▸ GET    /find                          — Búsqueda por apellido de paciente.
// ▸ POST   /                               — Crea un nuevo historial.
//
// ▸ Get    /appointmentAdmin
// ▸ GET    /appointments/:id              — Appointment por id de cita.
// ▸ GET    /appointments/patients/:id     — Appointments por id de paciente.
// ▸ GET    /appointments/physio/:id       — Appointments por id de fisio.
// ▸ POST   /appointments/:id              — Añade appointment a un recordS
// ▸ PUT   /appointments/:id              - Editar appointment a un record..
// ▸ DELETE /appointments/:id              — Borra appointment por id de cita.

//
// ▸ GET    /patient/:id                   — Record con populate paciente (autocontrol).
// ▸ GET    /patients/appointments/:id     — Appointments de un record (populate citas).
//
// ▸ GET    /:id                           — Obtiene un record por su _id.
// ▸ GET    /:id/appointments              — Appointments de record con populate.
// ▸ PUT    /:id                           — Modifica un record existente.
// ▸ DELETE /:id                           — Elimina un record.
// ------------------------------------------------------------

router.get("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.find()
    .populate("patient")
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
/**
 * Este para poner el filtro
 * filter=past|future|completed
 */
router.get(
  "/appointments",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    try {
      const { filter } = req.query; // 'past', 'future' o 'completed'
      const records = await Record.find().populate("patient");
      if (!records.length) {
        return res
          .status(404)
          .send({ ok: false, error: "No se encontraron registros" });
      }

      const now = new Date();
      const all = records.flatMap((r) => r.appointments);

      let resultado;
      switch (filter) {
        case "past":
          resultado = all.filter((appt) => new Date(appt.date) < now);
          break;
        case "future":
          resultado = all.filter((appt) => new Date(appt.date) > now);
          break;
        case "completed":
          resultado = all.filter((appt) => appt.status === "completed");
          break;
        default:
          resultado = all;
      }

      return res.status(200).send({ ok: true, resultado });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send({ ok: false, error: "Error interno del servidor" });
    }
  }
);

router.get("/appointmentAdmin", protegerRuta(["admin"]), async (req, res) => {
  Record.find()
    .populate("appointments")
    .then((result) => {
      let appointments = result.flatMap((record) => record.appointments);
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

/**
 * Coger appointments por id de aPpointment
 */
//buscar appointment por id de appointment
router.get(
  "/appointments/:id",
  protegerRuta(["admin", "physio", "patient"]),
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
// router.get(
//   "/appointments/patients/:id",
//   protegerRuta(["admin", "physio", "patient"]),
//   async (req, res) => {
//     Patient.findById(req.params.id).then((patient) => {
//       if (!patient) {
//         return res.status(404).send({
//           ok: false,
//           error: "No existe paciente con id " + req.params.id,
//         });
//       }
//       Record.find({ patient: patient._id })
//         .then((result) => {
//           let appointments = result.map((record) => record.appointments);
//           appointments = appointments.flatMap((record) => record);

//           res.status(200).send({ ok: true, resultado: appointments });
//         })
//         .catch((err) => {
//           if (res.length === 0) {
//             res.status(404).send({ ok: false, error: "Record not found" });
//           } else {
//             res.status(500).send({ ok: false, error: "Internal server error" });
//           }
//         });
//     });
//   }
// );
router.get(
  "/appointments/patients/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { filter } = req.query; // lee ?filter=pasado o ?filter=futuro
    const ahora = new Date();
    console.log("Filter:", filter);
    console.log("Ahora:", ahora);
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) {
        return res.status(404).send({
          ok: false,
          error: "No existe paciente con id " + req.params.id,
        });
      }

      const records = await Record.find({ patient: patient._id });
      let appointments = records.flatMap((r) => r.appointments);

      // Filtrado según filter=pasado|futuro
      if (filter === "past") {
        appointments = appointments.filter((a) => new Date(a.date) < ahora);
      } else if (filter === "future") {
        appointments = appointments.filter((a) => new Date(a.date) > ahora);
      }
      console.log("Appointments después del filtro:", appointments);
      // si filter no es ni "pasado" ni "futuro", devolvemos todas
      appointments = appointments.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      return res.status(200).send({ ok: true, resultado: appointments });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send({ ok: false, error: "Internal server error" });
    }
  }
);
//Buscar Appointment por id del fisio
// router.get(
//   "/appointments/physio/:id",
//   protegerRuta(["admin", "physio"]),
//   async (req, res) => {
//     Physio.findById(req.params.id).then((physio) => {
//       if (!physio) {
//         return res.status(404).send({
//           ok: false,
//           error: "No existe physio con id " + req.params.id,
//         });
//       }

//       Record.find({})
//         .then((result) => {
//           let appointments = result.flatMap((record) => record.appointments);
//           let physios = appointments.filter(
//             (r) => r.physio.toString() === physio.id.toString()
//           );
//           res.status(200).send({ ok: true, resultado: physios });
//         })
//         .catch((err) => {
//           if (res.length === 0) {
//             res.status(404).send({ ok: false, error: "Record not found" });
//           } else {
//             res.status(500).send({ ok: false, error: "Internal server error" });
//           }
//         });
//     });
//   }
// );
router.get(
  "/appointments/physio/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    const { filter } = req.query; // lee ?filter=pasado o ?filter=futuro
    const ahora = new Date();

    try {
      const physio = await Physio.findById(req.params.id);
      if (!physio) {
        return res.status(404).send({
          ok: false,
          error: "No existe physio con id " + req.params.id,
        });
      }

      const records = await Record.find({});
      // 1) Aplanamos todas las citas
      let appointments = records.flatMap((record) => record.appointments);
      // 2) Filtramos solo las del physio en cuestión
      appointments = appointments.filter(
        (a) => a.physio.toString() === physio._id.toString()
      );

      // 3) Filtrado según filter=pasado|futuro
      if (filter === "past") {
        appointments = appointments.filter((a) => new Date(a.date) < ahora);
      } else if (filter === "future") {
        appointments = appointments.filter((a) => new Date(a.date) > ahora);
      }
      // si filter no es ni "pasado" ni "futuro", devolvemos todas las de este physio
      //ordernar por fecha de mayor a menor
      appointments = appointments.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return res.status(200).send({ ok: true, resultado: appointments });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .send({ ok: false, error: "Internal server error" });
    }
  }
);

//Coger record por id del opatient
router.get(
  "/patient/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    let { id } = req.params.id;

    Record.findOne({ patient: req.params.id })
      .populate("appointments")
      .populate("patient")
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
//Coger record por id del record with populate del patient
router.get(
  "/patientWithoutPopolute/:id",
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

//coger appointements por id del record
router.get(
  "/patients/appointments/:id",
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

//añadir appointment a un record
router.post(
  "/appointments/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { date, physio, diagnosis, treatment, observations, status } =
      req.body;
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).send({
        ok: false,
        error: "No existe record con id " + req.params.id,
      });
    }

    const newAppointment = {
      date,
      physio,
      diagnosis,
      treatment,
      observations,
      status,
      patient: record.patient,
    };

    Record.findByIdAndUpdate(req.params.id, {
      $push: { appointments: newAppointment },
    })
      .then(async (result) => {
        const physio = await Physio.findById(newAppointment.physio);
        const userPhysio = await User.findById(physio.userID);
        const patient = await Patient.findById(newAppointment.patient);
        const userPatient = await User.findById(patient.userID);
        // Enviar notificación al fisio
        if (userPhysio.firebaseToken) {
          await firebaseService.sendNotification(
            userPhysio.firebaseToken,
            "Nueva cita",
            `Tienes una nueva cita el ${newAppointment.date.toLocaleString()}`,
            {}
          );
        }

        // Enviar notificación al paciente
        if (userPatient.firebaseToken) {
          await sendNotification(
            userPatient.firebaseToken,
            "Nueva cita",
            `Tu cita con el fisio ${
              physio.name
            } ha sido programada para el ${newAppointment.date.toLocaleString()}`,
            {}
          );
        }

        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        res
          .status(500)
          .send({ ok: false, error: "Internal server error", err: err });
      });
  }
);
//editar appointment a por id de appointment
router.put(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    const {
      date,
      physio,
      diagnosis,
      treatment,
      observations,
      status,
      patient,
    } = req.body;
    const newAppointment = {
      date,
      physio,
      diagnosis,
      treatment,
      observations,
      status,
      patient,
    };
    Record.updateMany(
      { "appointments._id": req.params.id },
      { $set: { "appointments.$": newAppointment } }
    )
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        res.status(500).send({ ok: false, error: "Internal server error" });
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
      .populate("patient")
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

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

//borrar appointment por id de appointment
router.delete(
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
        Record.updateMany(
          {},
          { $pull: { appointments: { _id: appointment._id } } },
          { multi: true }
        )
          .then((result) => {
            res.status(200).send({ ok: true, resultado: result });
          })
          .catch((err) => {
            if (res.length === 0) {
              res.status(404).send({ ok: false, error: "Record not found" });
            } else {
              res.status(500).send({
                ok: false,
                error: "Internal server error",
              });
            }
          });
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

module.exports = router;
