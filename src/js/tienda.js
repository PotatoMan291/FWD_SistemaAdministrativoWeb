// ======================================================
// NEXUS · tienda.js
// Lee los mismos datos del panel administrativo.
// ======================================================

const CLAVES = {
  productos: "productos",
  categorias: "categorias",
  proveedores: "proveedores",
  usuario: "usuario",
  clientes: "clientes_sistema",
  pedidos: "pedidos",
  carrito: "orbit_carrito",
  favoritos: "orbit_favoritos",
  comparador: "orbit_comparador"
};

const IMG = {
  laptop: "../src/imgs/producto-laptop.svg",
  pc: "../src/imgs/producto-pc.svg",
  monitor: "../src/imgs/producto-monitor.svg",
  headphones: "../src/imgs/producto-headphones.svg",
  gpu: "../src/imgs/producto-gpu.svg",
  keyboard: "../src/imgs/producto-keyboard.svg",
  mouse: "../src/imgs/producto-mouse.svg",
  ssd: "../src/imgs/producto-ssd.svg",
  smarthome: "../src/imgs/producto-smarthome.svg",
  default: "../src/imgs/producto-default.svg"
};

const state = {
  productos: [],
  categorias: [],
  proveedores: [],
  carrito: [],
  favoritos: [],
  comparador: [],
  search: "",
  category: "",
  brand: "",
  price: "",
  stock: "",
  gaming: "",
  sort: "relevant",
  onlyFavorites: false
};

const NEXUS_AI = {
  baseUrl: "http://localhost:3000",
  timeoutMs: 45000,
  maxHistoryItems: 10
};

const nexusAIHistory = [];
let nexusAIRequestInProgress = false;
let nexusAIHealthChecked = false;
let nexusAILastBuild = null;

// ---------- Carga progresiva del catálogo ----------
// Mantiene el catálogo compacto: 12 productos al inicio y 12 por carga.
const CATALOG_PAGE_SIZE = 12;
let catalogVisibleLimit = CATALOG_PAGE_SIZE;

// ---------- LocalStorage ----------

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("No fue posible guardar los cambios en el navegador.");
    return false;
  }
}

function safeText(value, max = 220) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearColones(value) {
  return "₡" + Math.round(safeNumber(value, 0)).toLocaleString("es-CR");
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

// ---------- Adaptación de datos existentes ----------

function categoryById(id) {
  return state.categorias.find(item => String(item.id) === String(id)) || null;
}

function supplierById(id) {
  return state.proveedores.find(item => String(item.id) === String(id)) || null;
}

function inferGaming(product) {
  const text = normalize([product.nombre, product.categoria, product.descripcion].join(" "));
  return ["gaming", "gamer", "rtx", "geforce", "radeon", "mecanico"].some(word => text.includes(word));
}

function productType(product) {
  const text = normalize(product.nombre + " " + product.categoria);
  if (text.includes("laptop") || text.includes("notebook") || text.includes("macbook")) return "laptop";
  if (text.includes("monitor") || text.includes("pantalla")) return "monitor";
  if (text.includes("audif") || text.includes("headset") || text.includes("audio")) return "headphones";
  if (text.includes("rtx") || text.includes("gpu") || text.includes("grafica") || text.includes("geforce") || text.includes("radeon")) return "gpu";
  if (text.includes("teclado") || text.includes("keyboard")) return "keyboard";
  if (text.includes("mouse") || text.includes("raton")) return "mouse";
  if (text.includes("ssd") || text.includes("nvme") || text.includes("almacenamiento") || text.includes("disco")) return "ssd";
  if (text.includes("smart") || text.includes("wifi") || text.includes("router") || text.includes("red")) return "smarthome";
  if (text.includes("pc") || text.includes("comput") || text.includes("desktop") || text.includes("case")) return "pc";
  return "default";
}

function imageFor(product) {
  const custom =
    typeof product.imagen === "string"
      ? product.imagen.trim()
      : "";

  if (
    custom.startsWith("data:image/") ||
    custom.startsWith("../src/imgs/") ||
    custom.startsWith("./") ||
    custom.startsWith("https://")
  ) {
    return custom;
  }

  return IMG[productType(product)] || IMG.default;
}

function cargarProductos() {
  state.categorias = readList(CLAVES.categorias)
    .map(c => ({
      id: safeText(c.id, 100),
      nombre: safeText(c.nombre, 80),
      descripcion: safeText(c.descripcion, 250),
      imagen:
        typeof c.imagen === "string"
          ? c.imagen.trim()
          : ""
    }))
    .filter(c => c.id && c.nombre);

  state.proveedores = readList(CLAVES.proveedores)
    .map(p => ({
      id: safeText(p.id, 100),
      nombre: safeText(p.nombre, 100),
      empresa: safeText(p.empresa, 100),
      telefono: safeText(p.telefono, 30),
      correo: safeText(p.correo, 150),
      direccion: safeText(p.direccion, 220)
    }))
    .filter(p => p.id);

  state.productos = readList(CLAVES.productos)
    .map((p, index) => {
      const category = categoryById(p.categoriaId);
      const supplier = supplierById(p.proveedorId);
      const categoria = category ? category.nombre : safeText(p.categoria || "Tecnología", 80);
      const descripcion = safeText(p.descripcion || (category ? category.descripcion : "") || categoria, 220);
      const marca = safeText(p.marca || (supplier ? (supplier.empresa || supplier.nombre) : "") || "NEXUS Select", 100);
      const product = {
        id: safeText(p.id, 100),
        nombre: safeText(p.nombre, 120),
        categoriaId: safeText(p.categoriaId, 100),
        categoria,
        precio: Math.max(0, safeNumber(p.precio, 0)),
        precioAnterior: Math.max(0, safeNumber(p.precioAnterior, 0)),
        stock: Math.max(0, Math.floor(safeNumber(p.stock, 0))),
        proveedorId: safeText(p.proveedorId, 100),
        proveedorNombre: supplier ? (supplier.empresa || supplier.nombre) : "",
        marca,
        descripcion,
        rating: Math.min(5, Math.max(0, safeNumber(p.rating, 0))),
        index,
        gaming: false,
        compatible: Boolean(p.compatible),
        imagen: ""
      };
      product.gaming = typeof p.gaming === "boolean" ? p.gaming : inferGaming(product);
      // IMPORTANTE:
      // product.imagen inicia vacío para construir el objeto normalizado.
      // Debemos pasar explícitamente la imagen original guardada en LocalStorage;
      // de lo contrario, "...product" sobrescribe p.imagen con "" y NEXUS
      // termina mostrando siempre la ilustración genérica.
      product.imagen = imageFor({
        ...product,
        imagen: p.imagen
      });
      return product;
    })
    .filter(p => p.id && p.nombre);

  state.carrito = readList(CLAVES.carrito);
  state.favoritos = readList(CLAVES.favoritos).map(String);
  state.comparador = readList(CLAVES.comparador).map(String).slice(0, 3);

  const exists = id => state.productos.some(p => String(p.id) === String(id));
  state.carrito = state.carrito.filter(item => exists(item.productoId));
  state.favoritos = state.favoritos.filter(exists);
  state.comparador = state.comparador.filter(exists);

  writeList(CLAVES.carrito, state.carrito);
  writeList(CLAVES.favoritos, state.favoritos);
  writeList(CLAVES.comparador, state.comparador);
}

// ---------- Helpers de producto ----------

function productById(id) {
  return state.productos.find(p => String(p.id) === String(id)) || null;
}

function stockInfo(product) {
  if (product.stock <= 0) return { className: "out", text: "Agotado" };
  if (product.stock <= 5) return { className: "low", text: "Últimas unidades" };
  return { className: "available", text: "En stock" };
}

function discount(product) {
  if (product.precioAnterior > product.precio && product.precioAnterior > 0) {
    return Math.round((1 - product.precio / product.precioAnterior) * 100);
  }
  return 0;
}

function monthly(product) {
  return Math.ceil(product.precio / 12);
}

function isFavorite(id) {
  return state.favoritos.includes(String(id));
}

function isCompared(id) {
  return state.comparador.includes(String(id));
}

function createEmpty(custom, selectedCategoryName = "") {
  const div = document.createElement("div");
  div.className = "empty";

  const box = document.createElement("div");
  box.className = "empty-content";

  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.innerHTML = '<svg class="icon"><use href="#i-search"></use></svg>';

  const strong = document.createElement("strong");
  const paragraph = document.createElement("p");

  if (selectedCategoryName) {
    strong.textContent = "Aún no hay productos en " + selectedCategoryName + ".";
    paragraph.textContent = "Cuando agregues productos de esta categoría desde el panel administrativo, aparecerán aquí automáticamente.";
  } else if (custom) {
    strong.textContent = "No encontramos productos con esos filtros.";
    paragraph.textContent = custom;
  } else {
    strong.textContent = "Todavía no tenemos productos disponibles.";
    paragraph.textContent = "Muy pronto encontrarás nueva tecnología en NEXUS.";
  }

  box.append(icon, strong, paragraph);

  if (selectedCategoryName || custom) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn secondary empty-action";
    button.textContent = "Ver todos los productos";

    button.addEventListener("click", function() {
      clearFilters();
    });

    box.append(button);
  }

  div.append(box);
  return div;
}

// ---------- Categorías ----------

function categoryImage(category) {
  const custom =
    category &&
    typeof category.imagen === "string"
      ? category.imagen.trim()
      : "";

  if (
    custom.startsWith("data:image/") ||
    custom.startsWith("../src/imgs/") ||
    custom.startsWith("./") ||
    custom.startsWith("https://")
  ) {
    return custom;
  }

  const text =
    normalize(
      category
        ? category.nombre
        : ""
    );

  if (text.includes("laptop") || text.includes("comput")) return IMG.laptop;
  if (text.includes("gaming") || text.includes("gamer")) return IMG.pc;
  if (text.includes("monitor")) return IMG.monitor;
  if (text.includes("audio") || text.includes("audif")) return IMG.headphones;
  if (text.includes("perifer")) return IMG.keyboard;
  if (text.includes("almacen")) return IMG.ssd;
  if (text.includes("smart") || text.includes("red")) return IMG.smarthome;

  return IMG.default;
}

function categoryVisuals() {
  // No inventamos categorías en la tienda:
  // aparecen exactamente las creadas desde Administración > Categorías.
  return state.categorias.slice();
}


function scrollToCatalogAfterCategory() {
  const target = document.getElementById("catalogo");
  if (!target) return;

  // Esperamos a que filtros y catálogo terminen de renderizar para que
  // la posición final sea estable antes de desplazarnos.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const header =
        document.querySelector(".site-header") ||
        document.querySelector("header");

      const headerHeight =
        header?.getBoundingClientRect().height || 0;

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        Math.max(18, headerHeight + 14);

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth"
      });
    });
  });
}

function selectCategoryAndShowProducts(categoryId, options = {}) {
  state.category = String(categoryId || "");

  // Si la marca anterior no pertenece a esta categoría,
  // syncFilters() la limpia automáticamente.
  syncFilters();
  renderCatalog({ resetLimit: true });

  if (options.closeMega) {
    cerrarMegaMenu();
  }

  scrollToCatalogAfterCategory();
}

