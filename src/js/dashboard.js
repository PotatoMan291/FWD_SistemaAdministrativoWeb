const usuario = JSON.parse(localStorage.getItem("usuario"));

if (!usuario) {

    window.location.href = "login.html";

}

document.getElementById("nombreUsuario").textContent =
usuario.nombre + " (" + usuario.rol + ")";

document.getElementById("cerrarSesion").addEventListener("click", function(){

    const confirmar = confirm("¿Desea cerrar sesión?");

    if(confirmar){

        localStorage.removeItem("usuario");

        window.location.href = "login.html";

    }

});

const temaBtn = document.getElementById("temaBtn");

const temaGuardado = localStorage.getItem("tema");

if(temaGuardado === "dark"){

    document.body.classList.add("dark");

    temaBtn.textContent = "☀️ Modo claro";

}

temaBtn.addEventListener("click", function(){

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){

        localStorage.setItem("tema","dark");

        temaBtn.textContent="☀️ Modo claro";

    }else{

        localStorage.setItem("tema","light");

        temaBtn.textContent="🌙 Modo oscuro";

    }

});