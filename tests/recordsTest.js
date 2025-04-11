const axios = require('axios');
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/',
    headers: {
        'Content-Type': 'application/json',
    }
});
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
const idRecord = "67825695898aaacce7f84042";
const apellido = "López";
const idPatient = "67825695898aaacce7f84042";
const idRecordDelete = "67825695898aaacce7f84055";

//Test 1 - Get all Records
const obtenerRecords = async (token) => {
    try {
        setToken(token);
        const res = await axiosInstance.get('records');
        if(res.status === 200){
            console.log('Test 1 - Passed Get - Obtener Records');
        }else{
            console.error('Test 1 - Failed');
        }
    } catch (error) {
       console.error("Test 1 - Failed");
    }
}
//Test 2 - Get Record by id
const obtenerRecordsById = async (token)=>{
    try{
        setToken(token);
        const res = await axiosInstance.get(`records/${idRecord}`);
        if(res.status === 200){
            console.log('Test 2 - Passed Get - Obtener Record por id');
        }else{
            console.error('Test 2 - Failed');
        }
    }catch(error){
        console.error("Test 2 - Failed");
    }
}
//Test 3 - Get Record by find
const obtenerRecordsByFind = async (token)=>{
    try{
        setToken(token);
        const res = await axiosInstance.get(`records/find?surname=${apellido}`);
        if(res.status === 200){
            console.log('Test 3 - Passed Get - Obtener Record por apellido');
        }else{
            console.error('Test 3 - Failed');
        }
    }catch(error){
        console.error("Test 3 - Failed");
    }
}
//Test 4 - Post Record
const crearRecord = async (token) => {
    try {
        setToken(token);
        const newRecord = {
            patient: idPatient,
            medicalRecord: "Paciente con antecedentes de lesiones en rodilla y cadera.",
            appointments: []
        }
        const res = await axiosInstance.post('records', newRecord);
        if(res.status === 200){
            console.log('Test 4 - Passed Post - Crear Record');
        }else{
            console.error('Test 4 - Failed');
        }
    } catch (error) {
       console.error("Test 4 - Failed");
    }
}
//Test 5 - Put Record
const modificarRecord = async (token) => {
    try {
        setToken(token);
        const newRecord = {
            patient: idPatient,
            medicalRecord: "Paciente con antecedentes de lesiones en rodilla y cadera.",
            appointments: []
        }
        const res = await axiosInstance.put(`records/${idRecord}`, newRecord);
        if(res.status === 200){
            console.log('Test 5 - Passed Put - Modificar Record');
        }else{
            console.error('Test 5 - Failed');
        }
    } catch (error) {
       console.error("Test 5 - Failed");
    }
}
//Test 6 - Delete Record
const eliminarRecord = async (token) => {
    try {
        setToken(token);
        const res = await axiosInstance.delete(`records/${idRecordDelete}`);
        if(res.status === 200){
            console.log('Test 6 - Passed Delete - Eliminar Record');
        }else{
            console.error('Test 6 - Failed');
        }
    } catch (error) {
       console.error("Test 6 - Failed");
    }
}



const ejecutarPruebas = async() => {
    console.log("Test Admin");
    let token = await autenticarUsuario(user);
    await obtenerRecords(token);
    await obtenerRecordsById(token);
    await obtenerRecordsByFind(token);
    await crearRecord(token);
    await modificarRecord(token);
    await eliminarRecord(token);
    console.log("-----------------------------------");
    console.log("Test Patient");
    token = await autenticarUsuario(user2);
    await obtenerRecords(token);
    await obtenerRecordsById(token);
    await obtenerRecordsByFind(token);
    await crearRecord(token);
    await modificarRecord(token);
    await eliminarRecord(token);
    console.log("-----------------------------------");
    console.log("Test Physio");    
    token = await autenticarUsuario(user3);
    await obtenerRecords(token);
    await obtenerRecordsById(token);
    await obtenerRecordsByFind(token);
    await crearRecord(token);
    await modificarRecord(token);
    await eliminarRecord(token);


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