const express = require("express");
let router = express.Router();
const bycrypt = require("bcryptjs");
const Patient = require("../models/patient");
const User = require(__dirname + "/../models/users");
const Auth = require(__dirname + "/../auth/auth");
// Ruta para manejar el inicio de sesión
router.post("/login", async (req, res) => {
  const { login } = req.body;

  User.findOne({ login: login })
    .then(async (usuario) => {
      //   const { login, password, rol } = usuario;
      const validPassword = await bycrypt.compare(
        req.body.password,
        usuario.password
      );
      if (!validPassword) {
        res.status(401).send({ ok: false, resultado: "Passwrord" });
      }
      if (usuario.rol == "Patient") {
        const validUser = await Patient.findOne({ userID: usuario._id });
        console.log(validUser);
        if (!validUser) {
          res
            .status(401)
            .send({ ok: false, resultado: "Usuario no encontrado" });
        }
      }
      if (usuario.rol == "Physio") {
        const validUser = await Physio.findOne({ userID: usuario._id });
        console.log(validUser);
        if (!validUser) {
          res
            .status(401)
            .send({ ok: false, resultado: "Usuario no encontrado" });
        }
      }
      res.status(200).send({
        ok: true,
        token: Auth.generarToken(usuario.login, usuario.rol),
        rol: usuario.rol,
        id: usuario._id,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(401).send({ ok: false, resultado: "Login incorrecto" });
    });
});

module.exports = router;
