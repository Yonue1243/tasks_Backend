import Usuario from "../models/Usuario.js";
import generarId from "../helpers/generarId.js";
import generarJWT from "../helpers/generarJWT.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";

const registrar = async (req, res) => {
  //Evitar registros duplicados

  const { email } = req.body;

  const existeUsuario = await Usuario.findOne({ email: email });

  if (existeUsuario)
    return res.status(400).json({ msg: "Usuario ya registrado" });

    try {
      
      const usuario = new Usuario(req.body);
      usuario.token = generarId();
      await usuario.save();

      // Email de confirmación
      emailRegistro({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
      })
  
      res.json({msg: "Usuario almacenado correctamente. Revisa tu email para confirmar tu Email"});
    } catch (err) {
      console.log(err);
    }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;

  //Comprobar si el usuario existe

  const usuario = await Usuario.findOne({ email });

  if (!usuario) return res.status(404).json({ msg: "El usuario no existe" });

  //Usuario confirmado

  if (!usuario.confirmado)
    return res.status(403).json({ msg: "Tu cuenta no ha sido confirmada" });

  //Password

  if (await usuario.comprobarPassword(password)) {
    res.json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      token: generarJWT(usuario._id),
    });
  } else {
    return res.status(403).json({ msg: "La contraseña es incorrecta" });
  }
};

const confirmar = async (req, res) => {
  const { token } = req.params;

  const usuarioConfirmar = await Usuario.findOne({ token });

  if (!usuarioConfirmar)
    return res.status(403).json({ msg: "El token no es valido" });

    console.log("queso")

  try {
    usuarioConfirmar.confirmado = true;
    usuarioConfirmar.token = "";
    await usuarioConfirmar.save();

    res.json({ msg: "El usuario ha sido confirmado correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const olvidePassword = async (req, res) => {
  const { email } = req.body;

  const usuario = await Usuario.findOne({ email });

  if (!usuario) return res.status(404).json({ msg: "El usuario no existe" });

  try {
    usuario.token = generarId();
    await usuario.save();
    //Enviar el email

    emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: usuario.token
    })

    res.json({ msg: "Hemos enviado un email con las instrucciones" });
  } catch (error) {
    console.log(error);
  }
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const tokenValido = await Usuario.findOne({ token });

  if (!tokenValido) return res.status(404).json({ msg: "Token no valido" });

  res.json({ msg: "El Token es valido y el Usuario existe" });
};


const nuevoPassword = async (req, res) => {

    const {token} = req.params;

    const {password} = req.body;

    const usuario = await Usuario.findOne({ token });

    if (!usuario) return res.status(404).json({ msg: "Token no valido" });

    usuario.password = password;
    usuario.token = "";

    try {
        await usuario.save();
        res.json({ msg: "El Password ha sido modificado correctamente"})
    } catch (error) {
        console.log(error);
    }

  
}

const perfil = async (req, res) => {

  const {usuario} = req;

  res.json(usuario)



}


export { registrar, autenticar, confirmar, olvidePassword, comprobarToken, nuevoPassword, perfil };
