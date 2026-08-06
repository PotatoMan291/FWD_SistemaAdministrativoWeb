const usuarioCorrecto = {

    usuario: "admin",
    contraseña: "admin",
    nombre: "Andrés, Hanxel y Jared",
    rol: "Administrador"

};

const formulario = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const contraseñaInput = document.getElementById("password");
const mensajeError = document.getElementById("mensajeError");

formulario.addEventListener("submit", function (event) {

    event.preventDefault();

    mensajeError.textContent = "";

    const usuario = usuarioInput.value.trim();
    const contraseña = contraseñaInput.value;

    if (
        usuario === usuarioCorrecto.usuario &&
        contraseña === usuarioCorrecto.contraseña
    ) {

        localStorage.setItem(
            "usuario",
            JSON.stringify(usuarioCorrecto)
        );

        window.location.href = "dashboard.html";

    } else {

        mensajeError.textContent = "Usuario o contraseña incorrectos.";

    }

});