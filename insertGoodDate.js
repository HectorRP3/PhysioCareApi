const Patient = require("./models/patient");
const Physio = require("./models/physio");
const User = require("./models/users");
const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");
async function loadData() {
  try {
    // Clean existing collections
    // await Patient.deleteMany({});
    // await Physio.deleteMany({});
    // await Record.deleteMany({});
    // await User.deleteMany({});

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
