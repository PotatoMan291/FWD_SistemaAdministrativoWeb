document.addEventListener('DOMContentLoaded', () => {
  verificarSeguridadAdmin();
  inicializarRolesFijos();
  cargarRolesSistema();
  cargarUsuariosYAsignarRoles();
  cargarTablaPermisos();
  document.getElementById('formRol')?.addEventListener('submit', manejarSubmitRol);
});

// ==========================================
// 1. SEGURIDAD Y CONTROL DE ACCESO
// ==========================================
function verificarSeguridadAdmin() {
  const usuario = JSON.parse(localStorage.getItem('usuarioLogueado'));
  
  

  // Muestra el nombre en el topbar si el elemento existe
  const elementoNombre = document.getElementById('nombreUsuario');
  if (elementoNombre) {
    elementoNombre.textContent = usuario.nombre;
  }
}

// ==========================================
// 2. INICIALIZAR ROLES FIJOS (Admin y Operador)
// ==========================================
function inicializarRolesFijos() {
  const rolesFijos = [
    { 
      id: "rol_admin", 
      nombre: "Administrador", 
      descripcion: "Acceso total y control absoluto de todo el sistema administrativo." 
    },
    { 
      id: "rol_operador", 
      nombre: "Operador", 
      descripcion: "Acceso limitado. Solo puede consultar registros y realizar operaciones básicas permitidas." 
    }
  ];

  // Forzamos a que siempre existan estos dos roles y ningún otro extra
  localStorage.setItem('rolesSistema', JSON.stringify(rolesFijos));
}

// ==========================================
// 3. GESTIÓN Y VISTA DE ROLES
// ==========================================
function cargarRolesSistema() {
  const roles = JSON.parse(localStorage.getItem('rolesSistema')) || [];
  const tbody = document.getElementById('tablaRolesBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  roles.forEach((rol) => {
    // Como los roles son fijos y limitados, indicamos sus permisos claramente en pantalla
    tbody.innerHTML += `
      <tr>
        <td><strong><i class="bi bi-shield-check"></i> ${rol.nombre}</strong></td>
        <td>${rol.descripcion}</td>
        <td>
          <span class="badge ${rol.nombre.toLowerCase()}" style="padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; background: ${rol.nombre === 'Administrador' ? '#f59e0b' : '#3b82f6'}; color: #fff;">
            Rol del Sistema
          </span>
        </td>
      </tr>
    `;
  });
}

// Función simulada por si en el HTML mantienes el formulario de envío (bloqueado para evitar alteraciones)
function manejarSubmitRol(e) {
  e.preventDefault();
  alert("El sistema maneja una estructura estricta de 2 roles: Administrador y Operador.");
}

// ==========================================
// 4. ASIGNACIÓN DE ROLES A USUARIOS / CLIENTES
// ==========================================
function cargarUsuariosYAsignarRoles() {
  // Busca la data de usuarios/clientes independientemente de cómo la hayas guardado
  const usuarios = JSON.parse(localStorage.getItem('clientes')) 
                || JSON.parse(localStorage.getItem('usuarios')) 
                || JSON.parse(localStorage.getItem('listaClientes')) 
                || [];
                
  const tbody = document.getElementById('tablaClientesRolesBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No hay usuarios o clientes registrados en el sistema.</td></tr>`;
    return;
  }

  usuarios.forEach((usuarioItem, index) => {
    // Opciones estáticas para asegurar que solo se elija entre Administrador u Operador
    const rolActual = usuarioItem.rolAsignado || 'Operador'; // Por defecto operador si no tiene
    
    let opcionesRoles = `
      <option value="Administrador" ${rolActual === 'Administrador' ? 'selected' : ''}>Administrador (Acceso Total)</option>
      <option value="Operador" ${rolActual === 'Operador' ? 'selected' : ''}>Operador (Acceso Limitado)</option>
    `;

    tbody.innerHTML += `
      <tr>
        <td>${usuarioItem.id || 'USR-0' + (index + 1)}</td>
        <td><strong>${usuarioItem.nombre || usuarioItem.nombres || 'Sin nombre'}</strong></td>
        <td>
          <select class="select-cambiar-rol" onchange="actualizarRolUsuario(${index}, this.value)">
            ${opcionesRoles}
          </select>
        </td>
        <td>
          <span style="color: ${rolActual === 'Administrador' ? '#d97706' : '#2563eb'}; font-weight: 600; font-size: 0.9rem;">
            ● ${rolActual === 'Administrador' ? 'Control Total' : 'Restringido'}
          </span>
        </td>
      </tr>
    `;
  });
}

