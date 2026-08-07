// ======================================================
// ADMINISTRACIÓN DE CLIENTES
// LocalStorage: "clientes_sistema"
// ======================================================


const STORAGE_KEY =
    "clientes_sistema";


const CLAVE_USUARIO =
    "usuario";


const CLAVE_PEDIDOS =
    "pedidos";


// ------------------------------------------------------
// Elementos
// ------------------------------------------------------

const formCliente =
    document.getElementById(
        "form-cliente"
    );


const clienteId =
    document.getElementById(
        "cliente-id"
    );


const clienteNombre =
    document.getElementById(
        "nombre"
    );


const clienteCorreo =
    document.getElementById(
        "correo"
    );


const clienteTelefono =
    document.getElementById(
        "telefono"
    );


const btnGuardar =
    document.getElementById(
        "btn-guardar"
    );


const btnCancelar =
    document.getElementById(
        "btn-cancelar"
    );


const tablaClientesBody =
    document.getElementById(
        "tabla-clientes-body"
    );


const buscadorCliente =
    document.getElementById(
        "buscador-cliente"
    );


const mensajeCliente =
    document.getElementById(
        "mensaje-cliente"
    );



// ------------------------------------------------------
// LocalStorage
// ------------------------------------------------------

function obtenerClientes() {

    const datos =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!datos) {

        return [];

    }


    try {

        const clientes =
            JSON.parse(datos);


        return Array.isArray(clientes)
            ? clientes
            : [];

    } catch (error) {

        return [];

    }

}



function guardarClientes(
    clientes
) {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(clientes)

    );

}



// ------------------------------------------------------
// Sesión
// ------------------------------------------------------

function verificarSesion() {

    const usuarioGuardado =
        localStorage.getItem(
            CLAVE_USUARIO
        );


    if (!usuarioGuardado) {

        window.location.href =
            "login.html";

        return null;

    }


    try {

        return JSON.parse(
            usuarioGuardado
        );

    } catch (error) {

        return {
            nombre:
                usuarioGuardado
        };

    }

}



function mostrarUsuario() {

    const usuario =
        verificarSesion();


    if (!usuario) {

        return;

    }


    document.getElementById(
        "nombreUsuario"
    ).textContent =
        usuario.nombre ||
        usuario.usuario ||
        "Administrador";

}



// ------------------------------------------------------
// Resumen
// ------------------------------------------------------

function actualizarResumenClientes() {

    const clientes =
        obtenerClientes();


    const conCorreo =
        clientes.filter(
            function(cliente) {

                return Boolean(
                    cliente.correo
                );

            }
        );


    const conTelefono =
        clientes.filter(
            function(cliente) {

                return Boolean(
                    cliente.telefono
                );

            }
        );


    document.getElementById(
        "resumen-total-clientes"
    ).textContent =
        clientes.length;


    document.getElementById(
        "resumen-clientes-correo"
    ).textContent =
        conCorreo.length;


    document.getElementById(
        "resumen-clientes-telefono"
    ).textContent =
        conTelefono.length;

}



// ------------------------------------------------------
// Validación
// ------------------------------------------------------

function validarCliente(
    nombre,
    correo,
    telefono
) {

    mensajeCliente.textContent =
        "";


    if (
        nombre === "" ||
        correo === "" ||
        telefono === ""
    ) {

        mensajeCliente.textContent =
            "Todos los campos son obligatorios.";

        return false;

    }


    if (
        !/^[0-9]+$/.test(
            telefono
        )
    ) {

        mensajeCliente.textContent =
            "El teléfono debe contener únicamente números.";

        return false;

    }


    return true;

}



// ------------------------------------------------------
// Crear / actualizar cliente
// ------------------------------------------------------