function categoryDesktopColumns(total) {
  const count = Math.max(1, Number(total || 0));

  // Buscamos primero un número de columnas que divida exactamente
  // la cantidad de categorías para evitar huecos en la última fila.
  // Priorizamos entre 4 y 7 columnas para mantener tarjetas legibles.
  const exactCandidates = [6, 5, 4, 7].filter(
    columns => count >= columns && count % columns === 0
  );

  if (exactCandidates.length) {
    return exactCandidates[0];
  }

  // Si no hay división exacta, elegimos la opción con menos espacios
  // vacíos y, en empate, la más cercana a 5 columnas.
  const candidates = [4, 5, 6, 7].filter(columns => count >= columns);

  if (!candidates.length) {
    return Math.min(count, 4);
  }

  return candidates
    .map(columns => ({
      columns,
      empty: (columns - (count % columns)) % columns,
      distance: Math.abs(columns - 5)
    }))
    .sort((a, b) =>
      a.empty - b.empty ||
      a.distance - b.distance ||
      a.columns - b.columns
    )[0].columns;
}

function renderNavCategories() {
  const navContainer = document.getElementById("orbit-nav-categories");
  const megaContainer = document.getElementById("mega-category-list");

  if (navContainer) {
    navContainer.textContent = "";
  }

  if (megaContainer) {
    megaContainer.textContent = "";
  }

  state.categorias.forEach(function(category, index) {
    if (navContainer && index < 6) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nexus-dynamic-category";
      button.textContent = category.nombre;
      button.addEventListener("click", function() {
        selectCategoryAndShowProducts(category.id);
      });
      navContainer.appendChild(button);
    }

    if (megaContainer) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mega-category-item";

      const media =
        document.createElement("span");

      media.className =
        "mega-category-media";

      if (category.imagen) {
        const img =
          document.createElement("img");

        img.src =
          categoryImage(category);

        img.alt =
          "";

        media.appendChild(img);
      } else {
        media.innerHTML =
          '<svg class="icon"><use href="#i-cpu"></use></svg>';
      }

      const label =
        document.createElement("span");

      label.textContent =
        category.nombre;

      button.append(
        media,
        label
      );

      button.addEventListener("click", function() {
        selectCategoryAndShowProducts(category.id, { closeMega: true });
      });

      megaContainer.appendChild(button);
    }
  });
}


function renderCategories() {
  const grid = document.getElementById("category-grid");
  grid.textContent = "";

  const categories =
    categoryVisuals();

  grid.style.setProperty(
    "--category-desktop-columns",
    String(categoryDesktopColumns(categories.length))
  );

  if (categories.length === 0) {
    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "category-empty-state";

    empty.innerHTML =
      "<strong>Aún no hay categorías registradas.</strong>" +
      "<span>Las categorías creadas desde el panel administrativo aparecerán aquí automáticamente.</span>";

    grid.appendChild(
      empty
    );

    return;
  }

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";

    const media = document.createElement("span");
    media.className = "media";
    const img = document.createElement("img");
    img.src = categoryImage(category);
    img.alt = category.nombre;
    media.append(img);

    const name = document.createElement("strong");
    name.textContent = category.nombre;
    const explore = document.createElement("small");
    explore.textContent = "Explorar →";

    button.append(media, name, explore);
    button.addEventListener("click", () => {
      selectCategoryAndShowProducts(category.id);
    });

    grid.append(button);
  });
}

// ---------- Cards ----------

function favoriteButton(product) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite" + (isFavorite(product.id) ? " active" : "");
  button.setAttribute("aria-label", isFavorite(product.id) ? "Quitar de favoritos" : "Agregar a favoritos");
  button.setAttribute("aria-pressed", isFavorite(product.id) ? "true" : "false");
  button.innerHTML = '<svg class="icon"><use href="#i-heart"></use></svg>';
  button.addEventListener("click", event => {
    event.stopPropagation();
    toggleFavorite(product.id);
  });
  return button;
}

function productCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const media = document.createElement("div");
  media.className = "product-media";
  card.tabIndex = 0;
  card.setAttribute("aria-label", "Ver detalles de " + product.nombre);
  card.classList.add("product-card-clickable");

  const img = document.createElement("img");
  img.src = product.imagen;
  img.alt = product.nombre;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    img.src = IMG.default;
  });
  media.append(img, favoriteButton(product));

  const percent = discount(product);
  if (percent > 0) {
    const badge = document.createElement("span");
    badge.className = "discount";
    badge.textContent = "-" + percent + "%";
    media.append(badge);
  }

  const open = () => openProduct(product.id);

  card.addEventListener("click", event => {
    if (event.target.closest("button, a, input, select, textarea")) return;
    open();
  });

  card.addEventListener("keydown", event => {
    if (event.target.closest("button, a, input, select, textarea")) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });

  const brand = document.createElement("div");
  brand.className = "brand-name";
  brand.textContent = product.marca;

  const title = document.createElement("h3");
  title.textContent = product.nombre;

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = product.descripcion;

  const rating = document.createElement("div");
  rating.className = "rating";
  rating.innerHTML = product.rating > 0
    ? '<b>★★★★★</b> ' + product.rating.toFixed(1)
    : "Nuevo en NEXUS";

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatearColones(product.precio);
  priceRow.append(price);
  if (product.precioAnterior > product.precio) {
    const old = document.createElement("span");
    old.className = "old-price";
    old.textContent = formatearColones(product.precioAnterior);
    priceRow.append(old);
  }

  const finance = document.createElement("div");
  finance.className = "finance";
  finance.textContent = "Desde " + formatearColones(monthly(product)) + " al mes · 12 meses";

  const info = stockInfo(product);
  const stock = document.createElement("div");
  stock.className = "stock " + info.className;
  stock.textContent = info.text;

  const compatible = document.createElement("div");
  compatible.className = "compatible";
  const type = productType(product);
  compatible.textContent = (product.compatible || type === "gpu" || type === "ssd")
    ? "✓ Compatibilidad verificada"
    : "";

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const cart = document.createElement("button");
  cart.type = "button";
  cart.className = "add-cart";
  cart.disabled = product.stock <= 0;
  cart.textContent = product.stock <= 0 ? "Agotado" : "Agregar al carrito";
  cart.addEventListener("click", event => {
    event.stopPropagation();
    agregarAlCarrito(product.id);
  });

  const compare = document.createElement("button");
  compare.type = "button";
  compare.className = "compare-btn" + (isCompared(product.id) ? " active" : "");
  compare.setAttribute("aria-label", isCompared(product.id) ? "Quitar del comparador" : "Agregar al comparador");
  compare.setAttribute("aria-pressed", isCompared(product.id) ? "true" : "false");
  compare.innerHTML = '<svg class="icon"><use href="#i-compare"></use></svg>';
  compare.addEventListener("click", event => {
    event.stopPropagation();
    toggleCompare(product.id);
  });

  actions.append(cart, compare);
  card.append(media, brand, title, description, rating, priceRow, finance, stock, compatible, actions);
  return card;
}

function noveltyCard(product) {
  const card = document.createElement("article");
  card.className = "novelty-card";

  const media = document.createElement("button");
  media.type = "button";
  media.className = "novelty-media";
  media.setAttribute("aria-label", "Ver " + product.nombre);

  const img = document.createElement("img");
  img.src = product.imagen;
  img.alt = product.nombre;
  img.loading = "lazy";

  const badge = document.createElement("span");
  badge.className = "new-badge";
  badge.textContent = "NUEVO";

  // El badge y favoritos pertenecen al área visual de la tarjeta.
  // Así permanecen superpuestos y no ocupan espacio en el layout.
  media.append(img, badge, favoriteButton(product));
  media.addEventListener("click", () => openProduct(product.id));

  const brand = document.createElement("div");
  brand.className = "novelty-brand";
  brand.textContent = product.marca;

  const title = document.createElement("h3");
  title.textContent = product.nombre;

  const footer = document.createElement("div");
  footer.className = "novelty-footer";

  const info = document.createElement("div");
  info.className = "novelty-info";

  const price = document.createElement("strong");
  price.className = "novelty-price";
  price.textContent = formatearColones(product.precio);

  const rating = document.createElement("div");
  rating.className = "novelty-rating";
  rating.innerHTML = product.rating > 0
    ? '<b>★★★★★</b> <span>' + product.rating.toFixed(1) + '</span>'
    : '<span>Nuevo en NEXUS</span>';

  info.append(price, rating);

  const cart = document.createElement("button");
  cart.type = "button";
  cart.className = "novelty-cart-btn";
  cart.disabled = product.stock <= 0;
  cart.setAttribute(
    "aria-label",
    product.stock <= 0
      ? "Producto agotado"
      : "Agregar " + product.nombre + " al carrito"
  );
  cart.innerHTML = '<svg class="icon"><use href="#i-cart"></use></svg>';
  cart.addEventListener("click", function(event) {
    event.stopPropagation();
    agregarAlCarrito(product.id);
  });

  footer.append(info, cart);
  card.append(media, brand, title, footer);
  return card;
}

function renderNovelties() {
  const grid = document.getElementById("novelty-grid");
  grid.textContent = "";
  if (!state.productos.length) {
    grid.append(createEmpty());
    return;
  }
  state.productos.slice().reverse().slice(0, 4).forEach(product => grid.append(noveltyCard(product)));
}

// ---------- Filtros ----------

function filteredProducts() {
  let list = state.productos.slice();
  const query = normalize(state.search);

  if (query) {
    list = list.filter(p => normalize([p.nombre, p.marca, p.categoria, p.descripcion].join(" ")).includes(query));
  }

  if (state.category) {
    const filter = normalize(state.category);
    list = list.filter(p => String(p.categoriaId) === String(state.category) || normalize(p.categoria).includes(filter));
  }

  if (state.brand) list = list.filter(p => p.marca === state.brand);

  if (state.price) {
    const [min, max] = state.price.split("-").map(Number);
    list = list.filter(p => p.precio >= (min || 0) && p.precio <= (max || Number.MAX_SAFE_INTEGER));
  }

  if (state.stock === "available") list = list.filter(p => p.stock > 5);
  if (state.stock === "low") list = list.filter(p => p.stock > 0 && p.stock <= 5);
  if (state.stock === "out") list = list.filter(p => p.stock === 0);
  if (state.gaming === "gaming") list = list.filter(p => p.gaming);
  if (state.gaming === "general") list = list.filter(p => !p.gaming);
  if (state.onlyFavorites) list = list.filter(p => isFavorite(p.id));

  if (state.sort === "price-asc") list.sort((a, b) => a.precio - b.precio);
  if (state.sort === "price-desc") list.sort((a, b) => b.precio - a.precio);
  if (state.sort === "new") list.sort((a, b) => b.index - a.index);
  if (state.sort === "rating") list.sort((a, b) => b.rating - a.rating);

  return list;
}

function productosDisponiblesParaFiltroMarca() {
  if (!state.category) {
    return state.productos.slice();
  }

  const categoriaSeleccionada = state.categorias.find(
    categoria => String(categoria.id) === String(state.category)
  );

  const nombreCategoria = categoriaSeleccionada
    ? normalize(categoriaSeleccionada.nombre)
    : normalize(state.category);

  return state.productos.filter(producto => {
    return (
      String(producto.categoriaId) === String(state.category) ||
      (
        nombreCategoria &&
        normalize(producto.categoria) === nombreCategoria
      )
    );
  });
}

function actualizarOpcionesFiltroMarca() {
  const brand = document.getElementById("filter-brand");
  if (!brand) return;

  const marcasDisponibles = [
    ...new Set(
      productosDisponiblesParaFiltroMarca()
        .map(producto => String(producto.marca || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "es"));

  // Si la marca seleccionada ya no existe dentro de la nueva categoría,
  // la quitamos para no dejar un filtro invisible que produzca 0 resultados.
  if (
    state.brand &&
    !marcasDisponibles.some(marca => marca === state.brand)
  ) {
    state.brand = "";
  }

  brand.innerHTML = '<option value="">Todas</option>';

  marcasDisponibles.forEach(nombre => {
    const option = document.createElement("option");
    option.value = nombre;
    option.textContent = nombre;
    brand.append(option);
  });

  brand.value = state.brand;
}

function loadFilterOptions() {
  const category = document.getElementById("filter-category");
  category.innerHTML = '<option value="">Todas</option>';

  state.categorias.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.nombre;
    category.append(option);
  });

  actualizarOpcionesFiltroMarca();
}

