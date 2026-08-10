// ======================================================
// ADMINISTRACIÓN DE PROVEEDORES
// LocalStorage: "proveedores"
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

const resumenTotalProveedores =
    document.getElementById("resumen-total-proveedores");

const resumenEmpresas =
    document.getElementById("resumen-empresas");

const resumenConProductos =
    document.getElementById("resumen-con-productos");

const resumenProductosAsociados =
    document.getElementById("resumen-productos-asociados");


// ------------------------------------------------------
// Utilidades de seguridad y almacenamiento
// ------------------------------------------------------
let advertenciaStorageMostrada = false;

function mostrarToast(
    mensaje,
    icono = "success"
) {

    if (window.Swal) {

        Swal.fire({
            toast: true,
            position: "top-end",
            icon: icono,
            title: mensaje,
            showConfirmButton: false,
            timer: 2200,
            timerProgressBar: true
        });

        return;
    }

    console.log(mensaje);
}


function avisarProblemaStorage(mensaje) {

    if (advertenciaStorageMostrada) {
        return;
    }

    advertenciaStorageMostrada = true;

    if (window.Swal) {

        Swal.fire({
            title: "Problema con el almacenamiento",
            text: mensaje,
            icon: "error",
            confirmButtonText: "Entendido"
        });

    } else {

        console.error(mensaje);
    }
}


function leerTextoLocalStorage(clave) {

    try {

        return localStorage.getItem(clave);

    } catch (error) {

        console.error(
            "No se pudo leer LocalStorage:",
            error
        );

        avisarProblemaStorage(
            "El navegador no permite acceder a LocalStorage. Los cambios no podrán persistirse."
        );

        return null;
    }
}


function leerListaLocalStorage(clave) {

    const datos =
        leerTextoLocalStorage(clave);

    if (!datos) {
        return [];
    }

    try {

        const lista = JSON.parse(datos);

        if (!Array.isArray(lista)) {

            throw new Error(
                "El contenido almacenado no es una lista."
            );
        }

        return lista.filter(
            function(item) {

                return (
                    item &&
                    typeof item === "object"
                );
            }
        );

    } catch (error) {

        console.error(
            "Datos inválidos en " + clave + ":",
            error
        );

        // Conservar una copia antes de recuperar la aplicación.
        try {

            const claveBackup =
                clave +
                "_backup_corrupto_" +
                Date.now();

            localStorage.setItem(
                claveBackup,
                datos
            );

            localStorage.setItem(
                clave,
                "[]"
            );

        } catch (errorBackup) {

            console.error(
                "No fue posible crear el respaldo:",
                errorBackup
            );
        }

        avisarProblemaStorage(
            "Se detectaron datos dañados. Se creó un respaldo y el módulo se recuperó para evitar que la página falle."
        );

        return [];
    }
}


function guardarListaLocalStorage(
    clave,
    lista
) {

    try {

        localStorage.setItem(
            clave,
            JSON.stringify(lista)
        );

        return true;

    } catch (error) {

        console.error(
            "No se pudo guardar LocalStorage:",
            error
        );

        avisarProblemaStorage(
            "No fue posible guardar los cambios. Revise el espacio disponible o los permisos del navegador."
        );

        return false;
    }
}


function leerPreferenciaSegura(
    clave,
    valorPorDefecto = ""
) {

    const valor =
        leerTextoLocalStorage(clave);

    return (
        valor === null ||
        valor === ""
    )
        ? valorPorDefecto
        : valor;
}


function guardarPreferenciaSegura(
    clave,
    valor
) {

    try {

        localStorage.setItem(
            clave,
            String(valor)
        );

        return true;

    } catch (error) {

        console.warn(
            "No se pudo guardar la preferencia " + clave,
            error
        );

        return false;
    }
}


function generarIdSeguro() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}


function normalizarTextoComparacion(texto) {

    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}


function textoSeguro(
    valor,
    maximo = 250
) {

    return String(valor ?? "")
        .trim()
        .slice(0, maximo);
}


function numeroSeguro(
    valor,
    valorPorDefecto = 0
) {

    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : valorPorDefecto;
}


