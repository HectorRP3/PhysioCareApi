const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("./models/users");

// Cargar variables de entorno (como DB_URL)
dotenv.config();

async function insertSingleUser() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Conectado a MongoDB");
    // Eliminar todos los usuarios existentes
    
    const newUser = new User({
        login: "Olex",
        password: "1234",
        rol: "admin",
    });

    const saved = await newUser.save();
    console.log("✅ Usuario insertado:", saved);

    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error insertando usuario:", error);
    mongoose.disconnect();
  }
}

insertSingleUser();