formCliente.addEventListener(

    "submit",

    function(event) {

        event.preventDefault();


        const id =
            clienteId.value;

        if (
            id === "" &&
            window.Permisos &&
            !Permisos.exigir(
                "crear"
            )
        ) {

            return;
        }


        if (
            id !== "" &&
            window.Permisos &&
            !Permisos.exigir(
                "editar"
            )
        ) {

            return;
        }



        const nombre =
            clienteNombre.value.trim();


        const correo =
            clienteCorreo.value.trim();


        const telefono =
            clienteTelefono.value.trim();


        if (
            !validarCliente(
                nombre,
                correo,
                telefono
            )
        ) {

            return;

        }


        let clientes =
            obtenerClientes();


        // NUEVO CLIENTE
        if (id === "") {


            const nuevoCliente = {

                id:
                    Date.now().toString(),

                nombre:
                    nombre,

                correo:
                    correo,

                telefono:
                    telefono

            };


            clientes.push(
                nuevoCliente
            );


            guardarClientes(
                clientes
            );


            limpiarFormulario();


            listarClientes();


            mostrarToast(
                "Cliente registrado correctamente.",
                "success"
            );


            return;

        }


        // ACTUALIZAR CLIENTE

        Swal.fire({

            title:
                "¿Guardar cambios?",

            text:
                "Se actualizará la información del cliente.",

            icon:
                "question",

            showCancelButton:
                true,

            confirmButtonText:
                "Guardar",

            cancelButtonText:
                "Cancelar"


        }).then(
            function(resultado) {


                if (
                    !resultado.isConfirmed
                ) {

                    return;

                }


                clientes =
                    clientes.map(
                        function(cliente) {


                            if (
                                String(cliente.id) ===
                                String(id)
                            ) {

                                return {

                                    id:
                                        cliente.id,

                                    nombre:
                                        nombre,

                                    correo:
                                        correo,

                                    telefono:
                                        telefono

                                };

                            }


                            return cliente;

                        }
                    );


                guardarClientes(
                    clientes
                );


                limpiarFormulario();


                listarClientes();


                mostrarToast(
                    "Cliente actualizado correctamente.",
                    "success"
                );


            }
        );

    }

);



// ------------------------------------------------------
// Crear botones de acción
// ------------------------------------------------------

function crearBotonAccion(
    titulo,
    clase,
    icono,
    accion
) {

    const boton =
        document.createElement(
            "button"
        );


    boton.type =
        "button";


    boton.className =
        clase;


    boton.title =
        titulo;


    boton.setAttribute(
        "aria-label",
        titulo
    );


    boton.innerHTML =
        `<i class="${icono}"></i>`;


    boton.addEventListener(
        "click",
        accion
    );


    const descripcionPermiso =
        String(
            titulo ||
            ""
        )
            .toLowerCase();

    if (
        descripcionPermiso.includes(
            "editar"
        )
    ) {

        boton.dataset.permiso =
            "editar";


        if (
            window.Permisos &&
            !Permisos.puedeEditar()
        ) {

            boton.hidden =
                true;
        }
    }


    if (
        descripcionPermiso.includes(
            "eliminar"
        ) ||
        descripcionPermiso.includes(
            "borrar"
        )
    ) {

        boton.dataset.permiso =
            "eliminar";


        if (
            window.Permisos &&
            !Permisos.puedeEliminar()
        ) {

            boton.hidden =
                true;
        }
    }


    return boton;

}



// ------------------------------------------------------
// Mostrar clientes
// ------------------------------------------------------

function listarClientes(
    listaClientes
) {

    const clientes =
        listaClientes ||
        obtenerClientes();


    tablaClientesBody.innerHTML =
        "";


    if (
        clientes.length === 0
    ) {


        const fila =
            document.createElement(
                "tr"
            );


        const celda =
            document.createElement(
                "td"
            );


        celda.colSpan =
            4;


        celda.className =
            "empty-state";


        celda.innerHTML =
            '<i class="bi bi-inbox"></i>' +
            '<strong>No hay clientes para mostrar</strong>';


        fila.appendChild(
            celda
        );


        tablaClientesBody.appendChild(
            fila
        );


        actualizarResumenClientes();


        return;

    }



    clientes.forEach(
        function(cliente) {


            const fila =
                document.createElement(
                    "tr"
                );


            // CLIENTE
            const celdaNombre =
                document.createElement(
                    "td"
                );


            const nombre =
                document.createElement(
                    "div"
                );


            nombre.className =
                "table-primary-text";


            nombre.textContent =
                cliente.nombre;


            const descripcion =
                document.createElement(
                    "span"
                );


            descripcion.className =
                "table-secondary-text";


            descripcion.textContent =
                "Cliente registrado";


            celdaNombre.appendChild(
                nombre
            );


            celdaNombre.appendChild(
                descripcion
            );


            // CORREO
            const celdaCorreo =
                document.createElement(
                    "td"
                );


            celdaCorreo.textContent =
                cliente.correo;


            // TELÉFONO
            const celdaTelefono =
                document.createElement(
                    "td"
                );


            celdaTelefono.textContent =
                cliente.telefono;


            // ACCIONES
            const celdaAcciones =
                document.createElement(
                    "td"
                );


            const grupoAcciones =
                document.createElement(
                    "div"
                );


            grupoAcciones.className =
                "action-group";


            const botonEditar =
                crearBotonAccion(

                    "Editar cliente",

                    "btn btn-outline-primary btn-action",

                    "bi bi-pencil",

                    function() {

                        cargarClienteParaEditar(
                            cliente.id
                        );

                    }

                );


            const botonEliminar =
                crearBotonAccion(

                    "Eliminar cliente",

                    "btn btn-outline-danger btn-action",

                    "bi bi-trash3",

                    function() {

                        eliminarCliente(
                            cliente.id
                        );

                    }

                );


            grupoAcciones.appendChild(
                botonEditar
            );


            grupoAcciones.appendChild(
                botonEliminar
            );


            celdaAcciones.appendChild(
                grupoAcciones
            );


            fila.appendChild(
                celdaNombre
            );


            fila.appendChild(
                celdaCorreo
            );


            fila.appendChild(
                celdaTelefono
            );


            fila.appendChild(
                celdaAcciones
            );


            tablaClientesBody.appendChild(
                fila
            );

        }
    );


    actualizarResumenClientes();

}