function normalizarProductoGuardado(producto) {

    return {
        id: textoSeguro(producto.id, 100),
        nombre: textoSeguro(producto.nombre, 120),
        categoriaId: textoSeguro(producto.categoriaId, 100),
        categoria: textoSeguro(producto.categoria, 80),
        precio: numeroSeguro(producto.precio, 0),
        stock: numeroSeguro(producto.stock, 0),
        proveedorId: textoSeguro(producto.proveedorId, 100)
    };
}


function normalizarProveedorGuardado(proveedor) {

    return {
        id: textoSeguro(proveedor.id, 100),
        nombre: textoSeguro(proveedor.nombre, 100),
        empresa: textoSeguro(proveedor.empresa, 100),
        telefono: textoSeguro(proveedor.telefono, 25),
        correo: textoSeguro(proveedor.correo, 150)
            .toLowerCase(),
        direccion: textoSeguro(proveedor.direccion, 200)
    };
}


function normalizarCategoriaGuardada(categoria) {

    return {
        id: textoSeguro(categoria.id, 100),
        nombre: textoSeguro(categoria.nombre, 80),
        descripcion: textoSeguro(categoria.descripcion, 250)
    };
}


function textoSeguroGrafico(
    valor,
    maximo = 60
) {

    return String(valor ?? "")
        .replace(/[<>]/g, "")
        .trim()
        .slice(0, maximo);
}


// ------------------------------------------------------
// Leer proveedores desde LocalStorage
// ------------------------------------------------------
function obtenerProveedores() {

    return leerListaLocalStorage(
        CLAVE_PROVEEDORES
    )
        .map(normalizarProveedorGuardado)
        .filter(function(proveedor) {

            return (
                proveedor.id !== "" &&
                proveedor.nombre !== ""
            );
        });
}


// ------------------------------------------------------
// Guardar proveedores en LocalStorage
// ------------------------------------------------------
function guardarProveedores(proveedores) {

    return guardarListaLocalStorage(
        CLAVE_PROVEEDORES,
        proveedores
    );
}


// ------------------------------------------------------
// Obtener productos relacionados
// ------------------------------------------------------
function obtenerProductos() {

    return leerListaLocalStorage(
        "productos"
    )
        .map(normalizarProductoGuardado)
        .filter(function(producto) {

            return (
                producto.id !== "" &&
                producto.nombre !== ""
            );
        });
}


// ------------------------------------------------------
// Actualizar tarjetas de resumen
// ------------------------------------------------------
function actualizarResumenProveedores(
    proveedores = obtenerProveedores(),
    productos = obtenerProductos()
) {

    const empresas = new Set();

    proveedores.forEach(function(proveedor) {
        const empresa = proveedor.empresa.trim().toLowerCase();
        if (empresa !== "") {
            empresas.add(empresa);
        }
    });

    const proveedoresConProductosIds = new Set(
        productos
            .map(function(producto) {
                return String(producto.proveedorId || "");
            })
            .filter(Boolean)
    );

    let proveedoresConProductos = 0;

    proveedores.forEach(function(proveedor) {
        if (proveedoresConProductosIds.has(String(proveedor.id))) {
            proveedoresConProductos++;
        }
    });

    resumenTotalProveedores.textContent = proveedores.length;
    resumenEmpresas.textContent = empresas.size;
    resumenConProductos.textContent = proveedoresConProductos;
    resumenProductosAsociados.textContent = productos.length;
}


// ------------------------------------------------------
// Crear botón de acción
// ------------------------------------------------------
function crearBoton(
    titulo,
    clase,
    icono,
    idProveedor,
    accion
) {

    const boton =
        document.createElement(
            "button"
        );

    boton.type = "button";
    boton.className = clase;
    boton.title = titulo;
    boton.setAttribute(
        "aria-label",
        titulo
    );

    const iconoElemento =
        document.createElement("i");

    iconoElemento.className =
        icono;

    boton.appendChild(
        iconoElemento
    );

    boton.addEventListener(
        "click",
        function() {

            accion(idProveedor);
        }
    );

    return boton;
}


