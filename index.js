const mongoose = require("mongoose");
const Patient = require("./models/patient");
const Physio = require("./models/physio");
const Record = require("./models/record");
const User = require("./models/users");
const express = require("express");
const dotenv = require("dotenv");
const Patient2 = require("./routes/patient");
const Physio2 = require("./routes/physios");
const Record2 = require("./routes/records");
const Auth = require("./routes/auth");
const bycrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");
let app = express();

// var admin = require("firebase-admin");

// var serviceAccount = require("/firebase/firebase/ionic-physiocare-firebase-adminsdk-fbsvc-b9ad036b02.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "X-XSRF-TOKEN",
      "Authorization",
      "x-xsrf-token",
    ],
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.send(`
    <h1>Mi Physio</h1>
  `);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/patients", Patient2);
app.use("/physios", Physio2);
app.use("/records", Record2);
app.use("/auth", Auth);
dotenv.config();
app.listen(process.env.PORT);

// Function to load initial data
async function loadData() {
  try {
    // Clean existing collections
    await Patient.deleteMany({});
    await Physio.deleteMany({});
    await Record.deleteMany({});
    await User.deleteMany({});

    const users = [
      new User({
        login: "hector2",
        password: "1234",
        rol: "admin",
      }),
      new User({
        login: "hector3",
        password: "1234",
        rol: "physio",
      }),
      new User({
        login: "hector4",
        password: "1234",
        rol: "patient",
      }),
    ];
    for (let i = 0; i < users.length; i++) {
      const hashedPassword = await bycrypt.hash(users[i].password, 10);
      users[i].password = hashedPassword;
    }

    const savedUsers = await Promise.all(users.map((user) => user.save()));
    console.log("Added users:", savedUsers);
    // Create some patients
    const patients = [
      new Patient({
        name: "hector4",
        surname: "López",
        birthDate: new Date("1985-06-15"),
        address: "Calle Mayor 123, Alicante",
        insuranceNumber: "123456789",
        email: "hectorrodriguezplanelles@gmail.com",
        userID: savedUsers[2]._id,
      }),
      new Patient({
        name: "Ana",
        surname: "Pérez",
        birthDate: new Date("1990-09-22"),
        address: "Avenida del Sol 45, Valencia",
        insuranceNumber: "987654321",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Patient({
        name: "Luis",
        surname: "Martínez",
        birthDate: new Date("1975-03-11"),
        address: "Calle de la Luna 89, Alicante",
        insuranceNumber: "456789123",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Patient({
        name: "María",
        surname: "Sanz",
        birthDate: new Date("1992-05-30"),
        address: "Plaza Mayor 22, Valencia",
        insuranceNumber: "321654987",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
    ];

    // Save all patients using Promise.all
    const savedPatients = await Promise.all(
      patients.map((patient) => patient.save())
    );
    console.log("Added patients:", savedPatients);

    // Create several physios, at least one for each specialty
    const physios = [
      new Physio({
        name: "hector3",
        surname: "Martínez",
        specialty: "Sports",
        licenseNumber: "A1234567",
        email: "hectorrodriguezplanelles@gmail.com",
        userID: savedUsers[1]._id,
      }),
      new Physio({
        name: "Ainhoa",
        surname: "Fernández",
        specialty: "Neurological",
        licenseNumber: "B7654321",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Physio({
        name: "Mario",
        surname: "Sánchez",
        specialty: "Pediatric",
        licenseNumber: "C9876543",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Physio({
        name: "Andrea",
        surname: "Ortega",
        specialty: "Pediatric",
        licenseNumber: "D8796342",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Physio({
        name: "Ana",
        surname: "Rodríguez",
        specialty: "Geriatric",
        licenseNumber: "E6543210",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Physio({
        name: "Marcos",
        surname: "Gómez",
        specialty: "Oncological",
        licenseNumber: "F4321098",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
    ];

    // Save all physios using Promise.all
    const savedPhysios = await Promise.all(
      physios.map((physio) => physio.save())
    );
    console.log("Added physios:", savedPhysios);

    // Create records with appointments
    const records = [
      new Record({
        patient: savedPatients[0]._id,
        medicalRecord:
          "Paciente con antecedentes de lesiones en rodilla y cadera.",
        appointments: [
          {
            date: new Date("2024-02-10"),
            physio: savedPhysios[0]._id, // Sports specialty physio
            diagnosis: "Distensión de ligamentos de la rodilla",
            treatment: "Rehabilitación con ejercicios de fortalecimiento",
            observations:
              "Se recomienda evitar actividad intensa por 6 semanas",
          },
          {
            date: new Date("2024-03-01"),
            physio: savedPhysios[0]._id,
            diagnosis: "Mejoría notable, sin dolor agudo",
            treatment: "Continuar con ejercicios, añadir movilidad funcional",
            observations: "Próxima revisión en un mes",
          },
        ],
      }),
      new Record({
        patient: savedPatients[1]._id,
        medicalRecord: "Paciente con problemas neuromusculares.",
        appointments: [
          {
            date: new Date("2024-02-15"),
            physio: savedPhysios[1]._id, // Neurological specialty physio
            diagnosis: "Debilidad muscular en miembros inferiores",
            treatment: "Terapia neuromuscular y estiramientos",
            observations: "Revisar la evolución en 3 semanas",
          },
        ],
      }),
      new Record({
        patient: savedPatients[2]._id,
        medicalRecord: "Lesión de hombro recurrente, movilidad limitada.",
        appointments: [
          {
            date: new Date("2024-01-25"),
            physio: savedPhysios[2]._id, // Pediatric specialty physio
            diagnosis: "Tendinitis en el manguito rotador",
            treatment: "Ejercicios de movilidad y fortalecimiento",
            observations: "Revisar en 4 semanas",
          },
        ],
      }),
      new Record({
        patient: savedPatients[3]._id,
        medicalRecord: "Paciente con problemas oncológicos.",
        appointments: [
          {
            date: new Date("2024-01-15"),
            physio: savedPhysios[4]._id, // Oncology specialty physio
            diagnosis: "Fatiga post-tratamiento oncológico",
            treatment: "Ejercicios suaves y terapia de relajación",
            observations: "Revisión en 2 semanas",
          },
        ],
      }),
    ];
    //save users {{"usuario":"hector2","password":"1234","rol":"admin"}}

    // Save all files using Promise.all
    const savedRecords = await Promise.all(
      records.map((record) => record.save())
    );
    console.log("Added records:", savedRecords);

    // mongoose.disconnect();
    console.log("Data successfully loaded and disconnected from MongoDB");
  } catch (error) {
    console.error("Error loading data:", error);
    mongoose.disconnect();
  }
}

// Connect to MongoDB database
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Successful connection to MongoDB");
    // loadData();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