function syncFilters() {
  document.getElementById("filter-category").value =
    state.categorias.some(c => String(c.id) === String(state.category)) ? state.category : "";

  // El selector de marca depende de la categoría actual.
  actualizarOpcionesFiltroMarca();

  document.getElementById("filter-brand").value = state.brand;
  document.getElementById("filter-price").value = state.price;
  document.getElementById("filter-stock").value = state.stock;
  document.getElementById("filter-gaming").value = state.gaming;
  document.getElementById("sort-products").value = state.sort;
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map(function(word) {
      return word
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : "";
    })
    .join(" ");
}


function createFilterChip(label, value, clearAction) {
  const chip = document.createElement("span");
  chip.className = "filter-chip";

  const labelNode = document.createElement("span");
  labelNode.className = "filter-chip-label";
  labelNode.textContent = label;

  const valueNode = document.createElement("span");
  valueNode.className = "filter-chip-value";
  valueNode.textContent = value;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "filter-chip-remove";
  remove.setAttribute("aria-label", "Quitar filtro " + label + " " + value);
  remove.innerHTML = '<svg class="icon"><use href="#i-close"></use></svg>';

  remove.addEventListener("click", function() {
    clearAction();
    syncFilters();
    renderCatalog({ resetLimit: true });
  });

  chip.append(labelNode, valueNode, remove);
  return chip;
}


function renderFilterChips() {
  const box = document.getElementById("active-filters");
  box.textContent = "";

  if (state.search) {
    box.append(
      createFilterChip(
        "Búsqueda:",
        state.search,
        function() {
          state.search = "";
          document.getElementById("buscador").value = "";
        }
      )
    );
  }

  if (state.category) {
    const category = state.categorias.find(
      c => String(c.id) === String(state.category)
    );

    const categoryName = category
      ? category.nombre
      : titleCase(state.category);

    box.append(
      createFilterChip(
        "Categoría:",
        categoryName,
        function() {
          state.category = "";
        }
      )
    );
  }

  if (state.brand) {
    box.append(
      createFilterChip(
        "Marca:",
        state.brand,
        function() {
          state.brand = "";
        }
      )
    );
  }

  if (state.price) {
    box.append(
      createFilterChip(
        "Precio:",
        "Rango seleccionado",
        function() {
          state.price = "";
        }
      )
    );
  }

  if (state.stock) {
    const labels = {
      available: "En stock",
      low: "Últimas unidades",
      out: "Agotado"
    };

    box.append(
      createFilterChip(
        "Disponibilidad:",
        labels[state.stock] || "Seleccionada",
        function() {
          state.stock = "";
        }
      )
    );
  }

  if (state.gaming) {
    box.append(
      createFilterChip(
        "Perfil:",
        state.gaming === "gaming" ? "Gaming" : "Tecnología general",
        function() {
          state.gaming = "";
        }
      )
    );
  }

  if (state.onlyFavorites) {
    box.append(
      createFilterChip(
        "",
        "Favoritos",
        function() {
          state.onlyFavorites = false;
        }
      )
    );
  }
}

function renderCatalogPagination(total, visible) {
  const pagination = document.getElementById("catalog-pagination");
  const count = document.getElementById("catalog-visible-count");
  const loadMore = document.getElementById("catalog-load-more");
  const viewAll = document.getElementById("catalog-view-all");
  const backTop = document.getElementById("catalog-back-top");

  if (!pagination || !count || !loadMore || !viewAll || !backTop) return;

  if (total <= 0) {
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;
  count.textContent =
    "Mostrando " +
    visible +
    " de " +
    total +
    (total === 1 ? " producto" : " productos");

  const allVisible = visible >= total;
  loadMore.hidden = allVisible;
  viewAll.hidden = allVisible;
  backTop.hidden = visible <= CATALOG_PAGE_SIZE * 2;

  if (!allVisible) {
    const remaining = Math.max(0, total - visible);
    const nextAmount = Math.min(CATALOG_PAGE_SIZE, remaining);
    loadMore.lastChild.textContent = " Ver " + nextAmount + " más";
  }
}

function resetCatalogPagination() {
  catalogVisibleLimit = CATALOG_PAGE_SIZE;
}

function loadMoreCatalogProducts() {
  const total = filteredProducts().length;
  const previousVisible = Math.min(catalogVisibleLimit, total);

  if (previousVisible >= total) return;

  catalogVisibleLimit = Math.min(
    total,
    previousVisible + CATALOG_PAGE_SIZE
  );

  renderCatalog({ animateFrom: previousVisible });
}

function viewAllCatalogProducts() {
  const total = filteredProducts().length;
  const previousVisible = Math.min(catalogVisibleLimit, total);

  if (previousVisible >= total) return;

  catalogVisibleLimit = total;
  renderCatalog({ animateFrom: previousVisible });
}

function backToCatalogTop() {
  const target = document.querySelector("#catalogo .catalog-title") || document.getElementById("catalogo");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCatalog(options = {}) {
  const grid = document.getElementById("product-grid");
  const results = document.getElementById("results-text");
  const list = filteredProducts();
  const resetLimit = Boolean(options.resetLimit);
  const animateFrom = Number.isFinite(options.animateFrom)
    ? Math.max(0, options.animateFrom)
    : -1;

  if (resetLimit) {
    resetCatalogPagination();
  }

  grid.textContent = "";

  const selectedCategory =
    state.category
      ? state.categorias.find(
          c => String(c.id) === String(state.category)
        )
      : null;

  const selectedCategoryName =
    state.category
      ? (
          selectedCategory
            ? selectedCategory.nombre
            : titleCase(state.category)
        )
      : "";

  if (selectedCategoryName) {
    results.textContent =
      list.length +
      (list.length === 1 ? " producto en " : " productos en ") +
      selectedCategoryName;
  } else {
    results.textContent =
      list.length +
      (list.length === 1 ? " producto disponible" : " productos disponibles");
  }

  if (!state.productos.length) {
    grid.append(
      createEmpty(
        "",
        selectedCategoryName
      )
    );
    renderCatalogPagination(0, 0);
  } else if (!list.length) {
    grid.append(
      createEmpty(
        "Prueba con otra categoría, marca o rango de precio.",
        selectedCategoryName
      )
    );
    renderCatalogPagination(0, 0);
  } else {
    const visibleList = list.slice(0, catalogVisibleLimit);

    visibleList.forEach((product, index) => {
      const card = productCard(product);

      if (animateFrom >= 0 && index >= animateFrom) {
        card.classList.add("catalog-card-enter");
        card.style.setProperty(
          "--catalog-enter-delay",
          Math.min((index - animateFrom) * 35, 280) + "ms"
        );
      }

      grid.append(card);
    });

    renderCatalogPagination(list.length, visibleList.length);
  }

  renderFilterChips();
}

function clearFilters() {
  Object.assign(state, {
    search: "", category: "", brand: "", price: "", stock: "", gaming: "", sort: "relevant", onlyFavorites: false
  });
  document.getElementById("buscador").value = "";
  syncFilters();
  renderCatalog({ resetLimit: true });
}

// ---------- Favoritos / comparador ----------

function toggleFavorite(id) {
  const value = String(id);
  state.favoritos = isFavorite(value)
    ? state.favoritos.filter(item => item !== value)
    : state.favoritos.concat(value);
  writeList(CLAVES.favoritos, state.favoritos);
  toast(isFavorite(value) ? "Producto agregado a favoritos." : "Producto eliminado de favoritos.");
  updateCounters();
  renderCatalog();
  renderNovelties();
}

function showFavorites() {
  state.onlyFavorites = !state.onlyFavorites;
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  renderCatalog({ resetLimit: true });
}

function toggleCompare(id) {
  const value = String(id);
  if (isCompared(value)) {
    state.comparador = state.comparador.filter(item => item !== value);
  } else {
    if (state.comparador.length >= 3) {
      toast("Puedes comparar un máximo de 3 productos.");
      return;
    }
    state.comparador.push(value);
  }
  writeList(CLAVES.comparador, state.comparador);
  updateCompare();
  updateCounters();
  renderCatalog();
}

function updateCompare() {
  const bar = document.getElementById("compare-bar");
  const names = document.getElementById("compare-names");
  if (!state.comparador.length) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  names.textContent = state.comparador.map(productById).filter(Boolean).map(p => p.nombre).join(" · ");
  document.getElementById("open-compare").textContent = "Comparar " + state.comparador.length;
}

function openCompare() {
  const products = state.comparador.map(productById).filter(Boolean);
  if (!products.length) {
    toast("Selecciona productos para comparar.");
    return;
  }

  const wrap = document.createElement("div");
  const title = document.createElement("h2");
  title.id = "modal-title";
  title.textContent = "Comparador NEXUS";
  const intro = document.createElement("p");
  intro.textContent = "Compara hasta 3 productos lado a lado.";

  const scroller = document.createElement("div");
  scroller.className = "compare-table-wrap";
  const table = document.createElement("table");
  table.className = "compare-table";

  const rows = [
    ["Producto", ...products.map(p => p.nombre)],
    ["Marca", ...products.map(p => p.marca)],
    ["Categoría", ...products.map(p => p.categoria)],
    ["Precio", ...products.map(p => formatearColones(p.precio))],
    ["Stock", ...products.map(p => String(p.stock))],
    ["Perfil", ...products.map(p => p.gaming ? "Gaming" : "General")]
  ];

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");
    row.forEach(value => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      cell.textContent = value;
      tr.append(cell);
    });
    table.append(tr);
  });

  scroller.append(table);
  wrap.append(title, intro, scroller);
  openModal(wrap);
}

// ---------- Carrito ----------

function cartQty(id) {
  const item = state.carrito.find(row => String(row.productoId) === String(id));
  return item ? Math.max(0, Math.floor(safeNumber(item.cantidad, 0))) : 0;
}

function agregarAlCarrito(id) {
  const product = productById(id);
  if (!product || product.stock <= 0) {
    toast("Este producto no está disponible.");
    return;
  }

  const current = cartQty(id);
  if (current >= product.stock) {
    toast("Ya alcanzaste el stock disponible.");
    return;
  }

  const item = state.carrito.find(row => String(row.productoId) === String(id));
  if (item) item.cantidad += 1;
  else state.carrito.push({ productoId: String(id), cantidad: 1 });

  writeList(CLAVES.carrito, state.carrito);
  updateCart();
  toast("Producto agregado al carrito.");
}

function changeQty(id, delta) {
  const product = productById(id);
  const item = state.carrito.find(row => String(row.productoId) === String(id));
  if (!product || !item) return;

  const next = Math.floor(safeNumber(item.cantidad, 0)) + delta;
  if (next <= 0) return removeFromCart(id);
  if (next > product.stock) {
    toast("No hay más unidades disponibles.");
    return;
  }

  item.cantidad = next;
  writeList(CLAVES.carrito, state.carrito);
  updateCart();
}

function removeFromCart(id) {
  state.carrito = state.carrito.filter(row => String(row.productoId) !== String(id));
  writeList(CLAVES.carrito, state.carrito);
  updateCart();
}

function cartSubtotal() {
  return state.carrito.reduce((total, item) => {
    const product = productById(item.productoId);
    return total + (product ? product.precio * Math.max(0, Math.floor(safeNumber(item.cantidad, 0))) : 0);
  }, 0);
}

