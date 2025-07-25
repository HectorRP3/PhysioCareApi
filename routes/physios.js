const express = require("express");
const { protegerRuta, validarToken } = require("../auth/auth");
let router = express.Router();
const User = require(__dirname + "/../models/users");
const bycrypt = require("bcryptjs");
const Record = require(__dirname + "/../models/record");

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
        const regex = new RegExp(filter, "i");
        physio = await Physio.find({
          $or: [{ name: { $regex: regex } }, { surname: { $regex: regex } }],
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
  Physio.findOne({ _id: userId })
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
  const {
    name,
    surname,
    specialty,
    licenseNumber,
    email,
    avatar,
    password,
    starts,
  } = req.body;
  let newUser;
  if (!password) {
    newUser = new User({
      login: name,
      password: await bycrypt.hash("1234", 10), // Hash the password
      rol: "physio",
    });
  } else {
    newUser = new User({
      login: name,
      password: await bycrypt.hash(password, 10), // Hash the password
      rol: "physio",
    });
  }
  let imageUrl = "";
  if (avatar) {
    imageUrl = await saveImage("physios", avatar);
  }

  newUser.save().then((result) => {
    console.log("Usuario creado:", result);
  });
  const newPhysio = new Physio({
    name,
    surname,
    specialty,
    licenseNumber,
    email,
    avatar: imageUrl,
    userID: newUser._id,
    starts: starts || 1, // Default to 1 star if not provided
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

router.put(
  "/:id",
  protegerRuta(["admin", "physio", "patient"]),
  async (req, res) => {
    const { name, surname, specialty, licenseNumber, email, avatar, starts } =
      req.body;
    let imageUrl = "";
    // checkear que es una imagen
    if (avatar && !avatar.startsWith("https://")) {
      imageUrl = await saveImage("physios", avatar);
    } else {
      imageUrl = avatar; // Use the existing URL if it's already a valid URL
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
        starts: starts || 1, // Default to 1 star if not provided
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
  }
);

router.delete("/:id", protegerRuta(["admin"]), async (req, res) => {
  // Record.find().then((records) => {
  //   let appointements = records.appointements.flatMaop((record) => {
  //     return record.appointments;
  //   });
  //   let physioAppointments = appointements.filter(
  //     (appointment) => appointment.physio.toString() === req.params.id
  //   );

  // });
  const result = await Record.updateMany(
    { "appointments.physio": req.params.id },
    { $pull: { appointments: { physio: req.params.id } } }
  );
  console.log(result);
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
