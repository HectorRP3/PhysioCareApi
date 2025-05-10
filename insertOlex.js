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

 const res = await User.deleteOne({ login: 'Olex' });

    const hashedPassword = await bcrypt.hash("1234", 10);

    const newUser = new User({
        login: "Olex",
        password: hashedPassword,
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