function qtyButton(label, symbol, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.innerHTML = '<svg class="icon"><use href="' + symbol + '"></use></svg>';
  button.addEventListener("click", action);
  return button;
}

function updateCart() {
  const box = document.getElementById("cart-items");
  box.textContent = "";

  if (!state.carrito.length) {
    const empty = document.createElement("div");
    empty.className = "cart-empty";
    empty.innerHTML = "<div><strong>Tu carrito está vacío.</strong><br><span>Agrega tecnología desde el catálogo.</span></div>";
    box.append(empty);
  }

  state.carrito.forEach(item => {
    const product = productById(item.productoId);
    if (!product) return;

    const row = document.createElement("article");
    row.className = "cart-item";
    const img = document.createElement("img");
    img.src = product.imagen;
    img.alt = product.nombre;

    const info = document.createElement("div");
    info.className = "cart-info";
    const title = document.createElement("strong");
    title.textContent = product.nombre;
    const price = document.createElement("span");
    price.textContent = formatearColones(product.precio);

    const qty = document.createElement("div");
    qty.className = "qty";
    const count = document.createElement("span");
    count.textContent = Math.max(1, Math.floor(safeNumber(item.cantidad, 1)));
    qty.append(
      qtyButton("Disminuir cantidad", "#i-minus", () => changeQty(product.id, -1)),
      count,
      qtyButton("Aumentar cantidad", "#i-plus", () => changeQty(product.id, 1))
    );

    info.append(title, price, qty);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.setAttribute("aria-label", "Eliminar " + product.nombre);
    remove.innerHTML = '<svg class="icon"><use href="#i-trash"></use></svg>';
    remove.addEventListener("click", () => removeFromCart(product.id));

    row.append(img, info, remove);
    box.append(row);
  });

  const totalQty = state.carrito.reduce((total, item) => total + Math.max(0, Math.floor(safeNumber(item.cantidad, 0))), 0);
  document.getElementById("cart-title-count").textContent = "(" + totalQty + ")";
  document.getElementById("cart-subtotal").textContent = formatearColones(cartSubtotal());
  updateCounters();
}

// ---------- Checkout integrado con clientes/pedidos/stock ----------

function validateCartStock() {
  for (const item of state.carrito) {
    const product = productById(item.productoId);
    if (!product) return "Uno de los productos ya no existe.";
    if (item.cantidad > product.stock) return "Stock insuficiente para " + product.nombre + ".";
  }
  return "";
}

