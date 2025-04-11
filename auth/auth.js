const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

//Cargar las variables
dotenv.config();
//Clave secreta que esta guardada en el fichero .env
const secreto = process.env.JWT_SECRET_KEY;

//Función genera el token JWT basado en el nombre del usuario
let generarToken = (login,rol) => jwt.sign({login:login,rol:rol},secreto,{expiresIn:"2 hours"});

//Función para validar el token JWT recibido
//Devuelve los datos decodificados del token si es válido
let validarToken = token => {
    try{
        let resultado = jwt.verify(token,secreto);
        return resultado;
    }catch(e){}
}

//Middleware para proteger rutas restringidas
//Verifica que el token sea válido antes de permitir el acceso a la ruta
let protegerRuta = (rol) =>{
    return (req,res,next)=>{
        let token = req.headers['authorization'];
             
        let token2 = token.slice(7);
        let decode = jwt.verify(token2,secreto);
        // Comprueba que el token existe y comienza con "Bearer "
        if (token && token.startsWith("Bearer ")) 
            {    
                // Elimina el prefijo "Bearer " para obtener solo el token
                token = token.slice(7);
                if (validarToken(token))  {
                    if(!rol.includes(decode.rol)) {
                        
                        return res.status(403).send({ok: false, error: "Usuario no autorizado"});
                    }  
                    req.user = decode;
                    // Si es válido, permite el acceso a la ruta    
                    next(); 
                }else
                    res.status(403).send({ok: false, error: "Usuario no autorizado"});
            } else { 
                // Si el token no existe o no tiene el formato correcto, responde con un error
                res.status(403).send({ok: false, error: "Usuario no autorizado"});
            }
    }
}
module.exports = {generarToken,validarToken,protegerRuta};