function actualizarRolUsuario(usuarioIndex, nuevoRol) {
  // Actualiza en la clave principal que use tu proyecto ('clientes' o 'usuarios')
  let claveUsada = 'clientes';
  let usuarios = JSON.parse(localStorage.getItem('clientes'));
  
  if (!usuarios) {
    usuarios = JSON.parse(localStorage.getItem('usuarios')) || JSON.parse(localStorage.getItem('listaClientes')) || [];
    if (localStorage.getItem('usuarios')) claveUsada = 'usuarios';
    if (localStorage.getItem('listaClientes')) claveUsada = 'listaClientes';
  }

  if (usuarios[usuarioIndex]) {
    usuarios[usuarioIndex].rolAsignado = nuevoRol;
    localStorage.setItem(claveUsada, JSON.stringify(usuarios));
    
    // Recarga la tabla para reflejar los cambios visuales de permisos de inmediato
    cargarUsuariosYAsignarRoles();
    alert(`¡Éxito! El rol del usuario se ha actualizado a: ${nuevoRol}`);
  }
}

// ==========================================
// ASIGNACIÓN DE ROLES LEYENDO DESDE 'clientes_sistema'
// ==========================================
function cargarClientesConRoles() {
  // Lee exactamente de la clave que utilizas en tu sistema
  const clientes = JSON.parse(localStorage.getItem('clientes_sistema')) || [];
  const tbody = document.getElementById('tablaClientesRolesBody');
  
  if (!tbody) return;

  tbody.innerHTML = '';

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">No hay clientes registrados en el sistema.</td></tr>`;
    return;
  }

  clientes.forEach((cliente, index) => {
    // Si el cliente no tiene un rol asignado, por defecto le asignamos 'Operador'
    const rolActual = cliente.rolAsignado || 'Operador';
    
    // Opciones estáticas para los dos únicos roles permitidos
    let opcionesRoles = `
      <option value="Administrador" ${rolActual === 'Administrador' ? 'selected' : ''}>Administrador (Acceso Total)</option>
      <option value="Operador" ${rolActual === 'Operador' ? 'selected' : ''}>Operador (Acceso Limitado)</option>
    `;

    tbody.innerHTML += `
      <tr>
        <td>${cliente.id || 'CLI-0' + (index + 1)}</td>
        <td><strong>${cliente.nombre || cliente.nombres || 'Sin nombre'}</strong></td>
        <td>
          <select class="select-cambiar-rol" onchange="actualizarRolCliente(${index}, this.value)">
            ${opcionesRoles}
          </select>
        </td>
        <td>
          <span style="color: ${rolActual === 'Administrador' ? '#d97706' : '#2563eb'}; font-weight: 600; font-size: 0.9rem;">
            ● ${rolActual === 'Administrador' ? 'Control Total' : 'Restringido'}
          </span>
        </td>
      </tr>
    `;
  });
}

  
document.addEventListener('DOMContentLoaded', () => {
  verificarSeguridadAdmin();
  cargarRolesSistema();
  cargarClientesConRoles();
});


  const elementoNombre = document.getElementById('nombreUsuario');
  if (elementoNombre) elementoNombre.textContent = usuario.nombre;


