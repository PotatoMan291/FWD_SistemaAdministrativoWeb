// ======================================================
// ADMINISTRACIÓN DE PROVEEDORES
// Todos los proveedores se guardan en LocalStorage.
// Clave utilizada: "proveedores"
// ======================================================

const CLAVE_PROVEEDORES = "proveedores";

const formProveedor = document.getElementById("form-proveedor");
const proveedorId = document.getElementById("proveedor-id");
const proveedorNombre = document.getElementById("proveedor-nombre");
const proveedorEmpresa = document.getElementById("proveedor-empresa");
const proveedorTelefono = document.getElementById("proveedor-telefono");
const proveedorCorreo = document.getElementById("proveedor-correo");
const proveedorDireccion = document.getElementById("proveedor-direccion");

const btnGuardarProveedor =
    document.getElementById("btn-guardar-proveedor");

const btnCancelarProveedor =
    document.getElementById("btn-cancelar-proveedor");

const tablaProveedoresBody =
    document.getElementById("tabla-proveedores-body");

const buscadorProveedor =
    document.getElementById("buscador-proveedor");

const mensajeProveedor =
    document.getElementById("mensaje-proveedor");


// ------------------------------------------------------
// Leer proveedores desde LocalStorage
// ------------------------------------------------------
function obtenerProveedores() {

    const datos = localStorage.getItem(CLAVE_PROVEEDORES);

    return datos ? JSON.parse(datos) : [];
}


// ------------------------------------------------------
// Guardar proveedores en LocalStorage
// ------------------------------------------------------
function guardarProveedores(proveedores) {

    localStorage.setItem(
        CLAVE_PROVEEDORES,
        JSON.stringify(proveedores)
    );
}


// ------------------------------------------------------
// Crear botón de acción
// ------------------------------------------------------
function crearBoton(texto, clase, idProveedor, accion) {

    const boton = document.createElement("button");

    boton.type = "button";
    boton.textContent = texto;
    boton.className = clase;

    boton.addEventListener("click", function() {

        accion(idProveedor);

    });

    return boton;
}


// ------------------------------------------------------
// Mostrar proveedores
// ------------------------------------------------------
function mostrarProveedores(listaProveedores) {

    let proveedores;

    if (listaProveedores) {

        proveedores = listaProveedores;

    } else {

        proveedores = obtenerProveedores();

    }

    tablaProveedoresBody.innerHTML = "";

    if (proveedores.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.textContent =
            "No hay proveedores registrados.";

        celda.style.textAlign = "center";

        fila.appendChild(celda);
        tablaProveedoresBody.appendChild(fila);

        return;
    }

    proveedores.forEach(function(proveedor) {

        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = proveedor.id;

        const celdaNombre = document.createElement("td");
        celdaNombre.textContent = proveedor.nombre;

        const celdaEmpresa = document.createElement("td");
        celdaEmpresa.textContent = proveedor.empresa;

        const celdaTelefono = document.createElement("td");
        celdaTelefono.textContent = proveedor.telefono;

        const celdaCorreo = document.createElement("td");
        celdaCorreo.textContent = proveedor.correo;

        const celdaDireccion = document.createElement("td");
        celdaDireccion.textContent = proveedor.direccion;

        const celdaAcciones = document.createElement("td");

        const botonEditar = crearBoton(
            "Editar",
            "btn-editar",
            proveedor.id,
            editarProveedor
        );

        const botonEliminar = crearBoton(
            "Eliminar",
            "btn-eliminar",
            proveedor.id,
            eliminarProveedor
        );

        celdaAcciones.appendChild(botonEditar);
        celdaAcciones.appendChild(botonEliminar);

        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmpresa);
        fila.appendChild(celdaTelefono);
        fila.appendChild(celdaCorreo);
        fila.appendChild(celdaDireccion);
        fila.appendChild(celdaAcciones);

        tablaProveedoresBody.appendChild(fila);

    });
}


// ------------------------------------------------------
// Validar correo
// ------------------------------------------------------
function correoValido(correo) {

    return (
        correo.includes("@") &&
        correo.includes(".")
    );
}


// ------------------------------------------------------
// Validar formulario
// ------------------------------------------------------
function validarProveedor(
    nombre,
    empresa,
    telefono,
    correo,
    direccion
) {

    mensajeProveedor.textContent = "";

    if (
        nombre === "" ||
        empresa === "" ||
        telefono === "" ||
        correo === "" ||
        direccion === ""
    ) {

        mensajeProveedor.textContent =
            "Todos los campos son obligatorios.";

        return false;
    }

    if (!correoValido(correo)) {

        mensajeProveedor.textContent =
            "Ingrese un correo electrónico válido.";

        return false;
    }

    return true;
}


