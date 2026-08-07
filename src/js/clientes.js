

const STORAGE_KEY = "clientes_sistema";

// Obtener clientes del LocalStorage
function obtenerClientes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Guardar array de clientes en LocalStorage
function guardarClientes(clientes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

// 1. CREAR / ACTUALIZAR CLIENTE
document.getElementById("form-cliente").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const id = document.getElementById("cliente-id").value;
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();

    // Validaciones básicas de campos vacíos
    if (!nombre || !correo || !telefono) {
        alert("Todos los campos son obligatorios.");
        return;
    }

    // Validación: Comprobar que el teléfono contenga únicamente números
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(telefono)) {
        alert("El campo de teléfono solo debe contener números. No se permiten letras ni símbolos.");
        document.getElementById("telefono").focus();
        return;
    }

    let clientes = obtenerClientes();

    if (id === "") {
        // Crear nuevo cliente
        const nuevoCliente = {
            id: Date.now().toString(),
            nombre,
            correo,
            telefono
        };
        clientes.push(nuevoCliente);
    } else {
        // Editar cliente existente
        clientes = clientes.map(c => {
            if (c.id === id) {
                return { ...c, nombre, correo, telefono };
            }
            return c;
        });
    }

    guardarClientes(clientes);
    limpiarFormulario();
    listarClientes();
});

// 2. LISTAR CLIENTES EN LA TABLA
function listarClientes() {
    const clientes = obtenerClientes();
    renderizarTabla(clientes);
}

// Función auxiliar para renderizar la tabla
function renderizarTabla(arrayClientes) {
    const tbody = document.getElementById("tabla-clientes-body");
    tbody.innerHTML = "";

    if (arrayClientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay clientes registrados.</td></tr>`;
        return;
    }

    arrayClientes.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.correo}</td>
            <td>${cliente.telefono}</td>
            <td>
                <button class="btn-primary" onclick="cargarClienteParaEditar('${cliente.id}')">Editar</button>
                <button onclick="eliminarCliente('${cliente.id}')" style="background-color: #e74c3c; color: white;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. EDITAR CLIENTE (Cargar datos en el formulario)
function cargarClienteParaEditar(id) {
    const clientes = obtenerClientes();
    const cliente = clientes.find(c => c.id === id);

    if (cliente) {
        document.getElementById("cliente-id").value = cliente.id;
        document.getElementById("nombre").value = cliente.nombre;
        document.getElementById("correo").value = cliente.correo;
        document.getElementById("telefono").value = cliente.telefono;
        
        document.getElementById("btn-guardar").textContent = "Actualizar Cliente";
        document.getElementById("btn-cancelar").style.display = "inline-block";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 4. ELIMINAR CLIENTE CON SWEETALERT2
function eliminarCliente(id) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });

    swalWithBootstrapButtons.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, ¡eliminar!",
      cancelButtonText: "No, ¡cancelar!",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        let clientes = obtenerClientes();
        clientes = clientes.filter(c => c.id !== id);
        guardarClientes(clientes);
        listarClientes();
        limpiarFormulario();

        swalWithBootstrapButtons.fire({
          title: "¡Eliminado!",
          text: "El cliente ha sido eliminado.",
          icon: "success"
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire({
          title: "Cancelado",
          text: "Tu cliente está seguro :)",
          icon: "error"
        });
      }
    });
}

// 5. BUSCADOR EN TIEMPO REAL
document.getElementById("buscador-cliente").addEventListener("input", function(e) {
    const textoBusqueda = e.target.value.toLowerCase().trim();
    const clientes = obtenerClientes();
    
    const clientesFiltrados = clientes.filter(cliente => 
        cliente.nombre.toLowerCase().includes(textoBusqueda) ||
        cliente.correo.toLowerCase().includes(textoBusqueda) ||
        cliente.telefono.toLowerCase().includes(textoBusqueda)
    );

    renderizarTabla(clientesFiltrados);
});

// 6. GESTIÓN DE MODO OSCURO
const btnModoOscuro = document.getElementById("btn-modo-oscuro");

if (localStorage.getItem("modo_oscuro") === "true") {
    document.body.classList.add("dark-mode");
    btnModoOscuro.textContent = "☀️ Modo Claro";
}

btnModoOscuro.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const esOscuro = document.body.classList.contains("dark-mode");
    btnModoOscuro.textContent = esOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    localStorage.setItem("modo_oscuro", esOscuro);
});

// Función auxiliar para limpiar el formulario
function limpiarFormulario() {
    document.getElementById("form-cliente").reset();
    document.getElementById("cliente-id").value = "";
    document.getElementById("btn-guardar").textContent = "Guardar Cliente";
    document.getElementById("btn-cancelar").style.display = "none";
}

// Cargar la lista al iniciar la página
document.addEventListener("DOMContentLoaded", listarClientes);
