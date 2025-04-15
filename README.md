# PhysioCare API 🏥🧑‍⚕️

**PhysioCare API** es una API RESTful para la gestión de fisioterapeutas en una clínica. Permite realizar operaciones CRUD sobre los datos de los `physios`, con autenticación basada en tokens JWT y control de acceso por roles (`admin`, `physio`, `patient`).

## 🚀 Características

- Registro e inicio de sesión de usuarios
- Control de acceso por roles
- CRUD completo de fisioterapeutas
- Validación de datos del formulario
- Arquitectura modular (Express + Mongoose)
- Listo para integrarse con frontend (JavaFX, web, etc.)

## 🛠️ Tecnologías utilizadas

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (JSON Web Tokens)
- bcrypt
- dotenv

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/physiocare-api.git
cd physiocare-api

# Instalar dependencias
npm install

# Iniciar el servidor
npm start

