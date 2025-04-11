const axios = require("axios");
const { set } = require("mongoose");
const user = {
  login: "hector2",
  password: "1234",
  rol: "admin",
};
const user2 = {
  login: "hector4",
  password: "1234",
  rol: "patient",
};
const user3 = {
  login: "Mario",
  password: "1234",
  rol: "physio",
};
const idPatient = "67c4921149e3e8b5c2de2b8d";
const idPatientDelete = "67c4931049e3e8b5c2de2baa";
const apellido = "Sanz";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/",
  headers: {
    "Content-Type": "application/json",
  },
});

//Test 1 - Get all patients
const obtenerPatients = async (token) => {
  try {
    setToken(token);
    const res = await axiosInstance.get("patients");
    if (res.status === 200) {
      console.log("Test 1 - Passed Get - Obtener Pacientes");
    } else {
      console.error("Test 1 - Failed");
    }
  } catch (error) {
    console.error("Test 1 - Failed");
  }
};
//Test 2 - Get patient by id
const obtenerPatientsById = async (token) => {
  try {
    setToken(token);
    const res = await axiosInstance.get(`patients/${idPatient}`);
    if (res.status === 200) {
      console.log("Test 2 - Passed Get - Obtener Paciente por id");
    } else {
      console.error("Test 2 - Failed");
    }
  } catch (error) {
    console.error("Test 2 - Failed");
  }
};
//Test 3 - Get patient by find
const obtenerPatientsByFind = async (token) => {
  try {
    setToken(token);
    const res = await axiosInstance.get(`patients/find?surname=${apellido}`);
    if (res.status === 200) {
      console.log("Test 3 - Passed Get - Obtener Paciente por apellido");
    } else {
      console.error("Test 3 - Failed");
    }
  } catch (error) {
    console.error("Test 3 - Failed");
  }
};

//Test 4 - Post patient
const crearPatient = async (token) => {
  const insuranceNumber = Math.floor(Math.random() * 1000000000);
  setToken(token);
  try {
    const newPatient = {
      name: "adsfa2",
      surname: "fdas2",
      birthDate: "1990-09-22",
      address: "Avenida del Sol 45, Valencia",
      insuranceNumber: insuranceNumber,
    };
    const res = await axiosInstance.post("patients", newPatient);
    if (res.status === 200) {
      console.log("Test 4 - Passed Post - Crear Paciente");
    } else {
      console.error("Test 4 - Failed");
    }
  } catch (error) {
    console.error("Test 4 - Failed - Error");
  }
};
//Test 5 - Put patient by id
const actualizarPatient = async (token) => {
  setToken(token);
  try {
    const newPatient = {
      name: "hector9",
      surname: "fdas2",
      birthDate: "1990-09-22",
      address: "Avenida del Sol 45, Valencia",
      insuranceNumber: "987654321",
    };
    const res = await axiosInstance.put(`patients/${idPatient}`, newPatient);
    if (res.status === 200) {
      console.log("Test 5 - Passed Put - Actualizar Paciente");
    } else {
      console.error("Test 5 - Failed");
    }
  } catch (error) {
    console.error("Test 5 - Failed - Error");
  }
};
//Test 6 - Delete patient by id
const eliminarPatient = async (token) => {
  setToken(token);
  try {
    const res = await axiosInstance.delete(`patients/${idPatientDelete}`);
    if (res.status === 200) {
      console.log("Test 6 - Passed Delete - Eliminar Paciente");
    } else {
      console.error("Test 6 - Failed");
    }
  } catch (error) {
    console.error("Test 6 - Failed - Error");
  }
};

const ejecutarPruebas = async () => {
  console.log("Test User Admin");
  let token = await autenticarUsuario(user);
  await obtenerPatients(token);
  await obtenerPatientsById(token);
  await obtenerPatientsByFind(token);
  await crearPatient(token);
  await actualizarPatient(token);
  await eliminarPatient(token);
  token = "";
  setToken(token);
  console.log("------------------------------------");
  console.log("Test User Patient");
  token = await autenticarUsuario(user2);
  await obtenerPatients(token);
  await obtenerPatientsById(token);
  await obtenerPatientsByFind(token);
  await crearPatient(token);
  await actualizarPatient(token);
  await eliminarPatient(token);
  token = "";
  setToken(token);
  console.log("------------------------------------");
  console.log("Test User Physio");
  token = await autenticarUsuario(user3);
  await obtenerPatients(token);
  await obtenerPatientsById(token);
  await obtenerPatientsByFind(token);
  await crearPatient(token);
  await actualizarPatient(token);
  await eliminarPatient(token);
};

ejecutarPruebas();

async function autenticarUsuario(userParam) {
  try {
    const respuesta = await axiosInstance.post("/auth/login", {
      login: userParam.login,
      password: userParam.password,
    });
    if (respuesta.status == 200 && respuesta.data.ok) {
      console.log("OK - Login");
      return respuesta.data.token;
    } else console.log("Error - Login");
  } catch (error) {
    console.log("Error - Login");
    return null;
  }
}

const setToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common["authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers["authorization"];
  }
};
