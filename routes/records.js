const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const Record = require(__dirname + "/../models/record");
const Patient = require(__dirname + "/../models/patient");
const Physio = require(__dirname + "/../models/physio");
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
// ▸ GET    /moviles                       — Lista con populate de paciente (app móvil).
//
// ▸ GET    /appointments/:id              — Appointment por id de cita.
// ▸ GET    /appointments/patients/:id     — Appointments por id de paciente.
// ▸ GET    /appointments/physio/:id       — Appointments por id de fisio.
// ▸ POST   /appointments/:id              — Añade appointment a un record.
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
// ------------------------------------------------------------
// GET / — Lista completa de historiales
// ------------------------------------------------------------
router.get("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.find()
    .then((result) => res.status(200).send({ ok: true, resultado: result }))
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Record not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// GET /find — Filtra records por apellido del paciente
// ------------------------------------------------------------
router.get("/find", protegerRuta(["admin", "physio"]), async (req, res) => {
  let result;
  const { surname } = req.query;
  try {
    if (surname) {
      const patients = await Patient.find({ surname: { $regex: surname } });
      result = await Record.find({
        patient: { $in: patients.map((p) => p._id) },
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

// ------------------------------------------------------------
// POST / — Crea un nuevo historial
// ------------------------------------------------------------
router.post("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { patient, medicalRecord, appointments } = req.body;
  const newRecord = new Record({ patient, medicalRecord, appointments });
  newRecord
    .save()
    .then((result) => res.status(200).send({ ok: true, resultado: result }))
    .catch(() =>
      res.status(500).send({ ok: false, error: "Internal server error" })
    );
});

// ------------------------------------------------------------
// GET /moviles — Lista de historiales con patient populate (app móvil)
// ------------------------------------------------------------
router.get("/moviles", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.find()
    .populate("patient")
    .then((result) => res.status(200).send({ ok: true, resultado: result }))
    .catch((err) => {
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Record not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// GET /appointments/:id — Devuelve una cita por su _id
// ------------------------------------------------------------
router.get(
  "/appointments/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    Record.find()
      .then((records) => {
        const appointments = records.flatMap((r) => r.appointments);
        const appointment = appointments.find(
          (a) => a._id.toString() === req.params.id
        );
        if (!appointment) {
          return res.status(404).send({
            ok: false,
            error: "No existe appointment con id " + req.params.id,
          });
        }
        res.status(200).send({ ok: true, resultado: appointment });
      })
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// ------------------------------------------------------------
// GET /appointments/patients/:id — Citas de un paciente
// ------------------------------------------------------------
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
        .then((records) => {
          const appointments = records.flatMap((r) => r.appointments);
          res.status(200).send({ ok: true, resultado: appointments });
        })
        .catch(() =>
          res.status(500).send({ ok: false, error: "Internal server error" })
        );
    });
  }
);

// ------------------------------------------------------------
// GET /appointments/physio/:id — Citas atendidas por un fisio
// ------------------------------------------------------------
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
      Record.find()
        .then((records) => {
          const appointments = records.flatMap((r) => r.appointments);
          const physioAppointments = appointments.filter(
            (a) => a.physio.toString() === physio.id.toString()
          );
          res.status(200).send({ ok: true, resultado: physioAppointments });
        })
        .catch(() =>
          res.status(500).send({ ok: false, error: "Internal server error" })
        );
    });
  }
);

// ------------------------------------------------------------
// POST /appointments/:id — Añade nueva cita a un historial
// ------------------------------------------------------------
router.post(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    const { date, physio, diagnosis, treatment, observations } = req.body;
    const newAppointment = { date, physio, diagnosis, treatment, observations };
    Record.findByIdAndUpdate(
      req.params.id,
      { $push: { appointments: newAppointment } },
      { new: true }
    )
      .then((result) => res.status(200).send({ ok: true, resultado: result }))
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// ------------------------------------------------------------
// DELETE /appointments/:id — Elimina una cita por su _id
// ------------------------------------------------------------
router.delete(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.find()
      .then((records) => {
        const appointments = records.flatMap((r) => r.appointments);
        const appointment = appointments.find(
          (a) => a._id.toString() === req.params.id
        );
        if (!appointment) {
          return res.status(404).send({
            ok: false,
            error: "No existe appointment con id " + req.params.id,
          });
        }
        Record.updateMany(
          {},
          { $pull: { appointments: { _id: appointment._id } } }
        )
          .then((result) =>
            res.status(200).send({ ok: true, resultado: result })
          )
          .catch(() =>
            res.status(500).send({ ok: false, error: "Internal server error" })
          );
      })
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// ------------------------------------------------------------
// GET /patient/:id — Record con populate paciente (control acceso paciente)
// ------------------------------------------------------------
router.get(
  "/patient/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { id } = req.params; // _id del record solicitado
    const userLogin = req.user.login;
    const userRole = req.user.rol;

    if (userRole === "patient") {
      // El paciente solo puede leer su propio record
      const self = await Patient.findOne({ name: userLogin });
      if (id !== self?._id?.toString()) {
        return res.status(403).send({
          ok: false,
          error: "Only the patient can see his/her own data",
        });
      }
    }
    Record.findById(id)
      .populate("patient")
      .then((result) => res.status(200).send({ ok: true, resultado: result }))
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);
// -----------------------------------------------------------------------------
// GET /patients/appointments/:id
// -----------------------------------------------------------------------------
// • Objetivo   : Obtener todas las citas (appointments) asociadas a un historial
//               clínico (Record) concreto, identificado por su _id.
// • Roles      : admin, physio
// • Proceso    :
//     1. Busca el Record por _id.
//     2. Hace populate del array "appointments" para traer los subdocumentos
//        completos en lugar de solo los ObjectId.
//     3. Devuelve las citas encontradas o, si no existe el Record, error 404.
// -----------------------------------------------------------------------------
router.get(
  "/patients/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.findById(req.params.id)
      .populate("appointments") // ← rellena los ObjectId con los docs embebidos
      .then((result) => {
        console.log(result.appointments); // DEBUG
        res.status(200).send({ ok: true, resultado: result.appointments });
      })
      .catch(() => {
        // Nota: res.length siempre indefinido; enviamos 500 por defecto
        res.status(500).send({ ok: false, error: "Internal server error" });
      });
  }
);

// -----------------------------------------------------------------------------
// POST /appointments/:id
// -----------------------------------------------------------------------------
// • Objetivo   : Añadir una nueva cita al historial cuyo _id se pasa en la URL.
// • Roles      : admin, physio
// • Cuerpo     : { date, physio, diagnosis, treatment, observations }
// • Proceso    : Utiliza $push para insertar el subdocumento en el array
//               "appointments" y devuelve el Record actualizado.
// -----------------------------------------------------------------------------
router.post(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    const { date, physio, diagnosis, treatment, observations } = req.body;
    const newAppointment = { date, physio, diagnosis, treatment, observations };

    Record.findByIdAndUpdate(
      req.params.id,
      { $push: { appointments: newAppointment } },
      { new: true } // devuelve documento tras la actualización
    )
      .then((result) => res.status(200).send({ ok: true, resultado: result }))
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// -----------------------------------------------------------------------------
// GET /:id  (Record por _id, con control de acceso para pacientes)
// -----------------------------------------------------------------------------
// • Objetivo   : Obtener un historial concreto.
// • Roles      : admin, physio, patient (el paciente solo puede ver su propio Record)
// • Proceso    :
//      1. Si el rol es patient, se comprueba que el _id solicitado pertenece al
//         propio usuario; en caso contrario → 403.
//      2. Se busca el Record por _id y se devuelve.
// -----------------------------------------------------------------------------
router.get(
  "/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { id } = req.params; // _id del Record solicitado
    const { login: user, rol: userRole } = req.user;

    if (userRole === "patient") {
      // Paciente: validar que el Record es suyo
      const self = await Patient.findOne({ name: user });
      if (id !== self?._id?.toString()) {
        return res.status(403).send({
          ok: false,
          error: "Only the patient can see his/her own data",
        });
      }
    }

    Record.findById(id)
      .then((result) => res.status(200).send({ ok: true, resultado: result }))
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// -----------------------------------------------------------------------------
// GET /:id/appointments
// -----------------------------------------------------------------------------
// • Objetivo   : Obtener solo las citas de un historial, usando populate.
// • Roles      : admin, physio
// -----------------------------------------------------------------------------
router.get(
  "/:id/appointments",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.findById(req.params.id)
      .populate("appointments")
      .then((result) =>
        res.status(200).send({ ok: true, resultado: result.appointments })
      )
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// -----------------------------------------------------------------------------
// PUT /:id — Actualiza campos básicos de un historial
// -----------------------------------------------------------------------------
router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { date, patient, physio, treatment } = req.body;
  Record.findByIdAndUpdate(
    req.params.id,
    { date, patient, physio, treatment },
    { new: true }
  )
    .then((result) => res.status(200).send({ ok: true, resultado: result }))
    .catch(() =>
      res.status(500).send({ ok: false, error: "Internal server error" })
    );
});

// -----------------------------------------------------------------------------
// DELETE /:id — Elimina un historial completo
// -----------------------------------------------------------------------------
router.delete("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  Record.findByIdAndDelete(req.params.id)
    .then((result) => res.status(200).send({ ok: true, resultado: result }))
    .catch(() =>
      res.status(500).send({ ok: false, error: "Internal server error" })
    );
});

// -----------------------------------------------------------------------------
// DELETE /appointments/:id — Elimina una cita embebida en cualquier Record
// -----------------------------------------------------------------------------
// • Proceso    :
//     1. Busca la cita por _id recorriendo todos los Records.
//     2. Si no existe → 404.
//     3. Aplica $pull a todos los historiales para eliminarla.
// -----------------------------------------------------------------------------
router.delete(
  "/appointments/:id",
  protegerRuta(["admin", "physio"]),
  async (req, res) => {
    Record.find()
      .then((records) => {
        const appointment = records
          .flatMap((r) => r.appointments)
          .find((a) => a._id.toString() === req.params.id);
        if (!appointment) {
          return res.status(404).send({
            ok: false,
            error: `No existe appointment con id ${req.params.id}`,
          });
        }
        Record.updateMany(
          {},
          { $pull: { appointments: { _id: appointment._id } } }
        )
          .then((result) =>
            res.status(200).send({ ok: true, resultado: result })
          )
          .catch(() =>
            res.status(500).send({ ok: false, error: "Internal server error" })
          );
      })
      .catch(() =>
        res.status(500).send({ ok: false, error: "Internal server error" })
      );
  }
);

// ------------------------------------------------------------
// Fin de la sección comentada
// ------------------------------------------------------------

module.exports = router;
