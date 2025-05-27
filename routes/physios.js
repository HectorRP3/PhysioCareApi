const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();

const {
  saveImage,
  downloadImage,
  removeImage,
} = require("../utils/imageService");
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
// ▸ GET    /me             — Obtiene el fisio logueado (para la app móvil).
// ▸ GET    /user/:id       — Obtiene el _id del fisio a partir
//                             del id de usuario (para la app móvil).
// ▸ GET    /:id            — Obtiene un fisio por su _id.
// ▸ POST   /               — Crea un nuevo fisio.
// ▸ PUT    /:id            — Modifica un fisio existente.
// ▸ DELETE /:id            — Elimina un fisio.
// ------------------------------------------------------------
router.get(
  "/",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    let result;
    const { filter } = req.query;
    try {
      let physio;
      if (filter) {
        physio = await Physio.find({
          $or: [{ name: filter }, { surname: filter }],
        });
      } else {
        physio = await Physio.find();
      }
      res.status(200).send({ ok: true, resultado: physio });
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

router.get("/me", protegerRuta(["physio"]), async (req, res) => {
  // Obtener el token del header de la petición
  const token = req.headers["authorization"].split(" ")[1];
  // Decodificar el token para obtener el id del usuario
  const decodedToken = validarToken(token);
  // Obtener el id del usuario
  const userId = decodedToken.id;
  // Buscar el fisio por el id del usuario
  Physio.findOne({ userID: userId })
    .then((result) => {
      if (!result) {
        res.status(404).send({
          ok: false,
          error: "No existe fisio con id " + req.params.id,
        });
      } else {
        res.status(200).send({ ok: true, resultado: result });
      }
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: "Internal server error" });
    });
});
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

// Moviles
//coger el fisio a partir del id de usuario
// This route is used to get the physio ID from the user Id Moviles ruta
router.get("/user/:id", async (req, res) => {
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
///////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////

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
          res
            .status(500)
            .send({ ok: false, error: "Internal server error", fdsa: err });
        }
      });
  }
);

router.post("/", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email, avatar } = req.body;

  let imageUrl = "";
  if (avatar) {
    imageUrl = await saveImage("physios", avatar);
  }
  const newPhysio = new Physio({
    name,
    surname,
    specialty,
    licenseNumber,
    email,
    avatar: imageUrl,
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

router.put("/:id", protegerRuta(["admin", "physio"]), async (req, res) => {
  const { name, surname, specialty, licenseNumber, email, avatar } = req.body;
  let imageUrl = "";
  if (avatar) {
    imageUrl = await saveImage("physios", avatar);
  }
  Physio.findByIdAndUpdate(
    req.params.id,
    {
      name,
      surname,
      specialty,
      licenseNumber,
      email,
      avatar: imageUrl,
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