function openCheckout() {
  if (!state.carrito.length) {
    toast("Agrega productos antes de continuar.");
    return;
  }
  const stockError = validateCartStock();
  if (stockError) {
    toast(stockError);
    return;
  }

  closeDrawers();

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <span class="eyebrow">CHECKOUT NEXUS</span>
    <h2 id="modal-title">Finaliza tu compra</h2>
    <p>Completa la información de envío. El pedido quedará registrado con estado Pendiente.</p>

    <div class="checkout-steps" aria-label="Progreso del checkout">
      <span class="checkout-step done">1 Carrito</span>
      <span class="checkout-step active">2 Envío</span>
      <span class="checkout-step">3 Pago</span>
      <span class="checkout-step">4 Confirmación</span>
    </div>

    <form class="checkout-form" id="checkout-form">
      <label>Nombre completo<input id="checkout-name" maxlength="100" required></label>
      <label>Correo electrónico<input id="checkout-email" type="email" maxlength="150" required></label>
      <label>Teléfono<input id="checkout-phone" maxlength="20" required></label>
      <label>Provincia<select id="checkout-province" required><option value="">Seleccionar</option><option>San José</option><option>Alajuela</option><option>Cartago</option><option>Heredia</option><option>Guanacaste</option><option>Puntarenas</option><option>Limón</option></select></label>
      <label class="full">Dirección exacta<input id="checkout-address" maxlength="220" required></label>
      <div class="checkout-total"><span>Total</span><strong>${formatearColones(cartSubtotal())}</strong></div>
      <button class="btn primary full" type="submit">Confirmar pedido</button>
    </form>`;

  openModal(wrap);

  const user = readObject(CLAVES.usuario);
  if (user && user.nombre) document.getElementById("checkout-name").value = user.nombre;

  document.getElementById("checkout-form").addEventListener("submit", confirmCheckout);
}

function confirmCheckout(event) {
  event.preventDefault();

  const nombre = safeText(document.getElementById("checkout-name").value, 100);
  const correo = safeText(document.getElementById("checkout-email").value, 150).toLowerCase();
  const telefono = safeText(document.getElementById("checkout-phone").value, 20);
  const provincia = safeText(document.getElementById("checkout-province").value, 40);
  const direccion = safeText(document.getElementById("checkout-address").value, 220);

  if (!nombre || !correo || !telefono || !provincia || !direccion) {
    toast("Completa todos los campos.");
    return;
  }

  const stockError = validateCartStock();
  if (stockError) {
    toast(stockError);
    closeModal();
    cargarProductos();
    renderAll();
    return;
  }

  const oldClients = readList(CLAVES.clientes);
  const oldOrders = readList(CLAVES.pedidos);
  const oldProducts = readList(CLAVES.productos);

  const clients = oldClients.slice();
  let client = clients.find(c => normalize(c.correo) === normalize(correo));
  if (!client) {
    client = { id: makeId(), nombre, correo, telefono };
    clients.push(client);
  }

  const items = state.carrito.map(item => {
    const product = productById(item.productoId);
    const supplier = supplierById(product.proveedorId);
    const cantidad = Math.max(1, Math.floor(safeNumber(item.cantidad, 1)));
    return {
      productoId: product.id,
      productoNombre: product.nombre,
      proveedorId: product.proveedorId,
      proveedorNombre: supplier ? (supplier.empresa || supplier.nombre) : "No disponible",
      precioUnitario: product.precio,
      cantidad,
      subtotal: product.precio * cantidad
    };
  });

  const cantidadArticulos = items.reduce((total, item) => total + item.cantidad, 0);
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const now = new Date().toISOString();

  const order = {
    id: makeId(),
    clienteId: client.id,
    clienteNombre: client.nombre,
    envio: { provincia, direccion, telefono, correo },
    items,
    cantidadArticulos,
    subtotal,
    total: subtotal,
    estado: "pendiente",
    creadoEn: now,
    actualizadoEn: now
  };

  const quantities = new Map(state.carrito.map(item => [String(item.productoId), Math.max(1, Math.floor(safeNumber(item.cantidad, 1)))]));
  const updatedProducts = oldProducts.map(product => ({
    ...product,
    stock: quantities.has(String(product.id))
      ? Math.max(0, safeNumber(product.stock, 0) - quantities.get(String(product.id)))
      : product.stock
  }));

  try {
    localStorage.setItem(CLAVES.clientes, JSON.stringify(clients));
    localStorage.setItem(CLAVES.productos, JSON.stringify(updatedProducts));
    localStorage.setItem(CLAVES.pedidos, JSON.stringify(oldOrders.concat(order)));
    state.carrito = [];
    localStorage.setItem(CLAVES.carrito, "[]");
  } catch {
    try {
      localStorage.setItem(CLAVES.clientes, JSON.stringify(oldClients));
      localStorage.setItem(CLAVES.productos, JSON.stringify(oldProducts));
      localStorage.setItem(CLAVES.pedidos, JSON.stringify(oldOrders));
    } catch {}
    toast("No fue posible confirmar el pedido.");
    return;
  }

  closeModal();
  cargarProductos();
  renderAll();
  toast("Pedido confirmado. Estado inicial: Pendiente.");
}

// ---------- Sesión ----------

function renderSession() {
  const user = readObject(CLAVES.usuario);
  const text = document.getElementById("cuenta-texto");
  const link = document.getElementById("cuenta-link");
  const mobile = document.getElementById("mobile-account");

  if (user) {
    const name = safeText(user.nombre || user.usuario || "Usuario", 40).split(" ")[0];
    text.textContent = "Hola, " + name;
    link.href = "dashboard.html";
    mobile.href = "dashboard.html";
    mobile.textContent = "Mi cuenta";
  } else {
    text.textContent = "Iniciar sesión";
    link.href = "login.html";
    mobile.href = "login.html";
    mobile.textContent = "Cuenta";
  }
}

// ---------- Detalle / modal ----------

function detailProductSpecs(product) {
  const values = [];
  const usedLabels = new Set();

  const add = (label, value) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    ) {
      return;
    }

    const cleanLabel = safeText(label, 60);
    const cleanValue = safeText(
      Array.isArray(value) ? value.join(", ") : value,
      140
    );

    if (!cleanLabel || !cleanValue || usedLabels.has(cleanLabel)) return;

    usedLabels.add(cleanLabel);
    values.push({ label: cleanLabel, value: cleanValue });
  };

  const known =
    window.NEXUS_PC_SPECS?.[normalize(product.nombre)] ||
    null;

  if (known) {
    add("Socket", known.socket);
    add("Memoria compatible", known.ramType);
    add("Formato", known.formFactor);
    add("Formatos compatibles", known.formFactors);
    add("Interfaz", known.interface);
    add("Potencia", known.watts ? known.watts + " W" : "");
    add("Consumo estimado", known.power ? known.power + " W" : "");
    add("Fuente recomendada", known.recommendedPsu ? known.recommendedPsu + " W" : "");
    add("Longitud", known.lengthMm ? known.lengthMm + " mm" : "");
    add("GPU máxima", known.gpuMaxMm ? known.gpuMaxMm + " mm" : "");
    add("Ranura M.2", known.m2 === true ? "Sí" : "");
    add(
      "Gama",
      known.tier
        ? known.tier.charAt(0).toUpperCase() + known.tier.slice(1)
        : ""
    );
  }

  const name = String(product.nombre || "");
  const normalizedName = normalize(name);

  const memoryType = normalizedName.match(/\bddr[45]\b/i);
  if (memoryType) add("Tipo de memoria", memoryType[0].toUpperCase());

  const capacity = name.match(/\b(\d+(?:[.,]\d+)?)\s*(TB|GB)\b/i);
  if (capacity) {
    add(
      "Capacidad / memoria",
      capacity[1].replace(",", ".") + " " + capacity[2].toUpperCase()
    );
  }

  const refreshRate = name.match(/\b(\d{2,3})\s*Hz\b/i);
  if (refreshRate) add("Frecuencia", refreshRate[1] + " Hz");

  const dpi = name.match(/\b(\d{3,6})\s*DPI\b/i);
  if (dpi) add("Sensibilidad", Number(dpi[1]).toLocaleString("es-CR") + " DPI");

  const watts = name.match(/\b(\d{3,4})\s*W\b/i);
  if (watts) add("Potencia nominal", watts[1] + " W");

  const resolution =
    /\b(4k|2160p|uhd)\b/i.test(name)
      ? "4K"
      : /\b(1440p|qhd|2k)\b/i.test(name)
        ? "1440p / QHD"
        : /\b(1080p|fhd|full hd)\b/i.test(name)
          ? "1080p / Full HD"
          : "";

  add("Resolución", resolution);

  if (values.length < 4) {
    add("Categoría", product.categoria);
    add("Marca", product.marca);
    add("Disponibilidad", product.stock > 0 ? product.stock + " unidades" : "Agotado");
  }

  return values.slice(0, 10);
}

function relatedProducts(product, limit = 4) {
  const sameCategory = state.productos.filter(item =>
    String(item.id) !== String(product.id) &&
    (
      String(item.categoriaId) === String(product.categoriaId) ||
      normalize(item.categoria) === normalize(product.categoria)
    )
  );

  const score = item => {
    let points = 0;

    if (normalize(item.marca) === normalize(product.marca)) points += 40;
    if (item.stock > 0) points += 25;
    if (item.rating > 0) points += item.rating * 2;

    const reference = Math.max(1, Number(product.precio || 0));
    const delta = Math.abs(Number(item.precio || 0) - reference) / reference;
    points += Math.max(0, 20 - delta * 20);

    return points;
  };

  const selected = sameCategory
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);

  if (selected.length >= limit) return selected;

  const selectedIds = new Set(selected.map(item => String(item.id)));

  const fallback = state.productos
    .filter(item =>
      String(item.id) !== String(product.id) &&
      !selectedIds.has(String(item.id))
    )
    .sort((a, b) => {
      const brandA = normalize(a.marca) === normalize(product.marca) ? 1 : 0;
      const brandB = normalize(b.marca) === normalize(product.marca) ? 1 : 0;

      if (brandA !== brandB) return brandB - brandA;
      if ((a.stock > 0) !== (b.stock > 0)) return b.stock > 0 ? 1 : -1;

      return Math.abs(a.precio - product.precio) - Math.abs(b.precio - product.precio);
    });

  return selected
    .concat(fallback.slice(0, limit - selected.length))
    .slice(0, limit);
}

function detailStatus(product) {
  const info = stockInfo(product);

  return {
    text:
      product.stock <= 0
        ? "Agotado"
        : product.stock <= 5
          ? `${info.text} · ${product.stock} disponibles`
          : `${info.text} · ${product.stock} disponibles`,
    className: info.className
  };
}

function createDetailFavoriteButton(product) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn detail-favorite-button";

  const sync = () => {
    const active = isFavorite(product.id);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.innerHTML = `
      <svg class="icon" aria-hidden="true"><use href="#i-heart"></use></svg>
      <span>${active ? "En favoritos" : "Agregar a favoritos"}</span>
    `;
  };

  sync();

  button.addEventListener("click", () => {
    toggleFavorite(product.id);
    sync();
  });

  return button;
}

function createRelatedProductCard(product) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "detail-related-card";
  card.setAttribute("aria-label", "Ver " + product.nombre);

  const media = document.createElement("span");
  media.className = "detail-related-media";

  const img = document.createElement("img");
  img.src = product.imagen;
  img.alt = "";
  img.loading = "lazy";
  img.addEventListener("error", () => {
    img.src = IMG.default;
  });

  media.append(img);

  const content = document.createElement("span");
  content.className = "detail-related-content";

  const brand = document.createElement("small");
  brand.textContent = product.marca;

  const title = document.createElement("strong");
  title.textContent = product.nombre;

  const footer = document.createElement("span");
  footer.className = "detail-related-footer";

  const price = document.createElement("b");
  price.textContent = formatearColones(product.precio);

  const stock = document.createElement("small");
  stock.className = product.stock > 0 ? "available" : "out";
  stock.textContent = product.stock > 0 ? "Disponible" : "Agotado";

  footer.append(price, stock);
  content.append(brand, title, footer);
  card.append(media, content);

  card.addEventListener("click", () => openProduct(product.id));

  return card;
}

function openProduct(id) {
  const product = productById(id);
  if (!product) return;

  const supplier = supplierById(product.proveedorId);
  const status = detailStatus(product);
  const specs = detailProductSpecs(product);
  const related = relatedProducts(product, 4);

  const wrap = document.createElement("div");
  wrap.className = "product-detail";

  const hero = document.createElement("section");
  hero.className = "product-detail-hero";

  const visual = document.createElement("div");
  visual.className = "product-detail-visual";

  const imageStage = document.createElement("div");
  imageStage.className = "product-detail-image-stage";

  const img = document.createElement("img");
  img.src = product.imagen;
  img.alt = product.nombre;
  img.addEventListener("error", () => {
    img.src = IMG.default;
    imageStage.classList.add("fallback");
  });

  const imageBadge = document.createElement("span");
  imageBadge.className = "product-detail-image-badge";
  imageBadge.textContent = product.categoria;

  imageStage.append(img, imageBadge);
  visual.append(imageStage);

  const content = document.createElement("div");
  content.className = "product-detail-content";

  const top = document.createElement("div");
  top.className = "product-detail-top";

  const brand = document.createElement("span");
  brand.className = "product-detail-brand";
  brand.textContent = product.marca;

  const statusPill = document.createElement("span");
  statusPill.className = "product-detail-stock " + status.className;
  statusPill.textContent = status.text;

  top.append(brand, statusPill);

  const title = document.createElement("h2");
  title.id = "modal-title";
  title.textContent = product.nombre;

  const description = document.createElement("p");
  description.className = "product-detail-description";
  description.textContent =
    product.descripcion ||
    "Producto disponible en el catálogo NEXUS.";

  const priceArea = document.createElement("div");
  priceArea.className = "product-detail-price-area";

  const currentPrice = document.createElement("strong");
  currentPrice.className = "product-detail-price";
  currentPrice.textContent = formatearColones(product.precio);
  priceArea.append(currentPrice);

  if (product.precioAnterior > product.precio) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "product-detail-old-price";
    oldPrice.textContent = formatearColones(product.precioAnterior);
    priceArea.append(oldPrice);

    const discountBadge = document.createElement("span");
    discountBadge.className = "product-detail-discount";
    discountBadge.textContent = "-" + discount(product) + "%";
    priceArea.append(discountBadge);
  }

  const finance = document.createElement("p");
  finance.className = "product-detail-finance";
  finance.textContent =
    "Desde " + formatearColones(monthly(product)) + " al mes durante 12 meses.";

  const actions = document.createElement("div");
  actions.className = "product-detail-actions";

  const addCart = document.createElement("button");
  addCart.type = "button";
  addCart.className = "btn primary product-detail-cart";
  addCart.disabled = product.stock <= 0;
  addCart.innerHTML = `
    <svg class="icon" aria-hidden="true"><use href="#i-cart"></use></svg>
    <span>${product.stock <= 0 ? "Producto agotado" : "Agregar al carrito"}</span>
  `;
  addCart.addEventListener("click", () => {
    agregarAlCarrito(product.id);
  });

  actions.append(addCart, createDetailFavoriteButton(product));

  const service = document.createElement("div");
  service.className = "product-detail-service";
  service.innerHTML = `
    <span>✓ Inventario sincronizado</span>
    <span>✓ Compra segura en NEXUS</span>
    <span>✓ Datos del proveedor disponibles</span>
  `;

  content.append(
    top,
    title,
    description,
    priceArea,
    finance,
    actions,
    service
  );

  hero.append(visual, content);
  wrap.append(hero);

  const information = document.createElement("section");
  information.className = "product-detail-information";

  const specifications = document.createElement("div");
  specifications.className = "product-detail-panel";

  const specsHeader = document.createElement("div");
  specsHeader.className = "product-detail-panel-header";
  specsHeader.innerHTML = `
    <span class="eyebrow">DATOS DEL PRODUCTO</span>
    <h3>Especificaciones</h3>
  `;

  const specGrid = document.createElement("div");
  specGrid.className = "product-detail-spec-grid";

  specs.forEach(spec => {
    const row = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = spec.label;

    const value = document.createElement("strong");
    value.textContent = spec.value;

    row.append(label, value);
    specGrid.append(row);
  });

  specifications.append(specsHeader, specGrid);

  const provider = document.createElement("div");
  provider.className = "product-detail-panel product-detail-provider";

  const providerHeader = document.createElement("div");
  providerHeader.className = "product-detail-panel-header";
  providerHeader.innerHTML = `
    <span class="eyebrow">ORIGEN DEL PRODUCTO</span>
    <h3>Proveedor</h3>
  `;

  const providerBody = document.createElement("div");
  providerBody.className = "product-detail-provider-body";

  const company = document.createElement("strong");
  company.className = "product-detail-provider-name";
  company.textContent =
    supplier?.empresa ||
    supplier?.nombre ||
    product.proveedorNombre ||
    "Proveedor NEXUS";

  const providerContact = document.createElement("span");
  providerContact.textContent =
    supplier?.nombre && supplier?.empresa && normalize(supplier.nombre) !== normalize(supplier.empresa)
      ? "Contacto: " + supplier.nombre
      : "Proveedor registrado en el sistema";

  const providerItems = document.createElement("div");
  providerItems.className = "product-detail-provider-items";

  const providerData = [
    ["Teléfono", supplier?.telefono],
    ["Correo", supplier?.correo],
    ["Dirección", supplier?.direccion]
  ].filter(([, value]) => value);

  if (providerData.length) {
    providerData.forEach(([label, value]) => {
      const row = document.createElement("div");
      const key = document.createElement("span");
      key.textContent = label;
      const data = document.createElement("strong");
      data.textContent = value;
      row.append(key, data);
      providerItems.append(row);
    });
  } else {
    const empty = document.createElement("p");
    empty.className = "product-detail-provider-empty";
    empty.textContent =
      "Este producto está asociado a un proveedor registrado en NEXUS.";
    providerItems.append(empty);
  }

  providerBody.append(company, providerContact, providerItems);
  provider.append(providerHeader, providerBody);

  information.append(specifications, provider);
  wrap.append(information);

  if (related.length) {
    const relatedSection = document.createElement("section");
    relatedSection.className = "product-detail-related";

    const relatedHeader = document.createElement("div");
    relatedHeader.className = "product-detail-related-header";

    const relatedTitle = document.createElement("div");
    relatedTitle.innerHTML = `
      <span class="eyebrow">TAMBIÉN TE PUEDE INTERESAR</span>
      <h3>Productos relacionados</h3>
    `;

    const relatedHint = document.createElement("span");
    relatedHint.textContent = "Seleccionados según categoría, marca y precio.";

    relatedHeader.append(relatedTitle, relatedHint);

    const relatedGrid = document.createElement("div");
    relatedGrid.className = "product-detail-related-grid";
    related.forEach(item => {
      relatedGrid.append(createRelatedProductCard(item));
    });

    relatedSection.append(relatedHeader, relatedGrid);
    wrap.append(relatedSection);
  }

  openModal(wrap, "product-detail");
}
function openModal(content, variant = "") {
  const modal = document.getElementById("modal");
  const card = modal.querySelector(".modal-card");
  const target = document.getElementById("modal-content");

  card.classList.toggle("product-detail-modal", variant === "product-detail");

  target.textContent = "";
  target.append(content);
  modal.hidden = false;

  requestAnimationFrame(() => {
    card.scrollTop = 0;
  });

  document.body.classList.add("lock");
}

function closeModal() {
  const modal = document.getElementById("modal");
  const card = modal.querySelector(".modal-card");

  modal.hidden = true;
  card.classList.remove("product-detail-modal");
  document.getElementById("modal-content").textContent = "";
  document.body.classList.remove("lock");
}

// ---------- Drawers ----------

function openDrawer(drawer) {
  document.getElementById("overlay").hidden = false;
  requestAnimationFrame(() => drawer.classList.add("open"));
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

function closeDrawers() {
  document.querySelectorAll(".drawer.open").forEach(drawer => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  });
  document.getElementById("overlay").hidden = true;
  document.body.classList.remove("lock");
}

function openCart() {
  updateCart();
  openDrawer(document.getElementById("cart-drawer"));
}

function openMobileFilters() {
  const source = document.getElementById("filters-desktop");
  const target = document.getElementById("mobile-filter-content");
  target.innerHTML = source.innerHTML;

  target.querySelectorAll("select").forEach(select => {
    const original = document.getElementById(select.id);
    select.id += "-mobile";
    select.value = original.value;
    select.addEventListener("change", () => {
      original.value = select.value;
      original.dispatchEvent(new Event("change"));
    });
  });

  const clear = target.querySelector("#clear-filters");
  if (clear) {
    clear.id = "clear-filters-mobile";
    clear.addEventListener("click", () => {
      clearFilters();
      closeDrawers();
    });
  }

  openDrawer(document.getElementById("filter-drawer"));
}

// ---------- NEXUS AI / toast ----------


function presupuestoDesdeTextoIA(text) {
  const raw = String(text || "");

  const million = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:millon|millones|millón|m)\b/i);
  if (million) {
    const value = Number(million[1].replace(",", "."));
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1000000);
  }

  const thousands = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/i);
  if (thousands) {
    const value = Number(thousands[1].replace(",", "."));
    if (Number.isFinite(value) && value > 0) return Math.round(value * 1000);
  }

  const explicit = [...raw.matchAll(/(?:₡|crc\s*)?\s*(\d{2,4}(?:[.,]\d{3})+|\d{5,8})/gi)];

  for (const match of explicit) {
    const value = Number(String(match[1]).replace(/[.,]/g, ""));
    if (Number.isFinite(value) && value >= 10000) return value;
  }

  return 0;
}

function resolucionDesdeTextoIA(text) {
  const value = normalize(text);

  if (/\b(4k|2160p?|uhd)\b/.test(value)) return "4k";
  if (/\b(1440p?|2k|qhd)\b/.test(value)) return "1440p";
  if (/\b(1080p?|fhd|full hd)\b/.test(value)) return "1080p";

  return "";
}

function socketDesdeTextoIA(text) {
  const upper = String(text || "").toUpperCase().replace(/\s+/g, "");

  for (const socket of ["LGA1851", "LGA1700", "LGA1200", "AM5", "AM4"]) {
    if (upper.includes(socket)) return socket;
  }

  return "";
}

function gamaDesdeTextoIA(text) {
  const value = normalize(text);
  if (/\b(entrada|economica|economico|barata|barato)\b/.test(value)) return "entrada";
  if (/\b(gama media|media)\b/.test(value)) return "media";
  if (/\b(gama alta|alta|entusiasta)\b/.test(value)) return "alta";
  return "";
}

function detectarPreferenciasMarcaIA(text) {
  const value = normalize(text);

  let cpuBrand = "";
  let gpuBrand = "";
  const excludeBrands = [];

  if (/\b(sin|no quiero|evita|evitar)\s+intel\b/.test(value)) excludeBrands.push("intel");
  if (/\b(sin|no quiero|evita|evitar)\s+amd\b/.test(value)) excludeBrands.push("amd");
  if (/\b(sin|no quiero|evita|evitar)\s+nvidia\b/.test(value)) excludeBrands.push("nvidia");

  if (/\b(ryzen|cpu amd|procesador amd)\b/.test(value)) cpuBrand = "amd";
  if (/\b(core i[3579]|cpu intel|procesador intel)\b/.test(value)) cpuBrand = "intel";

  if (/\b(geforce|rtx|gpu nvidia|grafica nvidia|gráfica nvidia)\b/.test(value)) gpuBrand = "nvidia";
  if (/\b(radeon|rx \d|gpu amd|grafica amd|gráfica amd)\b/.test(value)) gpuBrand = "amd";
  if (/\b(intel arc|arc [ab]\d|gpu intel)\b/.test(value)) gpuBrand = "intel";

  if (/\b(todo amd|full amd)\b/.test(value)) {
    cpuBrand = "amd";
    gpuBrand = "amd";
  }

  // "Quiero AMD" sin contexto de GPU se interpreta como preferencia de CPU.
  if (!cpuBrand && /\b(quiero|prefiero|con)\s+amd\b/.test(value) && !gpuBrand) {
    cpuBrand = "amd";
  }

  if (!cpuBrand && /\b(quiero|prefiero|con)\s+intel\b/.test(value) && !gpuBrand) {
    cpuBrand = "intel";
  }

  return {
    cpuBrand,
    gpuBrand,
    excludeBrands: [...new Set(excludeBrands)]
  };
}

function ramDesdeTextoIA(text) {
  const value = normalize(text);
  const match = value.match(/(\d{1,3})\s*gb(?:\s+de)?\s+ram\b/);
  return match ? Number(match[1]) : 0;
}

function almacenamientoDesdeTextoIA(text) {
  const value = normalize(text);

  const tb = value.match(/(\d+(?:[.,]\d+)?)\s*tb\b/);
  if (tb) return Math.round(Number(tb[1].replace(",", ".")) * 1024);

  const gb = value.match(/(\d{3,4})\s*gb(?:\s+de)?\s+(?:ssd|almacenamiento)\b/);
  if (gb) return Number(gb[1]);

  return 0;
}

function quiereAgregarAlCarritoIA(text) {
  const value = normalize(text);

  return (
    /\b(agrega|agregala|agregalo|añade|anade|metela|metelo|mete|pon|sumala|sumalo)\b/.test(value) &&
    /\bcarrito\b/.test(value)
  );
}

function detectarSolicitudBuildIA(text) {
  const value = normalize(text);

  const pcNoun =
    /\b(pc|computadora|ordenador|equipo|build|configuracion|configuración)\b/.test(value);

  const buildVerb =
    /\b(armame|arma|armar|construye|construirme|configura|configurame|hazme|build)\b/.test(value);

  const directPattern =
    /\bpc\s+(?:para|de|con)\b/.test(value) ||
    /\bcomputadora\s+(?:para|de|con)\b/.test(value);

  const hasBuildIntent =
    (pcNoun && buildVerb) ||
    directPattern ||
    (pcNoun && /\bpresupuesto\b/.test(value) && presupuestoDesdeTextoIA(text) > 0);

  if (!hasBuildIntent) return null;

  const brands = detectarPreferenciasMarcaIA(text);

  const usage =
    /\b(programacion|programación|trabajo|edicion|edición|render|productividad)\b/.test(value)
      ? (/\b(gaming|jugar|juegos)\b/.test(value) ? "gaming y trabajo" : "trabajo")
      : "gaming";

  return {
    type: "build_pc",
    addToCart: quiereAgregarAlCarritoIA(text),
    options: {
      budget: presupuestoDesdeTextoIA(text),
      resolution: resolucionDesdeTextoIA(text),
      usage,
      socket: socketDesdeTextoIA(text),
      tier: gamaDesdeTextoIA(text),
      cpuBrand: brands.cpuBrand,
      gpuBrand: brands.gpuBrand,
      excludeBrands: brands.excludeBrands,
      minRamGb: ramDesdeTextoIA(text),
      minStorageGb: almacenamientoDesdeTextoIA(text)
    }
  };
}

function textoObjetivoBuildIA(build) {
  const resolution = build?.profile?.resolution || build?.options?.resolution || "";
  const usage = build?.options?.usage || "gaming";

  if (resolution) return `${resolution} · ${usage}`;
  return usage;
}

function descripcionBuildParaHistorialIA(build) {
  if (!build?.ok) return "";

  const parts = (build.products || [])
    .map(item => `${item.label}: ${item.nombre} (${formatearColones(item.precio)})`)
    .join("; ");

  return [
    `Build NEXUS generada para ${textoObjetivoBuildIA(build)}.`,
    parts,
    `Total ${formatearColones(build.total)}.`,
    `Consumo estimado ${build.watts} W.`,
    `Fuente recomendada ${build.recommendedPsu || 0} W.`
  ].join(" ");
}

function guardarUltimaBuildIA(build) {
  nexusAILastBuild = build?.ok ? build : null;

  try {
    if (nexusAILastBuild) {
      localStorage.setItem(
        "nexus_ai_last_build_v1",
        JSON.stringify(nexusAILastBuild)
      );
    }
  } catch {}
}

function cargarUltimaBuildIA() {
  if (nexusAILastBuild?.ok) return nexusAILastBuild;

  try {
    const raw = localStorage.getItem("nexus_ai_last_build_v1");
    if (!raw) return null;

    const value = JSON.parse(raw);
    if (value?.ok && value?.selection) {
      nexusAILastBuild = value;
      return nexusAILastBuild;
    }
  } catch {}

  return null;
}

function addChatBuildCard(build) {
  const box = document.getElementById("chat-messages");
  if (!box || !build?.ok) return null;

  const card = document.createElement("div");
  card.className = "bot nexus-ai-build-card";

  const header = document.createElement("div");
  header.className = "nexus-ai-build-head";

  const titleBox = document.createElement("div");
  const eyebrow = document.createElement("small");
  eyebrow.textContent = "NEXUS AI BUILD";
  const title = document.createElement("strong");
  title.textContent = textoObjetivoBuildIA(build);
  titleBox.append(eyebrow, title);

  const status = document.createElement("span");
  status.className = "nexus-ai-build-status " + (build.targetReached ? "success" : "warning");
  status.textContent = build.targetReached ? "Objetivo cubierto" : "Mejor opción disponible";

  header.append(titleBox, status);

  const list = document.createElement("div");
  list.className = "nexus-ai-build-list";

  (build.products || []).forEach(item => {
    const row = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = item.label;

    const product = document.createElement("strong");
    product.textContent = item.nombre;

    const price = document.createElement("b");
    price.textContent = formatearColones(item.precio);

    row.append(label, product, price);
    list.append(row);
  });

  const metrics = document.createElement("div");
  metrics.className = "nexus-ai-build-metrics";

  const totalMetric = document.createElement("span");
  totalMetric.innerHTML = "<small>Total</small><strong></strong>";
  totalMetric.querySelector("strong").textContent = formatearColones(build.total);

  const wattsMetric = document.createElement("span");
  wattsMetric.innerHTML = "<small>Consumo</small><strong></strong>";
  wattsMetric.querySelector("strong").textContent = `${build.watts} W`;

  const psuMetric = document.createElement("span");
  psuMetric.innerHTML = "<small>PSU recomendada</small><strong></strong>";
  psuMetric.querySelector("strong").textContent = build.recommendedPsu ? `${build.recommendedPsu} W` : "—";

  metrics.append(totalMetric, wattsMetric, psuMetric);

  if (build.options?.budget > 0) {
    const budget = document.createElement("div");
    budget.className = "nexus-ai-build-budget";

    const remaining = Number(build.options.budget) - Number(build.total);
    budget.classList.toggle("negative", remaining < 0);

    const left = document.createElement("span");
    left.textContent = `Presupuesto ${formatearColones(build.options.budget)}`;

    const right = document.createElement("strong");
    right.textContent =
      remaining >= 0
        ? `Sobran ${formatearColones(remaining)}`
        : `Excede ${formatearColones(Math.abs(remaining))}`;

    budget.append(left, right);
    card.append(header, list, metrics, budget);
  } else {
    card.append(header, list, metrics);
  }

  const note = document.createElement("p");
  note.className = "nexus-ai-build-note";
  note.textContent = build.targetReached
    ? "Configuración validada por el motor de compatibilidad de NEXUS usando productos actualmente disponibles."
    : "Esta es la combinación compatible que más se acerca al objetivo solicitado con el inventario disponible.";

  const actions = document.createElement("div");
  actions.className = "nexus-ai-build-actions";

  const openBuilder = document.createElement("button");
  openBuilder.type = "button";
  openBuilder.className = "secondary";
  openBuilder.textContent = "Ver en Builder";
  openBuilder.addEventListener("click", () => {
    const result = window.NexusPCBuilder?.openBuild?.(build);
    if (!result?.ok) {
      toast(result?.error || "No fue posible abrir esta configuración.");
    }
  });

  const addCart = document.createElement("button");
  addCart.type = "button";
  addCart.className = "primary";
  addCart.textContent = "Agregar PC al carrito";
  addCart.addEventListener("click", () => {
    const result = window.NexusPCBuilder?.addBuildToCart?.(build, { openCart: true });

    if (!result?.ok) {
      addChat(
        result?.error || "No fue posible agregar la configuración al carrito.",
        "bot error"
      );
      return;
    }

    addCart.disabled = true;
    addCart.textContent = "Agregada ✓";

    addChat(
      `${result.added.length} componentes agregados al carrito${result.skipped.length ? `. ${result.skipped.length} no pudieron agregarse por stock.` : "."}`,
      "bot"
    );
  });

  const ask = document.createElement("button");
  ask.type = "button";
  ask.className = "ghost";
  ask.textContent = "¿Por qué esta build?";
  ask.addEventListener("click", () => {
    const prompt = [
      "Explícame por qué esta configuración NEXUS es una buena elección.",
      descripcionBuildParaHistorialIA(build),
      "Comenta el equilibrio CPU/GPU, resolución objetivo y posibles mejoras sin inventar productos fuera del inventario."
    ].join("\n");

    procesarPreguntaNexusAI(prompt, { skipLocalTools: true });
  });

  actions.append(openBuilder, addCart, ask);
  card.append(note, actions);

  box.append(card);
  box.scrollTop = box.scrollHeight;

  return card;
}

function agregarUltimaBuildAlCarritoIA() {
  const build =
    cargarUltimaBuildIA() ||
    window.NexusPCBuilder?.getLastGeneratedBuild?.();

  if (!build?.ok) {
    return {
      ok: false,
      error: "Todavía no he generado una PC. Pídeme primero una configuración por presupuesto o resolución."
    };
  }

  return window.NexusPCBuilder?.addBuildToCart?.(build, { openCart: true }) || {
    ok: false,
    error: "El PC Builder todavía no está disponible."
  };
}

async function ejecutarHerramientaBuildIA(intent) {
  if (!window.NexusPCBuilder?.generateBuild) {
    return {
      handled: true,
      error: "El PC Builder todavía se está cargando. Intenta nuevamente en un momento."
    };
  }

  const build = window.NexusPCBuilder.generateBuild(intent.options || {});

  if (!build?.ok) {
    return {
      handled: true,
      error: build?.error || "No encontré una configuración compatible."
    };
  }

  guardarUltimaBuildIA(build);
  window.NexusPCBuilder.applyBuild?.(build, { openBuilder: false });

  const target = textoObjetivoBuildIA(build);
  let intro = `Te preparé una PC para ${target} usando únicamente productos disponibles en NEXUS.`;

  if (build.options?.budget > 0) {
    intro += ` Total: ${formatearColones(build.total)} de un máximo de ${formatearColones(build.options.budget)}.`;
  } else {
    intro += ` Total: ${formatearColones(build.total)}.`;
  }

  if (!build.targetReached) {
    intro += " El inventario actual no alcanza completamente el perfil objetivo, así que elegí la combinación compatible más cercana.";
  }

  addChat(intro, "bot");
  addChatBuildCard(build);

  registrarHistorialNexusAI("model", descripcionBuildParaHistorialIA(build));

  if (intent.addToCart) {
    const result = window.NexusPCBuilder.addBuildToCart(build, { openCart: true });

    if (result?.ok) {
      addChat(`${result.added.length} componentes agregados al carrito.`, "bot");
    } else {
      addChat(result?.error || "No fue posible agregar la build al carrito.", "bot error");
    }
  }

  return {
    handled: true,
    build
  };
}

function addChat(text, type = "bot") {
  const box = document.getElementById("chat-messages");
  const message = document.createElement("div");
  message.className = type;
  message.textContent = text;
  box.append(message);
  box.scrollTop = box.scrollHeight;
  return message;
}

function addChatTyping() {
  const box = document.getElementById("chat-messages");
  const message = document.createElement("div");
  message.className = "bot typing";

  const label = document.createElement("span");
  label.textContent = "NEXUS AI está pensando";

  const dots = document.createElement("span");
  dots.className = "chat-typing-dots";
  dots.innerHTML = "<i></i><i></i><i></i>";

  message.append(label, dots);
  box.append(message);
  box.scrollTop = box.scrollHeight;
  return message;
}

function setNexusAIStatus(status, text) {
  const statusBox = document.getElementById("chat-status");
  const statusText = document.getElementById("chat-status-text");

  if (!statusBox || !statusText) return;

  statusBox.classList.remove("online", "offline", "checking");
  statusBox.classList.add(status);
  statusText.textContent = text;
}

function setNexusAIFormBusy(isBusy) {
  nexusAIRequestInProgress = isBusy;

  const input = document.getElementById("chat-input");
  const button = document.getElementById("chat-submit");

  if (input) input.disabled = isBusy;
  if (button) button.disabled = isBusy;
}

function registrarHistorialNexusAI(role, text) {
  nexusAIHistory.push({
    role,
    text: safeText(text, 1800)
  });

  while (nexusAIHistory.length > NEXUS_AI.maxHistoryItems) {
    nexusAIHistory.shift();
  }
}

function obtenerContextoProductosIA() {
  return state.productos
    .slice(0, 50)
    .map(product => ({
      id: String(product.id),
      nombre: safeText(product.nombre, 120),
      marca: safeText(product.marca, 80),
      categoria: safeText(product.categoria, 80),
      descripcion: safeText(product.descripcion, 240),
      precio: Math.max(0, safeNumber(product.precio, 0)),
      stock: Math.max(0, Math.floor(safeNumber(product.stock, 0))),
      gaming: Boolean(product.gaming),
      proveedor: safeText(product.proveedorNombre, 100)
    }));
}

function obtenerContextoCategoriasIA() {
  return state.categorias
    .slice(0, 40)
    .map(category => ({
      id: String(category.id),
      nombre: safeText(category.nombre, 80),
      descripcion: safeText(category.descripcion, 200)
    }));
}

function obtenerContextoCarritoIA() {
  return state.carrito
    .slice(0, 20)
    .map(item => {
      const product = productById(item.productoId);
      if (!product) return null;

      return {
        producto: safeText(product.nombre, 120),
        cantidad: Math.max(1, Math.floor(safeNumber(item.cantidad, 1))),
        precioUnitario: Math.max(0, safeNumber(product.precio, 0))
      };
    })
    .filter(Boolean);
}

function obtenerContextoComparadorIA() {
  return state.comparador
    .map(productById)
    .filter(Boolean)
    .map(product => ({
      nombre: safeText(product.nombre, 120),
      marca: safeText(product.marca, 80),
      categoria: safeText(product.categoria, 80),
      precio: Math.max(0, safeNumber(product.precio, 0)),
      stock: Math.max(0, Math.floor(safeNumber(product.stock, 0))),
      descripcion: safeText(product.descripcion, 200)
    }));
}

async function verificarNexusAI(force = false) {
  if (nexusAIHealthChecked && !force) return;

  setNexusAIStatus("checking", "Verificando IA...");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${NEXUS_AI.baseUrl}/api/health`, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timer);
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.configured) {
      setNexusAIStatus("online", "IA real conectada");
      nexusAIHealthChecked = true;
      return;
    }

    setNexusAIStatus("offline", "Falta configurar la API key");
  } catch {
    setNexusAIStatus("offline", "Servidor IA apagado");
  }
}