// ------------------------------------------------------
// Registrar o actualizar proveedor
// ------------------------------------------------------
formProveedor.addEventListener("submit", function(event) {

    event.preventDefault();

    const id = proveedorId.value;

    const nombre = proveedorNombre.value.trim();
    const empresa = proveedorEmpresa.value.trim();
    const telefono = proveedorTelefono.value.trim();
    const correo = proveedorCorreo.value.trim();
    const direccion = proveedorDireccion.value.trim();

    if (!validarProveedor(
        nombre,
        empresa,
        telefono,
        correo,
        direccion
    )) {

        return;
    }

    let proveedores = obtenerProveedores();

    // --------------------------------------------------
    // REGISTRAR NUEVO PROVEEDOR
    // --------------------------------------------------
    if (id === "") {

        const nuevoProveedor = {

            id: Date.now().toString(),
            nombre: nombre,
            empresa: empresa,
            telefono: telefono,
            correo: correo,
            direccion: direccion

        };

        proveedores.push(nuevoProveedor);

        guardarProveedores(proveedores);

        limpiarFormularioProveedor();
        mostrarProveedores();

        return;
    }

    // --------------------------------------------------
    // EDITAR PROVEEDOR
    // SweetAlert pregunta antes de guardar los cambios
    // --------------------------------------------------
    Swal.fire({

        title: "¿Desea guardar los cambios?",

        icon: "question",

        showDenyButton: true,

        showCancelButton: true,

        confirmButtonText: "Guardar",

        denyButtonText: "No guardar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            proveedores = proveedores.map(function(proveedor) {

                if (String(proveedor.id) === String(id)) {

                    return {

                        id: proveedor.id,
                        nombre: nombre,
                        empresa: empresa,
                        telefono: telefono,
                        correo: correo,
                        direccion: direccion

                    };

                }

                return proveedor;

            });

            // Actualizar LocalStorage solo si confirma
            guardarProveedores(proveedores);

            limpiarFormularioProveedor();
            mostrarProveedores();

            Swal.fire(
                "¡Guardado!",
                "Los cambios del proveedor se guardaron correctamente.",
                "success"
            );

        } else if (result.isDenied) {

            Swal.fire(
                "Cambios no guardados",
                "Los cambios del proveedor no se guardaron.",
                "info"
            );

        }

        // Si presiona Cancelar, no se guarda nada
        // y el formulario permanece en modo edición.
    });

});


// ------------------------------------------------------
// Cargar proveedor para editar
// ------------------------------------------------------
function editarProveedor(id) {

    const proveedores = obtenerProveedores();

    const proveedorEncontrado =
        proveedores.find(function(proveedor) {

            return String(proveedor.id) === String(id);

        });

    if (!proveedorEncontrado) {

        return;
    }

    proveedorId.value =
        proveedorEncontrado.id;

    proveedorNombre.value =
        proveedorEncontrado.nombre;

    proveedorEmpresa.value =
        proveedorEncontrado.empresa;

    proveedorTelefono.value =
        proveedorEncontrado.telefono;

    proveedorCorreo.value =
        proveedorEncontrado.correo;

    proveedorDireccion.value =
        proveedorEncontrado.direccion;

    btnGuardarProveedor.textContent =
        "Actualizar Proveedor";

    btnCancelarProveedor.style.display =
        "inline-block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ------------------------------------------------------
// Eliminar proveedor con SweetAlert2
// ------------------------------------------------------
function eliminarProveedor(id) {

    const productos =
        JSON.parse(
            localStorage.getItem("productos")
        ) || [];

    const tieneProductos =
        productos.some(function(producto) {

            return String(producto.proveedorId) === String(id);

        });

    let mensaje =
        "¡No podrá revertir esta acción!";

    if (tieneProductos) {

        mensaje =
            "Este proveedor tiene productos relacionados. ¡No podrá revertir esta acción!";

    }

    Swal.fire({

        title: "¿Está seguro?",

        text: mensaje,

        icon: "warning",

        showCancelButton: true,

        confirmButtonColor: "#3085d6",

        cancelButtonColor: "#d33",

        confirmButtonText: "Sí, eliminar",

        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            let proveedores = obtenerProveedores();

            proveedores = proveedores.filter(function(proveedor) {

                return String(proveedor.id) !== String(id);

            });

            // Actualizar LocalStorage inmediatamente
            guardarProveedores(proveedores);

            limpiarFormularioProveedor();
            mostrarProveedores();

            Swal.fire({

                title: "¡Eliminado!",

                text: "El proveedor ha sido eliminado.",

                icon: "success"

            });

        }

    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioProveedor() {

    formProveedor.reset();

    proveedorId.value = "";

    btnGuardarProveedor.textContent =
        "Guardar Proveedor";

    btnCancelarProveedor.style.display =
        "none";

    mensajeProveedor.textContent = "";
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarProveedor.addEventListener("click", function() {

    limpiarFormularioProveedor();

});


// ------------------------------------------------------
// Buscar proveedores en tiempo real
// ------------------------------------------------------
buscadorProveedor.addEventListener("input", function(event) {

    const texto =
        event.target.value
            .toLowerCase()
            .trim();

    const proveedores =
        obtenerProveedores();

    const proveedoresFiltrados =
        proveedores.filter(function(proveedor) {

            return (
                proveedor.nombre.toLowerCase().includes(texto) ||
                proveedor.empresa.toLowerCase().includes(texto) ||
                proveedor.telefono.toLowerCase().includes(texto) ||
                proveedor.correo.toLowerCase().includes(texto) ||
                proveedor.direccion.toLowerCase().includes(texto)
            );

        });

    mostrarProveedores(proveedoresFiltrados);
});


// ------------------------------------------------------
// Modo oscuro
// Usa la misma clave del módulo de Clientes
// ------------------------------------------------------
const btnModoOscuro =
    document.getElementById("btn-modo-oscuro");

if (localStorage.getItem("modo_oscuro") === "true") {

    document.body.classList.add("dark-mode");

    btnModoOscuro.textContent =
        "☀️ Modo Claro";
}

btnModoOscuro.addEventListener("click", function() {

    document.body.classList.toggle("dark-mode");

    const esOscuro =
        document.body.classList.contains("dark-mode");

    btnModoOscuro.textContent =
        esOscuro
            ? "☀️ Modo Claro"
            : "🌙 Modo Oscuro";

    localStorage.setItem(
        "modo_oscuro",
        esOscuro
    );
});


// ------------------------------------------------------
// Cargar proveedores al iniciar
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", function() {

    mostrarProveedores();

});
