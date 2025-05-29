const express = require("express");
let router = express.Router();
const bycrypt = require("bcryptjs");
const Patient = require("../models/patient");
const Physio = require("../models/physio");
const User = require(__dirname + "/../models/users");
const Auth = require(__dirname + "/../auth/auth");
// Ruta para manejar el inicio de sesión
router.post("/login", async (req, res) => {
  const { login, firebaseToken } = req.body;

  User.findOne({ login: login })
    .then(async (usuario) => {
      console.log(usuario);
      const validPassword = await bycrypt.compare(
        req.body.password,
        usuario.password
      );
      console.log(usuario.rol);
      let idActual;
      if (!validPassword) {
        res.status(401).send({ ok: false, resultado: "Passwrord" });
      }
      if (usuario.rol == "patient") {
        const validUser = await Patient.findOne({ userID: usuario._id });
        console.log(validUser);
        if (!validUser) {
          res
            .status(401)
            .send({ ok: false, resultado: "Usuario no encontrado" });
        }
        idActual = validUser.id;
      }
      if (usuario.rol == "physio") {
        const validUser = await Physio.findOne({ userID: usuario._id });
        console.log(validUser);
        if (!validUser) {
          res
            .status(401)
            .send({ ok: false, resultado: "Usuario no encontrado" });
        }
        idActual = validUser.id;
      }
      const userActual = await User.findOneAndUpdate(
        { _id: usuario._id },
        { firebaseToken: firebaseToken },
        { new: true }
      );
      console.log("idActual", userActual);
      res.status(200).send({
        ok: true,
        token: Auth.generarToken(usuario.login, usuario.rol, idActual),
        rol: usuario.rol,
        id: idActual,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(401).send({ ok: false, resultado: "Login incorrecto" });
    });
});

//routa validacion token
router.get("/validarToken", async (req, res) => {
  const token = req.headers["authorization"];
  console.log(token);
  if (!token) {
    return res.status(401).send({ ok: false, resultado: "Token no valido" });
  }
  const tokenSinBearer = token.split(" ")[1];
  const decoded = Auth.validarToken(tokenSinBearer);
  if (!decoded) {
    return res.status(401).send({ ok: false, resultado: "Token no valido" });
  }
  res.status(200).send({ ok: true, resultado: decoded });
});

module.exports = router;