// ------------------------------------------------------
// Cargar cliente para editar
// ------------------------------------------------------

function cargarClienteParaEditar(
    id
) {

    if (
        window.Permisos &&
        !Permisos.exigir(
            "editar"
        )
    ) {

        return;
    }


    const clientes =
        obtenerClientes();


    const cliente =
        clientes.find(
            function(cliente) {

                return (
                    String(cliente.id) ===
                    String(id)
                );

            }
        );


    if (!cliente) {

        return;

    }


    clienteId.value =
        cliente.id;


    clienteNombre.value =
        cliente.nombre;


    clienteCorreo.value =
        cliente.correo;


    clienteTelefono.value =
        cliente.telefono;


    btnGuardar.innerHTML =
        '<i class="bi bi-check2-circle"></i>' +
        '<span>Actualizar Cliente</span>';


    btnCancelar.style.display =
        "inline-flex";


    document.getElementById(
        "formulario-clientes"
    ).scrollIntoView({

        behavior:
            "smooth"

    });

}



// ------------------------------------------------------
// Pedidos asociados al cliente
// ------------------------------------------------------

function obtenerPedidosAsociadosCliente(
    idCliente
) {

    const datos =
        localStorage.getItem(
            CLAVE_PEDIDOS
        );


    if (!datos) {

        return [];

    }


    try {

        const pedidos =
            JSON.parse(
                datos
            );


        if (
            !Array.isArray(
                pedidos
            )
        ) {

            return [];

        }


        return pedidos.filter(
            function(pedido) {

                return (
                    String(
                        pedido.clienteId
                    ) ===
                    String(
                        idCliente
                    )
                );

            }
        );

    } catch (error) {

        console.error(
            "No se pudieron revisar los pedidos asociados al cliente:",
            error
        );

        return [];

    }

}



// ------------------------------------------------------
// Eliminar cliente
// ------------------------------------------------------

function eliminarCliente(
    id
) {

    if (
        window.Permisos &&
        !Permisos.exigir(
            "eliminar"
        )
    ) {

        return;
    }


    const pedidosAsociados =
        obtenerPedidosAsociadosCliente(
            id
        );


    const tienePedidos =
        pedidosAsociados.length > 0;


    const titulo =
        tienePedidos
            ? "Cliente con pedidos asociados"
            : "¿Eliminar cliente?";


    const texto =
        tienePedidos
            ? (
                "Este cliente tiene " +
                pedidosAsociados.length +
                (
                    pedidosAsociados.length === 1
                        ? " pedido asociado. "
                        : " pedidos asociados. "
                ) +
                "Si continúa, el cliente se eliminará del catálogo, " +
                "pero los pedidos NO se eliminarán y conservarán " +
                "el nombre histórico del cliente."
            )
            : "Esta acción no se puede deshacer.";


    Swal.fire({

        title:
            titulo,

        text:
            texto,

        icon:
            "warning",

        showCancelButton:
            true,

        confirmButtonText:
            "Sí, eliminar",

        cancelButtonText:
            "Cancelar",

        confirmButtonColor:
            "#d92d20"


    }).then(
        function(resultado) {


            if (
                !resultado.isConfirmed
            ) {

                return;

            }


            let clientes =
                obtenerClientes();


            clientes =
                clientes.filter(
                    function(cliente) {

                        return (
                            String(cliente.id) !==
                            String(id)
                        );

                    }
                );


            guardarClientes(
                clientes
            );


            limpiarFormulario();


            listarClientes();


            mostrarToast(
                "Cliente eliminado.",
                "success"
            );


        }
    );

}



// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------

function limpiarFormulario() {

    formCliente.reset();


    clienteId.value =
        "";


    mensajeCliente.textContent =
        "";


    btnGuardar.innerHTML =
        '<i class="bi bi-floppy"></i>' +
        '<span>Guardar Cliente</span>';


    btnCancelar.style.display =
        "none";

}