// ------------------------------------------------------
// Mostrar proveedores
// ------------------------------------------------------
function mostrarProveedores(listaProveedores) {

    const proveedores = listaProveedores || obtenerProveedores();
    const todosProveedores = listaProveedores
        ? obtenerProveedores()
        : proveedores;

    // Leemos los productos una sola vez para el resumen.
    const productos = obtenerProductos();

    tablaProveedoresBody.textContent = "";

    if (proveedores.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.className = "empty-state";
        celda.innerHTML =
            '<i class="bi bi-person-x"></i>' +
            '<strong>No hay proveedores para mostrar</strong>' +
            '<div class="small mt-1">Registra un proveedor o cambia el criterio de búsqueda.</div>';

        fila.appendChild(celda);
        tablaProveedoresBody.appendChild(fila);
        actualizarResumenProveedores(todosProveedores, productos);
        return;
    }

    const fragmento = document.createDocumentFragment();

    proveedores.forEach(function(proveedor) {
        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.className = "id-chip";
        celdaId.textContent = proveedor.id;

        const celdaNombre = document.createElement("td");
        const nombreWrapper = document.createElement("div");
        nombreWrapper.className = "d-flex align-items-center gap-2";

        const avatar = document.createElement("span");
        avatar.className = "provider-avatar";
        avatar.innerHTML = '<i class="bi bi-person"></i>';

        const datosNombre = document.createElement("div");
        const nombre = document.createElement("div");
        nombre.className = "table-primary-text";
        nombre.textContent = proveedor.nombre;

        const subtitulo = document.createElement("span");
        subtitulo.className = "table-secondary-text";
        subtitulo.textContent = "Proveedor registrado";

        datosNombre.appendChild(nombre);
        datosNombre.appendChild(subtitulo);
        nombreWrapper.appendChild(avatar);
        nombreWrapper.appendChild(datosNombre);
        celdaNombre.appendChild(nombreWrapper);

        const celdaEmpresa = document.createElement("td");
        const empresaBadge = document.createElement("span");
        empresaBadge.className = "badge border text-body category-badge";
        empresaBadge.textContent = proveedor.empresa;
        celdaEmpresa.appendChild(empresaBadge);

        const celdaTelefono = document.createElement("td");
        celdaTelefono.innerHTML =
            '<i class="bi bi-telephone me-2 text-body-secondary"></i>';
        celdaTelefono.append(proveedor.telefono);

        const celdaCorreo = document.createElement("td");

        if (correoValido(proveedor.correo)) {
            const enlaceCorreo = document.createElement("a");
            enlaceCorreo.href = "mailto:" + proveedor.correo;
            enlaceCorreo.className = "text-decoration-none";
            enlaceCorreo.textContent = proveedor.correo;
            celdaCorreo.appendChild(enlaceCorreo);
        } else {
            celdaCorreo.textContent = proveedor.correo || "Correo no disponible";
        }

        const celdaDireccion = document.createElement("td");
        celdaDireccion.textContent = proveedor.direccion;

        const celdaAcciones = document.createElement("td");
        const grupoAcciones = document.createElement("div");
        grupoAcciones.className = "action-group";

        grupoAcciones.appendChild(
            crearBoton(
                "Editar proveedor",
                "btn btn-outline-primary btn-action",
                "bi bi-pencil",
                proveedor.id,
                editarProveedor
            )
        );

        grupoAcciones.appendChild(
            crearBoton(
                "Eliminar proveedor",
                "btn btn-outline-danger btn-action",
                "bi bi-trash3",
                proveedor.id,
                eliminarProveedor
            )
        );

        celdaAcciones.appendChild(grupoAcciones);
        fila.appendChild(celdaId);
        fila.appendChild(celdaNombre);
        fila.appendChild(celdaEmpresa);
        fila.appendChild(celdaTelefono);
        fila.appendChild(celdaCorreo);
        fila.appendChild(celdaDireccion);
        fila.appendChild(celdaAcciones);
        fragmento.appendChild(fila);
    });

    tablaProveedoresBody.appendChild(fragmento);
    actualizarResumenProveedores(todosProveedores, productos);
}


// ------------------------------------------------------
// Validar correo
// ------------------------------------------------------
function correoValido(correo) {

    const patron =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return (
        correo.length <= 150 &&
        patron.test(correo)
    );
}


