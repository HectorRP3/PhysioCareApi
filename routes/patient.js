const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const Patient = require(__dirname + "/../models/patient");
const User = require(__dirname + "/../models/users");
const Auth = require(__dirname + "/../auth/auth");

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
// Middleware de autorización por roles
//   protegerRuta(["admin", "physio", ...])
const protegerRuta = require("../middlewares/protegerRuta");

// ------------------------------------------------------------
// GET / — Devuelve la lista completa de pacientes
// Roles permitidos: admin, physio
// ------------------------------------------------------------
router.get("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  Patient.find()
    .then((result) => {
      console.log("entrando"); // ◄ DEBUG: confirmar que la ruta se ejecuta
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      // ⚠️ OJO: aquí se usa res.length, que es undefined → siempre irá al else
      if (res.length === 0) {
        res.status(404).send({ ok: false, error: "Patient not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// GET /find — Busca pacientes por apellido (querystring)
// Ejemplo: GET /find?surname=Pérez
// Roles permitidos: admin, physio
// ------------------------------------------------------------
router.get("/find", protegerRuta(["admin", "physio"]), async (req, res) => {
  let result;
  const { surname } = req.query; // apellido a buscar (opcional)

  try {
    if (surname) {
      // Búsqueda con expresión regular para soportar coincidencias parciales / mayúsc‑minúsculas
      result = await Patient.find({
        surname: { $regex: surname, $options: "i" },
      });
    } else {
      // Si no se proporciona apellido, devuelve todos los pacientes
      result = await Patient.find();
    }
    res.status(200).send({ ok: true, resultado: result });
  } catch (err) {
    // Misma advertencia que antes sobre res.length
    if (res.length === 0) {
      res.status(404).send({ ok: false, error: "Patient not found" });
    } else {
      res.status(500).send({ ok: false, error: "Internal server error" });
    }
  }
});

// ------------------------------------------------------------
// GET /user/:id — Devuelve el _id del paciente a partir del id de usuario
// ⚠️ Pensado para la app móvil: se ignora la protección por roles
// ------------------------------------------------------------
router.get(
  "/user/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { id } = req.params; // id de usuario (no confundir con _id del paciente)

    // Buscamos el paciente cuyo campo userID coincide con el id recibido
    const patient = await Patient.findOne({ userID: id });

    if (patient) {
      return res.status(200).send({ ok: true, resultado: patient._id });
    }

    // Si llegamos aquí, el paciente no existe o no coincide con el usuario actual
    return res.status(403).send({
      ok: false,
      error: "Only the patient can see his/her own data",
    });
  }
);

// ------------------------------------------------------------
// GET /:id — Devuelve la ficha de un paciente concreto
// Roles permitidos: admin, physio, patient
// El paciente solo puede verse a sí mismo (autocontrol)
// ------------------------------------------------------------
router.get(
  "/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { id } = req.params; // _id del paciente solicitado
    const userLogin = req.user.login; // login del usuario autenticado
    const userRole = req.user.rol; // rol del usuario autenticado

    // ---------- Regla de negocio ----------
    // • admin y physio pueden acceder a cualquier paciente
    // • patient solo puede acceder a su propia ficha
    // --------------------------------------
    if (userRole === "patient") {
      // Obtenemos el _id del paciente asociado al usuario login
      const patientSelf = await Patient.findOne({ name: userLogin });
      const selfId = patientSelf?._id?.toString();

      if (id !== selfId) {
        return res.status(403).send({
          ok: false,
          error: "Only the patient can see his/her own data",
        });
      }
    }

    // Llegados aquí, el acceso está permitido
    Patient.findById(id)
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        if (err.kind === "ObjectId") {
          // Id mal formado o no existe
          res.status(404).send({ ok: false, error: "Patient not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

// ------------------------------------------------------------
// POST / — Crea un nuevo paciente
// Roles permitidos: admin, physio
// ------------------------------------------------------------
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
      // Validación de errores comunes
      if (err.code === 11000) {
        // Clave «insuranceNumber» duplicada (índice único)
        res
          .status(409)
          .send({ ok: false, error: "El número de seguro ya existe" });
      } else if (err.errors) {
        // Violación de validaciones de esquema (ej. email inválido)
        const firstError = err.errors[Object.keys(err.errors)[0]].message;
        res.status(400).send({ ok: false, error: firstError });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// PUT /:id — Actualiza los datos de un paciente
// Roles permitidos: admin, physio
// ------------------------------------------------------------
router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { name, surname, birthDate, address, insuranceNumber } = req.body;

  Patient.findByIdAndUpdate(
    req.params.id,
    { name, surname, birthDate, address, insuranceNumber },
    { new: true } // Devuelve el documento actualizado
  )
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res
          .status(409)
          .send({ ok: false, error: "El número de seguro ya existe" });
      } else if (err.errors) {
        const firstError = err.errors[Object.keys(err.errors)[0]].message;
        res.status(400).send({ ok: false, error: firstError });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// DELETE /:id — Elimina un paciente existente
// Roles permitidos: admin, physio
// ------------------------------------------------------------
router.delete("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  Patient.findByIdAndDelete(req.params.id)
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        res.status(404).send({ ok: false, error: "Patient not found" });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// Exportamos el router para montarlo en la aplicación principal
// ------------------------------------------------------------
module.exports = router;