async function enviarMensajeNexusAI(text) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    NEXUS_AI.timeoutMs
  );

  try {
    const response = await fetch(`${NEXUS_AI.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        mensaje: text,
        historial: nexusAIHistory,
        contexto: {
          productos: obtenerContextoProductosIA(),
          categorias: obtenerContextoCategoriasIA(),
          carrito: obtenerContextoCarritoIA(),
          comparador: obtenerContextoComparadorIA()
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        "NEXUS AI no pudo responder en este momento."
      );
    }

    const respuesta = safeText(data.respuesta, 4000);

    if (!respuesta) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    nexusAIHealthChecked = true;
    setNexusAIStatus("online", "IA real conectada");
    return respuesta;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("La IA tardó demasiado en responder. Inténtalo nuevamente.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function procesarPreguntaNexusAI(text, options = {}) {
  const cleanText = safeText(text, 600);

  if (!cleanText || nexusAIRequestInProgress) return;

  addChat(cleanText, "user");
  registrarHistorialNexusAI("user", cleanText);

  if (!options.skipLocalTools) {
    const wantsCart = quiereAgregarAlCarritoIA(cleanText);
    const buildIntent = detectarSolicitudBuildIA(cleanText);

    if (buildIntent) {
      setNexusAIFormBusy(true);

      try {
        await ejecutarHerramientaBuildIA(buildIntent);
      } catch (error) {
        addChat(
          error.message || "No fue posible generar una configuración.",
          "bot error"
        );
      } finally {
        setNexusAIFormBusy(false);
        document.getElementById("chat-input")?.focus();
      }

      return;
    }

    if (wantsCart) {
      const result = agregarUltimaBuildAlCarritoIA();

      if (result?.ok) {
        const textResult = `${result.added.length} componentes de la última build fueron agregados al carrito.`;
        addChat(textResult, "bot");
        registrarHistorialNexusAI("model", textResult);
      } else {
        addChat(result?.error || "No fue posible agregar la build al carrito.", "bot error");
      }

      return;
    }
  }

  setNexusAIFormBusy(true);
  const typing = addChatTyping();

  try {
    const respuesta = await enviarMensajeNexusAI(cleanText);
    typing.remove();
    addChat(respuesta, "bot");
    registrarHistorialNexusAI("model", respuesta);
  } catch (error) {
    typing.remove();

    addChat(
      error.message || "No fue posible conectar con NEXUS AI.",
      "bot error"
    );

    if (
      /fetch|servidor|conectar|apagado/i.test(
        String(error.message || "")
      )
    ) {
      setNexusAIStatus("offline", "Servidor IA apagado");
    }
  } finally {
    setNexusAIFormBusy(false);
    document.getElementById("chat-input")?.focus();
  }
}

let toastTimer = null;
function toast(message) {
  const box = document.getElementById("toast");
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.hidden = true, 2300);
}

// ---------- UI counters ----------

function setCount(id, number) {
  const badge = document.getElementById(id);
  badge.textContent = number;
  badge.hidden = number <= 0;
}

function updateCounters() {
  const cartCount = state.carrito.reduce((sum, item) => sum + Math.max(0, Math.floor(safeNumber(item.cantidad, 0))), 0);
  setCount("count-cart", cartCount);
  setCount("count-favorites", state.favoritos.length);
  setCount("count-compare", state.comparador.length);
}

// ---------- Render general ----------

function renderAll() {
  renderNavCategories();
  renderCategories();
  renderNovelties();
  loadFilterOptions();
  syncFilters();
  renderCatalog();
  updateCart();
  updateCompare();
  updateCounters();
  renderSession();
  window.NexusPCBuilder?.refresh();
}




// ---------- Puente seguro para NEXUS PC Builder ----------

window.NEXUS_STORE_API = {
  getProducts() {
    return state.productos.slice();
  },

  formatPrice(value) {
    return formatearColones(value);
  },

  addProductsToCart(ids) {
    const uniqueIds = [...new Set((Array.isArray(ids) ? ids : []).map(String))];
    const added = [];
    const skipped = [];

    uniqueIds.forEach(id => {
      const product = productById(id);

      if (!product || product.stock <= 0) {
        skipped.push(product ? product.nombre : id);
        return;
      }

      const current = cartQty(id);

      if (current >= product.stock) {
        skipped.push(product.nombre);
        return;
      }

      const item = state.carrito.find(row => String(row.productoId) === id);

      if (item) item.cantidad += 1;
      else state.carrito.push({ productoId: id, cantidad: 1 });

      added.push(product.nombre);
    });

    if (added.length) {
      writeList(CLAVES.carrito, state.carrito);
      updateCart();
      updateCounters();
    }

    return { added, skipped };
  },

  openCart() {
    openCart();
  },

  openAI(prompt = "", autoSend = false) {
    const chat = document.getElementById("chat");
    const input = document.getElementById("chat-input");

    if (!chat || !input) return;

    chat.hidden = false;
    verificarNexusAI();

    const cleanPrompt = safeText(prompt, 600);

    if (autoSend && cleanPrompt && !nexusAIRequestInProgress) {
      procesarPreguntaNexusAI(cleanPrompt);
      return;
    }

    input.value = cleanPrompt;
    setTimeout(() => input.focus(), 80);
  },

  notify(message) {
    toast(message);
  }
};

// ---------- Tema claro / oscuro ----------

function leerTemaOscuro() {
  try {
    const saved = localStorage.getItem("modo_oscuro");

    // NEXUS usa dark mode por defecto.
    if (saved === null) {
      return true;
    }

    return saved === "true";
  } catch {
    return true;
  }
}


function actualizarBotonTemaTienda(esOscuro) {
  const button = document.getElementById("btn-tema-tienda");
  const use = document.getElementById("icono-tema-use");

  if (!button || !use) {
    return;
  }

  use.setAttribute(
    "href",
    esOscuro
      ? "#i-sun"
      : "#i-moon"
  );

  button.setAttribute(
    "aria-label",
    esOscuro
      ? "Activar modo claro"
      : "Activar modo oscuro"
  );

  button.title =
    esOscuro
      ? "Modo claro"
      : "Modo oscuro";
}


function aplicarTemaTienda() {
  const esOscuro =
    leerTemaOscuro();

  document.documentElement.setAttribute("data-theme", esOscuro ? "dark" : "light");

  actualizarBotonTemaTienda(
    esOscuro
  );
}


function alternarTemaTienda() {
  const esOscuro =
    document.documentElement
      .getAttribute("data-theme") !==
    "dark";

  document.documentElement.setAttribute("data-theme", esOscuro ? "dark" : "light");

  try {
    localStorage.setItem(
      "modo_oscuro",
      String(esOscuro)
    );
  } catch {
    // La página continúa funcionando aunque el navegador bloquee storage.
  }

  actualizarBotonTemaTienda(
    esOscuro
  );
}



// ---------- Buscador con sugerencias ----------

function cerrarSugerenciasBusqueda() {
  const box = document.getElementById("search-suggestions");

  if (box) {
    box.hidden = true;
    box.textContent = "";
  }
}


function renderSearchSuggestions(query) {
  const box = document.getElementById("search-suggestions");

  if (!box) {
    return;
  }

  const q = normalize(query);

  if (q.length < 2) {
    cerrarSugerenciasBusqueda();
    return;
  }

  const products = state.productos
    .filter(function(product) {
      return normalize(
        [
          product.nombre,
          product.marca,
          product.categoria,
          product.descripcion
        ].join(" ")
      ).includes(q);
    })
    .slice(0, 5);

  const categories = state.categorias
    .filter(function(category) {
      return normalize(category.nombre).includes(q);
    })
    .slice(0, 4);

  if (products.length === 0 && categories.length === 0) {
    cerrarSugerenciasBusqueda();
    return;
  }

  box.textContent = "";

  if (products.length) {
    const group = document.createElement("div");
    group.className = "search-suggestion-group";

    const label = document.createElement("span");
    label.className = "search-suggestion-title";
    label.textContent = "Productos";
    group.appendChild(label);

    products.forEach(function(product) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-suggestion-item";

      const img = document.createElement("img");
      img.src = product.imagen;
      img.alt = product.nombre;

      const copy = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.nombre;
      const category = document.createElement("span");
      category.textContent = product.categoria;
      copy.append(name, category);

      const price = document.createElement("span");
      price.textContent = formatearColones(product.precio);

      button.append(img, copy, price);

      button.addEventListener("click", function() {
        cerrarSugerenciasBusqueda();
        openProduct(product.id);
      });

      group.appendChild(button);
    });

    box.appendChild(group);
  }

  if (categories.length) {
    const group = document.createElement("div");
    group.className = "search-suggestion-group";

    const label = document.createElement("span");
    label.className = "search-suggestion-title";
    label.textContent = "Categorías";
    group.appendChild(label);

    categories.forEach(function(category) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-suggestion-item";
      button.innerHTML =
        '<span></span><div><strong></strong><span>Ver categoría</span></div><span>→</span>';

      button.querySelector("strong").textContent = category.nombre;

      button.addEventListener("click", function() {
        state.category = String(category.id);
        syncFilters();
        renderCatalog({ resetLimit: true });
        cerrarSugerenciasBusqueda();
        document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
      });

      group.appendChild(button);
    });

    box.appendChild(group);
  }

  box.hidden = false;
}


// ---------- Mega menú ----------

function cerrarMegaMenu() {
  const menu = document.getElementById("mega-menu-categorias");
  const button = document.getElementById("btn-categorias-menu");

  if (menu) {
    menu.hidden = true;
  }

  if (button) {
    button.setAttribute("aria-expanded", "false");
  }
}


function alternarMegaMenu() {
  const menu = document.getElementById("mega-menu-categorias");
  const button = document.getElementById("btn-categorias-menu");

  if (!menu || !button) {
    return;
  }

  const open = menu.hidden;
  menu.hidden = !open;
  button.setAttribute("aria-expanded", open ? "true" : "false");
}


// ---------- Eventos ----------

function bindEvents() {
  document
    .getElementById("btn-tema-tienda")
    .addEventListener(
      "click",
      alternarTemaTienda
    );

  const categoryMenuButton =
    document.getElementById(
      "btn-categorias-menu"
    );

  if (categoryMenuButton) {
    categoryMenuButton.addEventListener(
      "click",
      alternarMegaMenu
    );
  }

  const continuarComprando =
    document.getElementById(
      "continuar-comprando"
    );

  if (continuarComprando) {
    continuarComprando.addEventListener(
      "click",
      closeDrawers
    );
  }

  document.getElementById("form-busqueda").addEventListener("submit", e => {
    e.preventDefault();
    state.search = document.getElementById("buscador").value.trim();
    cerrarSugerenciasBusqueda();
    renderCatalog({ resetLimit: true });
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("buscador").addEventListener("input", e => {
    state.search = e.target.value.trim();
    renderCatalog({ resetLimit: true });
    renderSearchSuggestions(state.search);
  });

  document.getElementById("buscador").addEventListener("focus", e => {
    renderSearchSuggestions(e.target.value.trim());
  });

  [
    ["filter-category", "category"],
    ["filter-brand", "brand"],
    ["filter-price", "price"],
    ["filter-stock", "stock"],
    ["filter-gaming", "gaming"],
    ["sort-products", "sort"]
  ].forEach(([id, key]) => {
    document.getElementById(id).addEventListener("change", e => {
      state[key] = e.target.value;

      if (key === "category") {
        actualizarOpcionesFiltroMarca();
      }

      renderCatalog({ resetLimit: true });
    });
  });

  document.getElementById("catalog-load-more").addEventListener("click", loadMoreCatalogProducts);
  document.getElementById("catalog-view-all").addEventListener("click", viewAllCatalogProducts);
  document.getElementById("catalog-back-top").addEventListener("click", backToCatalogTop);

  document.getElementById("clear-filters").addEventListener("click", clearFilters);
  document.getElementById("btn-carrito").addEventListener("click", openCart);
  document.getElementById("close-cart").addEventListener("click", closeDrawers);
  document.getElementById("overlay").addEventListener("click", closeDrawers);
  document.getElementById("btn-mobile-filters").addEventListener("click", openMobileFilters);
  document.getElementById("close-filters").addEventListener("click", closeDrawers);
  document.getElementById("checkout").addEventListener("click", openCheckout);
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal").addEventListener("click", e => { if (e.target === e.currentTarget) closeModal(); });
  document.getElementById("open-compare").addEventListener("click", openCompare);
  document.getElementById("btn-comparar-header").addEventListener("click", openCompare);
  document.getElementById("btn-favoritos").addEventListener("click", showFavorites);
  document.getElementById("mobile-favorites").addEventListener("click", showFavorites);

  document.getElementById("mobile-search").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("buscador").focus();
  });

  document.querySelectorAll("[data-scroll]").forEach(button => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-category-text]").forEach(button => {
    button.addEventListener("click", () => {
      const text = normalize(button.dataset.categoryText);
      const category = state.categorias.find(item => normalize(item.nombre).includes(text));
      state.category = category ? category.id : button.dataset.categoryText;
      syncFilters();
      renderCatalog({ resetLimit: true });
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
  });

  const menu = document.getElementById("mobile-menu");
  const menuButton = document.getElementById("btn-menu");
  const closeMenu = () => { menu.hidden = true; };
  menuButton.addEventListener("click", () => menu.hidden = !menu.hidden);
  document.getElementById("btn-menu-close").addEventListener("click", closeMenu);
  menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

  document.getElementById("chat-button").addEventListener("click", () => {
    const chat = document.getElementById("chat");
    chat.hidden = !chat.hidden;

    if (!chat.hidden) {
      verificarNexusAI();
      setTimeout(() => document.getElementById("chat-input")?.focus(), 80);
    }
  });

  document.getElementById("close-chat").addEventListener("click", () => {
    document.getElementById("chat").hidden = true;
  });

  document.getElementById("chat-form").addEventListener("submit", async e => {
    e.preventDefault();

    const input = document.getElementById("chat-input");
    const text = input.value.trim();

    if (!text || nexusAIRequestInProgress) return;

    input.value = "";
    await procesarPreguntaNexusAI(text);
  });

  document.querySelectorAll("[data-ai-prompt]").forEach(button => {
    button.addEventListener("click", async () => {
      if (nexusAIRequestInProgress) return;
      await procesarPreguntaNexusAI(button.dataset.aiPrompt || "");
    });
  });

  document.getElementById("btn-points").addEventListener("click", () => toast("NEXUS Rewards queda preparado para conectarse con la futura cuenta del cliente."));
  document.getElementById("btn-builder").addEventListener("click", () => {
    if (window.NexusPCBuilder) {
      window.NexusPCBuilder.open();
      return;
    }

    toast("El configurador todavía se está cargando.");
  });

  const abrirNexusAIDesdeFooter = () => {
    const chat = document.getElementById("chat");
    if (!chat) return;

    chat.hidden = false;
    verificarNexusAI();

    setTimeout(() => {
      document.getElementById("chat-input")?.focus();
    }, 80);
  };

  document.getElementById("footer-ai-cta")?.addEventListener("click", abrirNexusAIDesdeFooter);
  document.getElementById("footer-ai-link")?.addEventListener("click", abrirNexusAIDesdeFooter);

  document.addEventListener("click", function(event) {
    const searchShell = document.querySelector(".search-shell");
    const megaMenu = document.getElementById("mega-menu-categorias");
    const megaButton = document.getElementById("btn-categorias-menu");

    if (searchShell && !searchShell.contains(event.target)) {
      cerrarSugerenciasBusqueda();
    }

    if (
      megaMenu &&
      megaButton &&
      !megaMenu.contains(event.target) &&
      !megaButton.contains(event.target)
    ) {
      cerrarMegaMenu();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal();
      closeDrawers();
      document.getElementById("chat").hidden = true;
      menu.hidden = true;
      cerrarSugerenciasBusqueda();
      cerrarMegaMenu();
    }
  });

  window.addEventListener("storage", e => {
    if ([CLAVES.productos, CLAVES.categorias, CLAVES.proveedores, CLAVES.usuario].includes(e.key)) {
      cargarProductos();
      renderAll();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTemaTienda();
  cargarProductos();
  bindEvents();
  renderAll();
});
