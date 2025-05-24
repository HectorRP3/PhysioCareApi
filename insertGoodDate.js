const Patient = require("./models/patient");
const Physio = require("./models/physio");
const User = require("./models/users");
const Record = require("./models/record");

const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");
async function loadData() {
  try {
    // Clean existing collections
    // await Patient.deleteMany({});
    // await Physio.deleteMany({});
    // await Record.deleteMany({});
    // await User.deleteMany({});
    await User.deleteMany({ login: "hectorPhysio" });
    await User.deleteMany({ login: "olexPhysio" });
    const users = [
      new User({
        login: "olexPhysio",
        password: "1234",
        rol: "physio",
      }),
      new User({
        login: "hectorPhysio",
        password: "1234",
        rol: "physio",
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
        name: "Pedro",
        surname: "López",
        birthDate: new Date("1985-06-15"),
        address: "Calle Mayor 123, Alicante",
        insuranceNumber: "123406789",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Patient({
        name: "Maria",
        surname: "Pérez",
        birthDate: new Date("1990-09-22"),
        address: "Avenida del Sol 45, Valencia",
        insuranceNumber: "980654321",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Patient({
        name: "Luis",
        surname: "Martínez",
        birthDate: new Date("1975-03-11"),
        address: "Calle de la Luna 89, Alicante",
        insuranceNumber: "456784123",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
      new Patient({
        name: "María",
        surname: "Sanz",
        birthDate: new Date("1992-05-30"),
        address: "Plaza Mayor 22, Valencia",
        insuranceNumber: "321657987",
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
        name: "Olex",
        surname: "Martínez",
        specialty: "Sports",
        licenseNumber: "A1236567",
        email: "hectorrodriguezplanelles@gmail.com",
        userID: savedUsers[0]._id,
      }),
      new Physio({
        name: "Hector",
        surname: "Fernández",
        specialty: "Neurological",
        licenseNumber: "B7658321",
        email: "hectorrodriguezplanelles@gmail.com",
        userID: savedUsers[1]._id,
      }),
      new Physio({
        name: "Mario",
        surname: "Sánchez",
        specialty: "Pediatric",
        licenseNumber: "C9836543",
        email: "hectorrodriguezplanelles@gmail.com",
      }),
    ];

    // Save all physios using Promise.all
    const savedPhysios = await Promise.all(
      physios.map((physio) => physio.save())
    );
    console.log("Added physios:", savedPhysios);

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
            physio: savedPhysios[2]._id, // Oncology specialty physio
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
  } catch (error) {
    console.error("Error loading data:", error);
    mongoose.disconnect();
  }
}
mongoose
  .connect("mongodb://localhost:27017/physiocarePsp")
  .then(() => {
    console.log("Successful connection to MongoDB");
    loadData();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