btnCancelar.addEventListener(

    "click",

    limpiarFormulario

);



// ------------------------------------------------------
// Buscar clientes
// ------------------------------------------------------

buscadorCliente.addEventListener(

    "input",

    function(event) {


        const texto =
            event.target.value
                .toLowerCase()
                .trim();


        const clientes =
            obtenerClientes();


        const filtrados =
            clientes.filter(
                function(cliente) {


                    return (

                        cliente.nombre
                            .toLowerCase()
                            .includes(texto)

                        ||

                        cliente.correo
                            .toLowerCase()
                            .includes(texto)

                        ||

                        cliente.telefono
                            .toLowerCase()
                            .includes(texto)

                    );


                }
            );


        listarClientes(
            filtrados
        );

    }

);



// ------------------------------------------------------
// Toast
// ------------------------------------------------------

function mostrarToast(
    mensaje,
    icono = "success"
) {

    Swal.fire({

        toast:
            true,

        position:
            "top-end",

        icon:
            icono,

        title:
            mensaje,

        showConfirmButton:
            false,

        timer:
            2200,

        timerProgressBar:
            true

    });

}



// ------------------------------------------------------
// Modo oscuro
// ------------------------------------------------------

const btnModoOscuro =
    document.getElementById(
        "btn-modo-oscuro"
    );



function actualizarBotonTema(
    esOscuro
) {

    if (esOscuro) {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-sun"></i>' +
            '<span>Modo claro</span>';

    } else {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-moon-stars"></i>' +
            '<span>Modo oscuro</span>';

    }

}



function aplicarTemaGuardado() {

    const esOscuro =
        localStorage.getItem(
            "modo_oscuro"
        ) === "true";


    document.documentElement
        .setAttribute(

            "data-theme",

            esOscuro
                ? "dark"
                : "light"

        );


    actualizarBotonTema(
        esOscuro
    );

}



btnModoOscuro.addEventListener(

    "click",

    function() {


        const temaActual =
            document.documentElement
                .getAttribute(
                    "data-theme"
                );


        const esOscuro =
            temaActual !== "dark";


        document.documentElement
            .setAttribute(

                "data-theme",

                esOscuro
                    ? "dark"
                    : "light"

            );


        localStorage.setItem(

            "modo_oscuro",

            esOscuro

        );


        actualizarBotonTema(
            esOscuro
        );

    }

);



// ------------------------------------------------------
// Sidebar responsive
// ------------------------------------------------------

const sidebar =
    document.getElementById(
        "sidebar"
    );


const sidebarOverlay =
    document.getElementById(
        "sidebar-overlay"
    );


const btnAbrirMenu =
    document.getElementById(
        "btn-abrir-menu"
    );


const btnCerrarMenu =
    document.getElementById(
        "btn-cerrar-menu"
    );



function abrirMenu() {

    sidebar.classList.add(
        "menu-open"
    );


    sidebarOverlay.classList.add(
        "show"
    );


    document.body.classList.add(
        "menu-open"
    );

}



function cerrarMenu() {

    sidebar.classList.remove(
        "menu-open"
    );


    sidebarOverlay.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "menu-open"
    );

}



btnAbrirMenu.addEventListener(
    "click",
    abrirMenu
);


btnCerrarMenu.addEventListener(
    "click",
    cerrarMenu
);


sidebarOverlay.addEventListener(
    "click",
    cerrarMenu
);



// ------------------------------------------------------
// Cerrar sesión
// ------------------------------------------------------

const btnCerrarSesion =
    document.getElementById(
        "btn-cerrar-sesion"
    );



btnCerrarSesion.addEventListener(

    "click",

    function() {


        Swal.fire({

            title:
                "¿Cerrar sesión?",

            text:
                "Tendrás que iniciar sesión nuevamente para acceder al sistema.",

            icon:
                "warning",

            showCancelButton:
                true,

            confirmButtonText:
                "Sí, cerrar sesión",

            cancelButtonText:
                "Cancelar",

            reverseButtons:
                true


        }).then(
            function(resultado) {


                if (
                    resultado.isConfirmed
                ) {


                    localStorage.removeItem(
                        CLAVE_USUARIO
                    );


                    window.location.href =
                        "login.html";

                }


            }
        );

    }

);



// ------------------------------------------------------
// Inicialización
// ------------------------------------------------------

document.addEventListener(

    "DOMContentLoaded",

    function() {


        if (
            window.Permisos &&
            !Permisos.verificarSesion()
        ) {

            return;
        }


        verificarSesion();


        mostrarUsuario();


        aplicarTemaGuardado();


        listarClientes();


    }

);