// Carga fija de la información de roles
function cargarRolesSistema() {
  const tbody = document.getElementById('tablaRolesBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td><strong><i class="bi bi-shield-check"></i> Administrador</strong></td>
      <td>Acceso total y control absoluto de todo el sistema administrativo.</td>
      <td><span style="background: #f59e0b; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">Nivel Alto</span></td>
    </tr>
    <tr>
      <td><strong><i class="bi bi-shield"></i> Operador</strong></td>
      <td>Acceso limitado. Solo puede consultar registros y realizar operaciones básicas.</td>
      <td><span style="background: #3b82f6; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: bold;">Nivel Estándar</span></td>
    </tr>
  `;
}

// Carga TODOS los nombres de los clientes desde 'clientes_sistema'
function cargarClientesConRoles() {
  const STORAGE_KEY = "clientes_sistema";
  const clientes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const tbody = document.getElementById('tablaClientesRolesBody');
  
  if (!tbody) return;

  tbody.innerHTML = '';

  if (clientes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #64748b;">No hay clientes registrados en el sistema.</td></tr>`;
    return;
  }

  clientes.forEach((cliente, index) => {
    // Si el cliente no tiene rol asignado, le asignamos 'Operador' por defecto
    const rolActual = cliente.rolAsignado || 'Operador';
    
    // Opciones del selector
    let opcionesRoles = `
      <option value="Administrador" ${rolActual === 'Administrador' ? 'selected' : ''}>Administrador</option>
      <option value="Operador" ${rolActual === 'Operador' ? 'selected' : ''}>Operador</option>
    `;

    // Renderiza la fila con el nombre real del cliente obtenido del LocalStorage
    tbody.innerHTML += `
      <tr>
        <td>${cliente.id || 'CLI-0' + (index + 1)}</td>
        <td><strong>${cliente.nombre || cliente.nombres || 'Cliente sin nombre'}</strong></td>
        <td>
          <select class="select-cambiar-rol" onchange="actualizarRolCliente(${index}, this.value)">
            ${opcionesRoles}
          </select>
        </td>
        <td>
          <span style="color: ${rolActual === 'Administrador' ? '#d97706' : '#2563eb'}; font-weight: 600; font-size: 0.9rem;">
            ● ${rolActual}
          </span>
        </td>
      </tr>
    `;
  });
}
// Definición de las acciones o permisos disponibles en tu sistema administrativo
const permisosDisponibles = [
  { id: "ver_clientes", nombre: "Ver lista de clientes" },
  { id: "crear_clientes", nombre: "Crear y editar clientes" },
  { id: "eliminar_clientes", nombre: "Eliminar clientes" },
  { id: "ver_productos", nombre: "Gestionar inventario de productos" },
  { id: "ver_proveedores", nombre: "Consultar proveedores" },
  { id: "configurar_sistema", nombre: "Acceso total a configuración y roles" }
];

// Inicializa o carga los permisos guardados en localStorage
function inicializarPermisos() {
  let permisosGuardados = JSON.parse(localStorage.getItem('permisos_roles'));
  
  if (!permisosGuardados) {
    // Permisos por defecto iniciales
    permisosGuardados = {
      Operador: ["ver_clientes", "ver_productos", "ver_proveedores"],
      Administrador: ["ver_clientes", "crear_clientes", "eliminar_clientes", "ver_productos", "ver_proveedores", "configurar_sistema"]
    };
    localStorage.setItem('permisos_roles', JSON.stringify(permisosGuardados));
  }
  return permisosGuardados;
}

// Dibuja la tabla interactiva de permisos
function cargarTablaPermisos() {
  const tbody = document.getElementById('tablaPermisosBody');
  if (!tbody) return;

  const permisosActuales = inicializarPermisos();
  tbody.innerHTML = '';

  permisosDisponibles.forEach(permiso => {
    // Verificamos si el rol tiene este permiso activo
    const operadorChecked = permisosActuales.Operador.includes(permiso.id) ? 'checked' : '';
    // El administrador por defecto suele tener todo, pero permitimos modificarlo o fijarlo
    const adminChecked = permisosActuales.Administrador.includes(permiso.id) ? 'checked' : '';

    tbody.innerHTML += `
      <tr>
        <td><strong>${permiso.nombre}</strong></td>
        <td>
          <input type="checkbox" class="permiso-checkbox" data-rol="Operador" value="${permiso.id}" ${operadorChecked}>
        </td>
        <td>
          <input type="checkbox" class="permiso-checkbox" data-rol="Administrador" value="${permiso.id}" ${adminChecked}>
        </td>
      </tr>
    `;
  });
}

// Guarda los cambios seleccionados en el LocalStorage
function guardarPermisosSistema() {
  const checkboxes = document.querySelectorAll('.permiso-checkbox');
  
  let nuevosPermisos = {
    Operador: [],
    Administrador: []
  };

  checkboxes.forEach(chk => {
    if (chk.checked) {
      const rol = chk.getAttribute('data-rol');
      const permisoId = chk.value;
      nuevosPermisos[rol].push(permisoId);
    }
  });

  localStorage.setItem('permisos_roles', JSON.stringify(nuevosPermisos));
  alert("¡Permisos actualizados y guardados correctamente en el sistema!");
}




