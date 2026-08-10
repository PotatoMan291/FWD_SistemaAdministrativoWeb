# NEXUS — Sistema Administrativo Web

## Descripción

**NEXUS** es un sistema administrativo web orientado a la gestión y comercialización de productos tecnológicos y de gaming. El proyecto integra un **panel administrativo**, una **tienda virtual** y distintas herramientas para gestionar clientes, productos, proveedores, categorías, pedidos, usuarios, roles y permisos.

El sistema fue desarrollado como un proyecto académico enfocado en la aplicación de conceptos de **desarrollo web frontend, administración de información, control de acceso y experiencia de usuario**, utilizando principalmente HTML, CSS, JavaScript y Git.

Además del módulo administrativo, NEXUS incorpora una tienda interactiva donde los clientes pueden explorar productos, filtrar el catálogo, utilizar un carrito de compras, comparar artículos y construir configuraciones de PC mediante un **PC Builder** con validaciones de compatibilidad.

## Funcionalidades principales

* Sistema de inicio de sesión y registro de clientes.
* Gestión de sesiones y control de acceso.
* Roles de **Administrador, Operador y Cliente**.
* Sistema de permisos según el rol del usuario.
* Dashboard administrativo con resumen de información.
* Gestión CRUD de clientes.
* Gestión CRUD de productos.
* Gestión de proveedores.
* Gestión de categorías.
* Gestión y seguimiento de pedidos.
* Administración de roles y permisos.
* Tienda virtual de tecnología y gaming.
* Catálogo con búsqueda, filtros y categorías.
* Carrito de compras.
* Comparador de productos.
* Control y visualización de stock.
* Manejo de precios en colones costarricenses (CRC).
* Importación de información mediante archivos CSV.
* Exportación de información y reportes en PDF.
* Persistencia de información mediante `localStorage`.
* PC Builder para creación de computadoras por componentes.
* Validación de compatibilidad entre componentes.
* Cálculo aproximado de consumo energético y fuente recomendada.
* Integración con **Google Gemini API** mediante NEXUS AI.
* Recomendaciones de productos basadas en el inventario disponible.

## NEXUS AI

El proyecto incorpora un pequeño servidor desarrollado con **Node.js** que funciona como intermediario entre la tienda y la API de Google Gemini.

NEXUS AI puede utilizar información del inventario actual para:

* Recomendar productos.
* Comparar componentes.
* Explicar conceptos de hardware.
* Orientar al usuario según su presupuesto.
* Ayudar a crear una computadora.
* Analizar componentes seleccionados en el PC Builder.
* Consultar productos disponibles, precios y stock.
* Considerar productos agregados al carrito o comparador.

Para proteger la API Key, las solicitudes a Gemini son gestionadas desde el servidor local y no directamente desde el navegador.

## Tienda NEXUS

La tienda proporciona una experiencia de compra enfocada en productos tecnológicos como:

* Procesadores.
* Tarjetas gráficas.
* Placas madre.
* Memoria RAM.
* Almacenamiento.
* Fuentes de poder.
* Refrigeración.
* Gabinetes.
* Monitores.
* Teclados.
* Mouse.
* Audífonos.
* Laptops.
* Consolas y dispositivos portátiles.
* Equipamiento de redes.

Los productos pueden consultarse desde el catálogo, agregarse al carrito y compararse antes de realizar un pedido.

## PC Builder

NEXUS incluye una herramienta interactiva para construir una PC utilizando los productos disponibles dentro del inventario.

El configurador permite seleccionar diferentes componentes y comprobar determinadas relaciones de compatibilidad. También calcula información como:

* Componentes seleccionados.
* Precio total de la configuración.
* Consumo energético estimado.
* Potencia recomendada para la fuente de poder.
* Advertencias de compatibilidad.
* Presupuesto disponible.

Una configuración compatible puede posteriormente agregarse al carrito.

## Roles del sistema

### Administrador

Posee acceso completo al sistema administrativo, incluyendo operaciones CRUD, gestión de pedidos, usuarios, roles y permisos.

