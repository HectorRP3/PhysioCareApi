const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const Physio = require(__dirname + "/../models/physio");
// ------------------------------------------------------------
// physioRoutes.js
// ------------------------------------------------------------
// Rutas relacionadas con el modelo Physio.
// Cada ruta está protegida por el middleware "protegerRuta" que
// restringe el acceso según los roles indicados.
//
// ▸ GET    /               — Lista de fisioterapeutas.
// ▸ GET    /find           — Búsqueda filtrada por especialidad.
// ▸ GET    /user/:id       — Obtiene el _id del fisio a partir
//                             del id de usuario (para la app móvil).
// ▸ GET    /:id            — Obtiene un fisio por su _id.
// ▸ POST   /               — Crea un nuevo fisio.
// ▸ PUT    /:id            — Modifica un fisio existente.
// ▸ DELETE /:id            — Elimina un fisio.
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET / — Listado completo de fisioterapeutas
// Roles permitidos: admin, physio, patient
// ------------------------------------------------------------
router.get(
  "/",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    Physio.find()
      .then((result) => {
        res.status(200).send({ ok: true, resultado: result });
      })
      .catch((err) => {
        // ⚠️ res.length siempre será undefined: esta condición nunca será cierta
        if (res.length === 0) {
          res.status(404).send({ ok: false, error: "Physio not found" });
        } else {
          res.status(500).send({ ok: false, error: "Internal server error" });
        }
      });
  }
);

// ------------------------------------------------------------
// GET /find — Búsqueda filtrada por especialidad
// Querystring: ?specialty=Traumatología
// Roles permitidos: admin, physio, patient
// ------------------------------------------------------------
router.get(
  "/find",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    let result;
    const { specialty } = req.query; // especialidad a buscar (opcional)
    try {
      if (specialty) {
        result = await Physio.find({
          specialty: {
            $regex: specialty, // coincidencia parcial (añade $options: "i" para insensible a mayúsc‑minúsculas)
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

///////////////////////////////////////////////////////////////////////////////////////////
//  Rutas para la app móvil
///////////////////////////////////////////////////////////////////////////////////////////

// ------------------------------------------------------------
// GET /user/:id — Devuelve el _id del fisio a partir del id de usuario
// Sin protección de roles: la app móvil valida por su cuenta
// ------------------------------------------------------------
router.get("/user/:id", async (req, res) => {
  // ⚠️ Desestructuración incorrecta (id está en req.params, no en req.params.id)
  let { id } = req.params.id;

  Physio.findOne({ userID: id }).then((result) => {
    if (!result) {
      res.status(404).send({
        ok: false,
        error: "No existe fisio con id " + req.params.id,
      });
    } else {
      res.status(200).send({ ok: true, resultado: result._id });
    }
  });
});

///////////////////////////////////////////////////////////////////////////////////////////
//  Operaciones CRUD por _id
///////////////////////////////////////////////////////////////////////////////////////////

// ------------------------------------------------------------
// GET /:id — Devuelve un fisioterapeuta concreto
// Roles permitidos: admin, physio, patient
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// POST / — Crea un nuevo fisioterapeuta
// Rol requerido: admin
// ------------------------------------------------------------
router.post("/", protegerRuta(["admin"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email } = req.body;
  const newPhysio = new Physio({
    name,
    surname,
    specialty,
    licenseNumber,
    email,
  });
  console.log("newPhysio", newPhysio); // ◄ DEBUG
  newPhysio
    .save()
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res
          .status(400)
          .send({ ok: false, error: "El número de licencia ya existe" });
      } else if (err.name === "ValidationError") {
        res.status(400).send({ ok: false, error: err.message });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// PUT /:id — Actualiza un fisioterapeuta existente
// Rol requerido: admin
// ------------------------------------------------------------
router.put("/:id", protegerRuta(["admin"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email } = req.body;
  Physio.findByIdAndUpdate(
    req.params.id,
    { name, surname, specialty, licenseNumber, email },
    { new: true }
  )
    .then((result) => {
      res.status(200).send({ ok: true, resultado: result });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res
          .status(400)
          .send({ ok: false, error: "El número de licencia ya existe" });
      } else if (err.name === "ValidationError") {
        res.status(400).send({ ok: false, error: err.message });
      } else {
        res.status(500).send({ ok: false, error: "Internal server error" });
      }
    });
});

// ------------------------------------------------------------
// DELETE /:id — Elimina un fisioterapeuta
// Rol requerido: admin
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Exportamos el router
// ------------------------------------------------------------
module.exports = router;