function telefonoValido(telefono) {

    const digitos =
        normalizarTelefonoProveedor(
            telefono
        );

    return (
        digitos.length >= 8 &&
        digitos.length <= 15
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

    if (
        nombre.length > 100 ||
        empresa.length > 100
    ) {

        mensajeProveedor.textContent =
            "El nombre y la empresa no pueden superar 100 caracteres.";

        return false;
    }

    if (direccion.length > 200) {

        mensajeProveedor.textContent =
            "La dirección no puede superar 200 caracteres.";

        return false;
    }

    if (!telefonoValido(telefono)) {

        mensajeProveedor.textContent =
            "Ingrese un teléfono válido de 8 a 15 dígitos.";

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
// Normalizar datos para detectar duplicados
// ------------------------------------------------------
function normalizarTextoProveedor(texto) {

    return normalizarTextoComparacion(
        texto
    );
}


function normalizarTelefonoProveedor(telefono) {

    let digitos =
        String(telefono || "")
            .replace(/\D/g, "");

    // Normalizar formatos equivalentes con prefijo internacional 506.
    // Ej.: 8888-8888 y +506 8888-8888 se consideran el mismo número.
    if (
        digitos.length === 11 &&
        digitos.startsWith("506")
    ) {

        digitos = digitos.slice(3);
    }

    if (
        digitos.length === 13 &&
        digitos.startsWith("00506")
    ) {

        digitos = digitos.slice(5);
    }

    return digitos;
}


// ------------------------------------------------------
// Buscar un proveedor que choque con los datos ingresados
// ------------------------------------------------------
function buscarProveedorDuplicado(
    proveedores,
    idActual,
    nombre,
    empresa,
    telefono,
    correo
) {

    const nombreNormalizado =
        normalizarTextoProveedor(nombre);

    const empresaNormalizada =
        normalizarTextoProveedor(empresa);

    const telefonoNormalizado =
        normalizarTelefonoProveedor(telefono);

    const correoNormalizado =
        normalizarTextoProveedor(correo);

    return proveedores.find(
        function(proveedor) {

            // Al editar, no comparar contra el mismo registro.
            if (
                String(proveedor.id) ===
                String(idActual)
            ) {

                return false;
            }

            const mismoCorreo =
                normalizarTextoProveedor(
                    proveedor.correo
                ) === correoNormalizado;

            const mismoTelefono =
                normalizarTelefonoProveedor(
                    proveedor.telefono
                ) === telefonoNormalizado;

            const mismaPersonaEmpresa =
                normalizarTextoProveedor(
                    proveedor.nombre
                ) === nombreNormalizado &&
                normalizarTextoProveedor(
                    proveedor.empresa
                ) === empresaNormalizada;

            return (
                mismoCorreo ||
                mismoTelefono ||
                mismaPersonaEmpresa
            );
        }
    );
}


function obtenerMotivoProveedorDuplicado(
    proveedorDuplicado,
    nombre,
    empresa,
    telefono,
    correo
) {

    if (
        normalizarTextoProveedor(
            proveedorDuplicado.correo
        ) ===
        normalizarTextoProveedor(correo)
    ) {

        return "Ya existe un proveedor con ese correo electrónico.";
    }

    if (
        normalizarTelefonoProveedor(
            proveedorDuplicado.telefono
        ) ===
        normalizarTelefonoProveedor(telefono)
    ) {

        return "Ya existe un proveedor con ese número de teléfono.";
    }

    if (
        normalizarTextoProveedor(
            proveedorDuplicado.nombre
        ) ===
        normalizarTextoProveedor(nombre) &&
        normalizarTextoProveedor(
            proveedorDuplicado.empresa
        ) ===
        normalizarTextoProveedor(empresa)
    ) {

        return "Ya existe este proveedor registrado para la misma empresa.";
    }

    return "Ya existe un proveedor con las mismas credenciales.";
}


// ------------------------------------------------------
// Registrar o actualizar proveedor
// ------------------------------------------------------
formProveedor.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const permisoIdActual =
            proveedorId.value;

        if (
            window.Permisos &&
            !Permisos.exigir(
                permisoIdActual === ""
                    ? "crear"
                    : "editar"
            )
        ) {
            return;
        }

        const id =
            proveedorId.value;

        const nombre =
            proveedorNombre.value.trim();

        const empresa =
            proveedorEmpresa.value.trim();

        const telefono =
            proveedorTelefono.value.trim();

        const correo =
            proveedorCorreo.value
                .trim()
                .toLowerCase();

        const direccion =
            proveedorDireccion.value.trim();

        if (
            !validarProveedor(
                nombre,
                empresa,
                telefono,
                correo,
                direccion
            )
        ) {

            return;
        }

        let proveedores =
            obtenerProveedores();

        const proveedorDuplicado =
            buscarProveedorDuplicado(
                proveedores,
                id,
                nombre,
                empresa,
                telefono,
                correo
            );

        if (proveedorDuplicado) {

            mensajeProveedor.textContent =
                obtenerMotivoProveedorDuplicado(
                    proveedorDuplicado,
                    nombre,
                    empresa,
                    telefono,
                    correo
                );

            Swal.fire({
                title: "Proveedor duplicado",
                text: mensajeProveedor.textContent,
                icon: "warning",
                confirmButtonText: "Entendido"
            });

            return;
        }

        // Registrar
        if (id === "") {

            const nuevoProveedor = {

                id: generarIdSeguro(),
                nombre: nombre,
                empresa: empresa,
                telefono: telefono,
                correo: correo,
                direccion: direccion
            };

            proveedores.push(
                nuevoProveedor
            );

            if (!guardarProveedores(
                proveedores
            )) {
                return;
            }

            limpiarFormularioProveedor();
            mostrarProveedores();

            mostrarToast("Proveedor registrado correctamente.", "success");

            return;
        }

        // Editar
        Swal.fire({

            title: "¿Desea guardar los cambios?",

            text: "Se actualizará la información del proveedor.",

            icon: "question",

            showDenyButton: true,

            showCancelButton: true,

            confirmButtonText: "Guardar",

            denyButtonText: "No guardar",

            cancelButtonText: "Cancelar"

        }).then(function(result) {

            if (result.isConfirmed) {

                proveedores =
                    proveedores.map(
                        function(proveedor) {

                            if (
                                String(proveedor.id) ===
                                String(id)
                            ) {

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
                        }
                    );

                if (!guardarProveedores(
                    proveedores
                )) {
                    return;
                }

                limpiarFormularioProveedor();
                mostrarProveedores();

                mostrarToast("Cambios del proveedor guardados.", "success");

            } else if (result.isDenied) {

                Swal.fire(
                    "Cambios no guardados",
                    "Los cambios del proveedor no se guardaron.",
                    "info"
                );
            }
        });
    }
);


// ------------------------------------------------------
// Cargar proveedor para editar
// ------------------------------------------------------
function editarProveedor(id) {

    if (
        window.Permisos &&
        !Permisos.exigir("editar")
    ) {
        return;
    }

    const proveedores =
        obtenerProveedores();

    const proveedorEncontrado =
        proveedores.find(
            function(proveedor) {

                return (
                    String(proveedor.id) ===
                    String(id)
                );
            }
        );

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

    btnGuardarProveedor.innerHTML =
        '<i class="bi bi-check2-circle me-1"></i> Actualizar Proveedor';

    btnCancelarProveedor.style.display =
        "inline-block";

    document
        .getElementById("formulario-proveedores")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


// ------------------------------------------------------
// Eliminar proveedor
// ------------------------------------------------------
function eliminarProveedor(id) {

    if (
        window.Permisos &&
        !Permisos.exigir("eliminar")
    ) {
        return;
    }

    const productos =
        obtenerProductos();

    const relacionados =
        productos.filter(
            function(producto) {

                return (
                    String(producto.proveedorId) ===
                    String(id)
                );
            }
        );

    // Mantener integridad referencial: un proveedor en uso
    // no se elimina mientras existan productos asociados.
    if (relacionados.length > 0) {

        Swal.fire({
            title: "Proveedor en uso",
            text:
                "No puede eliminar este proveedor porque tiene " +
                relacionados.length +
                " producto(s) asociado(s). Reasigne o elimine esos productos primero.",
            icon: "warning",
            confirmButtonText: "Entendido"
        });

        return;
    }

    Swal.fire({

        title: "¿Está seguro?",
        text: "¡No podrá revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d93737",
        cancelButtonColor: "#6b7785",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"

    }).then(function(result) {

        if (result.isConfirmed) {

            let proveedores =
                obtenerProveedores();

            proveedores =
                proveedores.filter(
                    function(proveedor) {

                        return (
                            String(proveedor.id) !==
                            String(id)
                        );
                    }
                );

            if (!guardarProveedores(
                proveedores
            )) {
                return;
            }

            if (
                String(proveedorId.value) ===
                String(id)
            ) {
                limpiarFormularioProveedor();
            }

            mostrarProveedores();

            mostrarToast(
                "Proveedor eliminado.",
                "success"
            );
        }
    });
}


// ------------------------------------------------------
// Limpiar formulario
// ------------------------------------------------------
function limpiarFormularioProveedor() {

    formProveedor.reset();

    proveedorId.value = "";

    btnGuardarProveedor.innerHTML =
        '<i class="bi bi-floppy me-1"></i> Guardar Proveedor';

    btnCancelarProveedor.style.display =
        "none";

    mensajeProveedor.textContent =
        "";
}


// ------------------------------------------------------
// Cancelar edición
// ------------------------------------------------------
btnCancelarProveedor.addEventListener(
    "click",
    function() {

        limpiarFormularioProveedor();
    }
);


// ------------------------------------------------------
// Buscar proveedores
// ------------------------------------------------------
buscadorProveedor.addEventListener(
    "input",
    function(event) {

        const texto =
            event.target.value
                .toLowerCase()
                .trim();

        const proveedores =
            obtenerProveedores();

        const proveedoresFiltrados =
            proveedores.filter(
                function(proveedor) {

                    return (
                        String(proveedor.nombre || "")
                            .toLowerCase()
                            .includes(texto) ||
                        String(proveedor.empresa || "")
                            .toLowerCase()
                            .includes(texto) ||
                        String(proveedor.telefono || "")
                            .toLowerCase()
                            .includes(texto) ||
                        String(proveedor.correo || "")
                            .toLowerCase()
                            .includes(texto) ||
                        String(proveedor.direccion || "")
                            .toLowerCase()
                            .includes(texto)
                    );
                }
            );

        mostrarProveedores(
            proveedoresFiltrados
        );
    }
);


// ------------------------------------------------------
// Modo oscuro con CoreUI
// ------------------------------------------------------
const btnModoOscuro =
    document.getElementById(
        "btn-modo-oscuro"
    );

function actualizarBotonTema(esOscuro) {

    if (esOscuro) {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-sun"></i><span>Modo claro</span>';

    } else {

        btnModoOscuro.innerHTML =
            '<i class="bi bi-moon-stars"></i><span>Modo oscuro</span>';
    }
}

function aplicarTemaGuardado() {

    const esOscuro =
        leerPreferenciaSegura(
            "modo_oscuro",
            "false"
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

        guardarPreferenciaSegura(
            "modo_oscuro",
            esOscuro
        );

        actualizarBotonTema(
            esOscuro
        );
    }
);


// ------------------------------------------------------
// Menú lateral responsive
// ------------------------------------------------------
const sidebar =
    document.getElementById("sidebar");

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




(function () {
    "use strict";

// ------------------------------------------------------
// Importación masiva de proveedores desde CSV
// ------------------------------------------------------
const btnImportarProveedoresCSV = document.getElementById("btn-importar-proveedores");
const inputImportarProveedoresCSV = document.getElementById("input-importar-proveedores");


function construirDetalleImportacionCSV(archivo, total, validos, duplicados, errores, advertencias, detalles) {
    let texto =
        "Archivo: " + archivo.name + "\n\n" +
        "Filas encontradas: " + total + "\n" +
        "Registros válidos: " + validos + "\n" +
        "Duplicados omitidos: " + duplicados + "\n" +
        "Filas con error: " + errores + "\n" +
        "Advertencias: " + advertencias;

    if (detalles.length > 0) {
        texto += "\n\nPrimeros detalles:\n" + detalles.slice(0, 5).join("\n");
    }

    return texto;
}

async function confirmarImportacionCSV(titulo, detalle, cantidad) {
    if (cantidad <= 0) {
        if (window.Swal) {
            await Swal.fire({
                title: "Nada para importar",
                text: detalle,
                icon: "warning",
                confirmButtonText: "Entendido"
            });
        } else {
            alert(detalle);
        }
        return false;
    }

    if (window.Swal) {
        const resultado = await Swal.fire({
            title: titulo,
            text: detalle,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Importar " + cantidad,
            cancelButtonText: "Cancelar",
            reverseButtons: true
        });
        return resultado.isConfirmed;
    }

    return confirm(detalle + "\n\n¿Desea continuar?");
}


async function importarProveedoresCSV(archivo) {
    if (!window.NexusCSV) {
        throw new Error("No se cargó el módulo de importación CSV.");
    }

    const texto = await NexusCSV.leerArchivo(archivo);
    const datos = NexusCSV.parsear(texto);

    const requeridas = [
        ["nombre", "contacto"],
        ["empresa", "proveedor", "fabricante"],
        ["telefono", "teléfono"],
        ["correo", "email"],
        ["direccion", "dirección"]
    ];

    const faltantes = requeridas.filter(function (alias) {
        return !NexusCSV.tieneColumna(datos.encabezados, alias);
    }).map(function (alias) {
        return alias[0];
    });

    if (faltantes.length > 0) {
        throw new Error("Faltan columnas obligatorias: " + faltantes.join(", ") + ".");
    }

    const proveedores = obtenerProveedores();
    const validos = [];
    const detalles = [];
    let duplicados = 0;
    let errores = 0;

    datos.filas.forEach(function (fila) {
        const linea = fila.__linea;
        const nombre = NexusCSV.valor(fila, ["nombre", "contacto"]).trim();
        const empresa = NexusCSV.valor(fila, ["empresa", "proveedor", "fabricante"]).trim();
        const telefono = NexusCSV.valor(fila, ["telefono", "teléfono"]).trim();
        const correo = NexusCSV.valor(fila, ["correo", "email"]).trim().toLowerCase();
        const direccion = NexusCSV.valor(fila, ["direccion", "dirección"]).trim();

        if (!nombre || !empresa || !telefono || !correo || !direccion) {
            errores++;
            detalles.push("Línea " + linea + ": todos los campos son obligatorios.");
            return;
        }

        if (nombre.length > 100 || empresa.length > 100 || direccion.length > 200) {
            errores++;
            detalles.push("Línea " + linea + ": uno de los textos excede la longitud permitida.");
            return;
        }

        if (!telefonoValido(telefono)) {
            errores++;
            detalles.push("Línea " + linea + ": teléfono inválido.");
            return;
        }

        if (!correoValido(correo)) {
            errores++;
            detalles.push("Línea " + linea + ": correo inválido.");
            return;
        }

        const duplicado = buscarProveedorDuplicado(
            proveedores.concat(validos),
            "",
            nombre,
            empresa,
            telefono,
            correo
        );

        if (duplicado) {
            duplicados++;
            return;
        }

        validos.push({
            id: generarIdSeguro(),
            nombre: nombre,
            empresa: empresa,
            telefono: telefono,
            correo: correo,
            direccion: direccion
        });
    });

    const detalle = construirDetalleImportacionCSV(
        archivo,
        datos.filas.length,
        validos.length,
        duplicados,
        errores,
        0,
        detalles
    );

    const confirmar = await confirmarImportacionCSV(
        "Importar proveedores",
        detalle,
        validos.length
    );

    if (!confirmar) return;

    if (!guardarProveedores(proveedores.concat(validos))) {
        throw new Error("No fue posible guardar los proveedores importados.");
    }

    mostrarProveedores();
    mostrarToast(validos.length + " proveedores importados correctamente.", "success");
}

if (btnImportarProveedoresCSV && inputImportarProveedoresCSV) {
    btnImportarProveedoresCSV.addEventListener("click", function () {
        inputImportarProveedoresCSV.click();
    });

    inputImportarProveedoresCSV.addEventListener("change", async function () {
        const archivo = inputImportarProveedoresCSV.files && inputImportarProveedoresCSV.files[0];
        if (!archivo) return;

        try {
            await importarProveedoresCSV(archivo);
        } catch (error) {
            console.error("Error al importar proveedores:", error);
            if (window.Swal) {
                Swal.fire({
                    title: "No se pudo importar el CSV",
                    text: error.message || "Revise el formato del archivo.",
                    icon: "error",
                    confirmButtonText: "Entendido"
                });
            } else {
                alert(error.message || "No se pudo importar el CSV.");
            }
        } finally {
            inputImportarProveedoresCSV.value = "";
        }
    });
}

})();

// ------------------------------------------------------
// Inicialización
// ------------------------------------------------------
document.addEventListener(
    "DOMContentLoaded",
    function() {

        aplicarTemaGuardado();
        mostrarProveedores();
    }
);