### Operador

Puede consultar, crear y editar información administrativa, pero posee restricciones sobre acciones sensibles como eliminación de registros o administración de roles.

### Cliente

Tiene acceso principalmente a la tienda NEXUS y a las funcionalidades orientadas a compra y consulta de productos.

## Tecnologías utilizadas

* **HTML5**
* **CSS3**
* **JavaScript**
* **React** para la interfaz de acceso y registro.
* **Node.js**
* **LocalStorage**
* **Google Gemini API**
* **CSV**
* Generación de **PDF**
* Diseño web responsive.

El servidor de NEXUS AI utiliza únicamente módulos nativos de Node.js, por lo que no requiere dependencias adicionales para funcionar.

## Estructura general

```text
FWD_SistemaAdministrativoWeb/
│
├── csv/
│   └── Datos para productos, categorías y proveedores
│
├── pages/
│   ├── login.html
│   ├── dashboard.html
│   ├── clientes.html
│   ├── productos.html
│   ├── proveedores.html
│   ├── categorias.html
│   ├── pedidos.html
│   ├── roles.html
│   └── tienda.html
│
├── server/
│   ├── server.js
│   └── .env.example
│
├── src/
│   ├── css/
│   ├── imgs/
│   └── js/
│       ├── backend/
│       ├── frontend/
│       └── login/
│
├── package.json
├── INICIAR_NEXUS_AI.bat
└── README.md
```

## Ejecución del proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/PotatoMan291/FWD_SistemaAdministrativoWeb.git
```

### 2. Ingresar al proyecto

```bash
cd FWD_SistemaAdministrativoWeb
```

### 3. Configurar NEXUS AI

Dentro de:

```text
server/
```

crear un archivo:

```text
.env
```

tomando como referencia:

```text
.env.example
```

Configurar:

```env
GEMINI_API_KEY=TU_API_KEY
GEMINI_MODEL=gemini-3.5-flash
PORT=3000
```

> La API Key no debe publicarse ni almacenarse directamente dentro del código fuente.

### 4. Iniciar el servidor

El proyecto requiere **Node.js 18 o superior**.

Ejecutar:

```bash
npm start
```

Para desarrollo también puede utilizarse:

```bash
npm run dev
```

El servidor de NEXUS AI se ejecutará de forma predeterminada en el puerto:

```text
3000
```

También puede utilizarse el archivo:

```text
INICIAR_NEXUS_AI.bat
```

en sistemas Windows.

## Credenciales iniciales

El sistema genera una cuenta administrativa predeterminada para facilitar las pruebas locales:

```text
Usuario: admin
Contraseña: admin
```

> Estas credenciales están destinadas únicamente al entorno académico y de desarrollo.

## Persistencia de datos

Actualmente gran parte de la información del sistema es almacenada utilizando **LocalStorage** del navegador.

Entre los datos almacenados se encuentran:

* Usuarios.
* Clientes.
* Productos.
* Proveedores.
* Categorías.
* Pedidos.
* Roles.
* Permisos.
* Carrito.
* Comparador.
* Configuraciones del PC Builder.

Por este motivo, el proyecto está orientado principalmente a fines académicos y demostrativos y no debe considerarse una implementación de producción sin incorporar una base de datos y mecanismos adicionales de seguridad.

## Objetivo del proyecto

El objetivo de NEXUS es desarrollar una plataforma web que combine herramientas administrativas y de comercio electrónico dentro de una misma solución, permitiendo aplicar conocimientos relacionados con:

* Desarrollo frontend.
* JavaScript.
* Manejo del DOM.
* Persistencia de datos.
* Autenticación.
* Roles y permisos.
* Operaciones CRUD.
* Gestión de inventarios.
* Experiencia de usuario.
* Comercio electrónico.
* Integración de APIs.
* Inteligencia artificial aplicada a aplicaciones web.

## Contexto

Proyecto desarrollado con fines académicos como parte del aprendizaje y aplicación de conceptos relacionados con desarrollo web y sistemas administrativos en Forward Costa Rica.
