const axios = require('axios');
const e = require('express');
const { set } = require('mongoose');
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/',
    headers: {
        'Content-Type': 'application/json',
    }
});
const idPhysio = "67825695898aaacce7f8404a";
const apellido = "Fernández";
const user = {
    login: 'hector2',
    password: '1234',
    rol: 'admin',
}
const user2 = {
    login: 'hector4',
    password: '1234',
    rol: 'patient',
}
const user3 = {
    login: 'Mario',
    password: '1234',
    rol: 'physio',
}
//Test 1 - Get all patients
const obtenerPatients = async (token) => {
    try {
        
        setToken(token);
        const res = await axiosInstance.get('physios');
        if(res.status === 200){
            console.log('Test 1 - Passed Get - Obtener Pacientes');
        }else{
            console.error('Test 1 - Failed');
        }
    } catch (error) {
       console.error("Test 1 - Failed");
    }
}

//Test 2 - Get patient by id
const obtenerPatientsById = async (token)=>{
    try{
        setToken(token);
        const res = await axiosInstance.get(`physios/${idPhysio}`);
        if(res.status === 200){
            console.log('Test 2 - Passed Get - Obtener Paciente por id');
        }else{
            console.error('Test 2 - Failed');
        }
    }catch(error){
        console.error("Test 2 - Failed");
    }
}
//Test 3 - Get patient by find
const obtenerPatientsByFind = async (token)=>{
    try{
        setToken(token);
        const res = await axiosInstance.get(`physios/find?surname=${apellido}`);
        if(res.status === 200){
            console.log('Test 3 - Passed Get - Obtener Paciente por apellido');
        }else{
            console.error('Test 3 - Failed');
        }
    }catch(error){
        console.error("Test 3 - Failed");
    }
}
//Test 4 - Post patient
const postPatient = async (token)=>{
    let licenseNumber = "AAAAAA";
    let number = Math.floor(Math.random() * 100);
    licenseNumber = licenseNumber + number;
    try{
        setToken(token);
        const newPhysio = {
            name: "Juan2",
            surname: "Perez2",
            specialty: "Geriatric",
            licenseNumber: licenseNumber,
        }
        const res = await axiosInstance.post('physios', newPhysio);
        if(res.status === 200 || res.status === 201){
            console.log('Test 4 - Passed Post - Crear Paciente');
        }else{
            console.error('Test 4 - Failed');
        }
    }
    catch(error){
        console.error("Test 4 - Failed");
    }
}
//Test 5 - Put patient
const putPatient = async (token)=>{
    let licenseNumber = "AAAAAA";
    let number = Math.floor(Math.random() * 100);
    licenseNumber = licenseNumber + number;
    try{
        setToken(token);
        const newPhysio = {
            name: "Juan22",
            surname: "Perez22",
            specialty: "Geriatric",
            licenseNumber: licenseNumber,
        }
        const res = await axiosInstance.put(`physios/${idPhysio}`, newPhysio);
        if(res.status === 200){
            console.log('Test 5 - Passed Put - Actualizar Paciente');
        }else{
            console.error('Test 5 - Failed');
        }
    }
    catch(error){
        console.error("Test 5 - Failed");
    }
}
//Test 6 - Delete patient
const deletePatient = async (token)=>{
    try{
        setToken(token);
        const res = await axiosInstance.delete(`physios/${idPhysio}`);
        if(res.status === 200){
            console.log('Test 6 - Passed Delete - Borrar Paciente');
        }else{
            console.error('Test 6 - Failed');
        }
    }
    catch(error){
        console.error("Test 6 - Failed");
    }
}



const ejecutarPruebas = async() => {
    console.log("Test - Admin");
    let token =await autenticarUsuario(user);
    await obtenerPatients(token);
    await obtenerPatientsById(token);
    await obtenerPatientsByFind(token);
    await postPatient(token);
    await putPatient(token);
    await deletePatient(token);
    token="";
    setToken(token);
    console.log("-----------------------------------");
    console.log("Test  - Patient");
    token =await autenticarUsuario(user2);
    await obtenerPatients(token);
    await obtenerPatientsById(token);
    await obtenerPatientsByFind(token);
    await postPatient(token);
    await putPatient(token);
    await deletePatient(token);
    token="";
    setToken(token);
    console.log("-----------------------------------");
    console.log("Test  - Physio");
    token =await autenticarUsuario(user3);
    await obtenerPatients(token);
    await obtenerPatientsById(token);
    await obtenerPatientsByFind(token);
    await postPatient(token);
    await putPatient(token);
    await deletePatient(token);
    
}

ejecutarPruebas();

async function autenticarUsuario(userParam){
    try {
        const respuesta = await axiosInstance.post('/auth/login', {
            login: userParam.login,     
            password: userParam.password
        });
        if (respuesta.status == 200 && respuesta.data.ok)
        {
            console.log("OK - Login");
            return respuesta.data.token;  
        }
        else
            console.log("Error - Login");
    } catch (error) {
        console.log("Error - Login");
        return null;
    }
};

const setToken = (token) => {
    if (token) {
        axiosInstance.defaults.headers.common['authorization'] = `Bearer ${token}`;
    } else {
        delete axiosInstance.defaults.headers['authorization'];
    }
};