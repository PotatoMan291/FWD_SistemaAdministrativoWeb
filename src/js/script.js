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

    // Validaciones básicas
    if (!nombre || !correo || !telefono) {
        alert("Todos los campos son obligatorios.");
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
    const tbody = document.getElementById("tabla-clientes-body");
    tbody.innerHTML = "";

    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay clientes registrados.</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.correo}</td>
            <td>${cliente.telefono}</td>
            <td>
                <button onclick="cargarClienteParaEditar('${cliente.id}')">Editar</button>
                <button onclick="eliminarCliente('${cliente.id}')" style="background-color: #e74c3c; color: white;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


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
    }
}


function eliminarCliente(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
        let clientes = obtenerClientes();
        clientes = clientes.filter(c => c.id !== id);
        guardarClientes(clientes);
        listarClientes();
        limpiarFormulario();
    }
}

function limpiarFormulario() {
    document.getElementById("form-cliente").reset();
    document.getElementById("cliente-id").value = "";
    document.getElementById("btn-guardar").textContent = "Guardar Cliente";
    document.getElementById("btn-cancelar").style.display = "none";
}


document.addEventListener("DOMContentLoaded", listarClientes);