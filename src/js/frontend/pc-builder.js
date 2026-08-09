// ======================================================
// NEXUS PC BUILDER · Configurador funcional
// Usa inventario real de LocalStorage a través de NEXUS_STORE_API.
// ======================================================

(() => {
  "use strict";

  const STORAGE_KEY = "nexus_pc_builder_v1";

  const STEPS = [
    { key: "cpu", label: "Procesador", category: "procesadores", icon: "cpu", description: "Selecciona el procesador que será la base de tu configuración." },
    { key: "motherboard", label: "Motherboard", category: "placas madre", icon: "circuit-board", description: "La motherboard debe usar el mismo socket que el procesador." },
    { key: "gpu", label: "Tarjeta gráfica", category: "tarjetas graficas", icon: "monitor-cog", description: "Elige la GPU. NEXUS comprobará espacio del case y potencia recomendada." },
    { key: "ram", label: "Memoria RAM", category: "memoria ram", icon: "memory-stick", description: "La memoria debe coincidir con el tipo soportado por la motherboard." },
    { key: "storage", label: "Almacenamiento", category: "almacenamiento", icon: "hard-drive", description: "Selecciona una unidad de almacenamiento disponible en el inventario." },
    { key: "psu", label: "Fuente", category: "fuentes de poder", icon: "zap", description: "La fuente debe cubrir el consumo estimado y la recomendación de la GPU." },
    { key: "case", label: "Case", category: "gabinetes", icon: "box", description: "El gabinete debe admitir el formato de la motherboard y la longitud de la GPU." }
  ];

  const state = {
    activeStep: "cpu",
    search: "",
    tier: "",
    budget: 0,
    selections: {
      cpu: "",
      motherboard: "",
      gpu: "",
      ram: "",
      storage: "",
      psu: "",
      case: ""
    }
  };

  const specCache = new WeakMap();
  let builderSearchTimer = null;

  const $ = id => document.getElementById(id);

  function api() {
    return window.NEXUS_STORE_API || null;
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function formatPrice(value) {
    return api()?.formatPrice?.(value) || ("₡" + Math.round(Number(value || 0)).toLocaleString("es-CR"));
  }

  function products() {
    return api()?.getProducts?.() || [];
  }

  function productById(id) {
    const direct = api()?.getProductById?.(id);
    if (direct) return direct;
    return products().find(product => String(product.id) === String(id)) || null;
  }

  function computeSpecFor(product) {
    if (!product) return null;

    const key = normalize(product.nombre);
    const known = window.NEXUS_PC_SPECS?.[key];

    if (known) return { ...known };

    const category = normalize(product.categoria);
    const name = normalize(product.nombre);

    if (category.includes("procesadores")) {
      // AMD AM4: Ryzen 3000/4000G/5000 de escritorio.
      if (/ryzen\s+[3579]\s+[345]\d{3}/.test(name) || /ryzen\s+[3579]\s+5\d{3}/.test(name)) {
        return { type: "cpu", socket: "AM4", power: 65, performance: 45, tier: "entrada", inferred: true };
      }

      // AMD AM5: Ryzen 7000/8000G/9000.
      if (/ryzen\s+[3579]\s+[789]\d{3}/.test(name)) {
        return { type: "cpu", socket: "AM5", power: 65, performance: 60, tier: "media", inferred: true };
      }

      if (name.includes("core ultra") && /2\d{2}/.test(name)) {
        return { type: "cpu", socket: "LGA1851", power: 125, performance: 60, tier: "media", inferred: true };
      }

      // Intel 10ª y 11ª generación: LGA1200.
      if (/core i[3579]-1[01]\d{3}/.test(name)) {
        return {
          type: "cpu",
          socket: "LGA1200",
          power: /k\b/.test(name) ? 125 : 65,
          performance: name.includes("i3") ? 28 : name.includes("i5") ? 45 : name.includes("i7") ? 58 : 68,
          tier: name.includes("i3") ? "entrada" : name.includes("i5") ? "media" : "alta",
          inferred: true
        };
      }

      // Intel 12ª, 13ª y 14ª generación: LGA1700.
      if (/core i[3579]-1[234]\d{3}/.test(name)) {
        return { type: "cpu", socket: "LGA1700", power: name.includes("i3") ? 60 : 65, performance: name.includes("i3") ? 38 : 55, tier: name.includes("i3") ? "entrada" : "media", inferred: true };
      }
    }

    if (category.includes("placas madre")) {
      const micro = /\bm(atx)?\b|micro[- ]?atx/.test(name);
      const formFactor = micro ? "Micro-ATX" : "ATX";

      if (/(a520|b450|b550|x570)/.test(name)) {
        return { type: "motherboard", socket: "AM4", ramType: "DDR4", formFactor, m2: true, power: 48, tier: /a520/.test(name) ? "entrada" : "media", inferred: true };
      }

      if (/(a620|b650|x670|x870|b850|b840)/.test(name)) {
        return { type: "motherboard", socket: "AM5", ramType: "DDR5", formFactor, m2: true, power: 52, tier: /a620/.test(name) ? "entrada" : /b650/.test(name) ? "media" : "alta", inferred: true };
      }

      // LGA1200. Se infieren automáticamente placas 500-series,
      // que son una base segura para 10ª/11ª generación en este proyecto.
      if (/(h510|b560|h570|z590)/.test(name)) {
        return {
          type: "motherboard",
          socket: "LGA1200",
          ramType: "DDR4",
          formFactor,
          m2: true,
          power: 48,
          tier: /h510/.test(name) ? "entrada" : /(b560|h570)/.test(name) ? "media" : "alta",
          inferred: true
        };
      }

      if (/(h610|b660|z690|b760|z790)/.test(name)) {
        const ramType = /(d4|ddr4)/.test(name) ? "DDR4" : "DDR5";
        return { type: "motherboard", socket: "LGA1700", ramType, formFactor, m2: true, power: 50, tier: /(h610)/.test(name) ? "entrada" : /(b660|b760)/.test(name) ? "media" : "alta", inferred: true };
      }

      if (/(b860|z890)/.test(name)) {
        return { type: "motherboard", socket: "LGA1851", ramType: "DDR5", formFactor, m2: true, power: 55, tier: /b860/.test(name) ? "media" : "alta", inferred: true };
      }
    }

    if (category.includes("memoria ram")) {
      const ramType = name.includes("ddr5") ? "DDR5" : name.includes("ddr4") ? "DDR4" : "";
      return { type: "ram", ramType, power: 10, tier: name.includes("16gb") ? "entrada" : "media", inferred: true };
    }

    if (category.includes("almacenamiento")) {
      return { type: "storage", interface: "M.2 NVMe", power: 8, tier: name.includes("1tb") ? "entrada" : "media", inferred: true };
    }

    if (category.includes("fuentes de poder")) {
      const watts = Number((name.match(/(\d{3,4})\s*w?/) || [])[1] || 0);
      return { type: "psu", watts, power: 0, tier: watts && watts <= 650 ? "entrada" : watts <= 850 ? "media" : "alta", inferred: true };
    }

    if (category.includes("tarjetas graficas")) {
      return { type: "gpu", power: 250, lengthMm: 300, recommendedPsu: 700, performance: 50, tier: "media", inferred: true };
    }

    if (category.includes("gabinetes")) {
      return { type: "case", formFactors: ["ATX", "Micro-ATX", "Mini-ITX"], gpuMaxMm: 360, power: 0, tier: "media", inferred: true };
    }

    return null;
  }

  function specFor(product) {
    if (!product || typeof product !== "object") return null;
    if (specCache.has(product)) return specCache.get(product);

    const spec = computeSpecFor(product);
    specCache.set(product, spec);
    return spec;
  }

  function typeForProduct(product) {
    const category = normalize(product?.categoria);
    const step = STEPS.find(item => category === item.category || category.includes(item.category));
    return step?.key || "";
  }

  function productsForStep(stepKey) {
    return products().filter(product => typeForProduct(product) === stepKey);
  }

  function selectedProduct(stepKey) {
    return productById(state.selections[stepKey]);
  }

  function selectedSpec(stepKey) {
    return specFor(selectedProduct(stepKey));
  }

  function selectedProducts() {
    return STEPS.map(step => selectedProduct(step.key)).filter(Boolean);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeStep: state.activeStep,
        tier: state.tier,
        budget: state.budget,
        selections: state.selections
      }));
    } catch {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const value = JSON.parse(raw);

      if (value && typeof value === "object") {
        if (STEPS.some(step => step.key === value.activeStep)) state.activeStep = value.activeStep;
        if (["", "entrada", "media", "alta"].includes(String(value.tier || ""))) state.tier = String(value.tier || "");
        state.budget = Math.max(0, Number(value.budget || 0));

        if (value.selections && typeof value.selections === "object") {
          STEPS.forEach(step => {
            const id = String(value.selections[step.key] || "");
            state.selections[step.key] = productById(id) ? id : "";
          });
        }
      }
    } catch {}
  }

  function totalPrice(selection = state.selections) {
    return STEPS.reduce((total, step) => {
      const product = productById(selection[step.key]);
      return total + (product ? Number(product.precio || 0) : 0);
    }, 0);
  }

  function estimatedPower(selection = state.selections) {
    let watts = 20; // ventiladores/controladores/margen base

    ["cpu", "motherboard", "gpu", "ram", "storage"].forEach(key => {
      const product = productById(selection[key]);
      const spec = specFor(product);
      if (spec?.power) watts += Number(spec.power);
    });

    return selectedCount(selection) ? Math.round(watts) : 0;
  }

  function recommendedPsu(selection = state.selections) {
    const watts = estimatedPower(selection);
    const gpu = specFor(productById(selection.gpu));
    const byLoad = watts ? Math.ceil((watts * 1.30) / 50) * 50 : 0;
    return Math.max(byLoad, Number(gpu?.recommendedPsu || 0));
  }

  function selectedCount(selection = state.selections) {
    return STEPS.filter(step => productById(selection[step.key])).length;
  }

  function evaluate(selection = state.selections) {
    const issues = [];
    const warnings = [];

    const cpu = specFor(productById(selection.cpu));
    const motherboard = specFor(productById(selection.motherboard));
    const gpu = specFor(productById(selection.gpu));
    const ram = specFor(productById(selection.ram));
    const storage = specFor(productById(selection.storage));
    const psu = specFor(productById(selection.psu));
    const pcCase = specFor(productById(selection.case));

    const selected = STEPS.map(step => ({ step, product: productById(selection[step.key]) })).filter(row => row.product);

    selected.forEach(({ step, product }) => {
      if (Number(product.stock || 0) <= 0) issues.push(`${step.label}: ${product.nombre} está agotado.`);
      if (!specFor(product)) warnings.push(`${step.label}: faltan metadatos técnicos para ${product.nombre}.`);
      else if (specFor(product).inferred) warnings.push(`${step.label}: parte de la compatibilidad de ${product.nombre} fue inferida por su nombre/categoría.`);
    });

    if (cpu && motherboard && cpu.socket && motherboard.socket && cpu.socket !== motherboard.socket) {
      issues.push(`Socket incompatible: CPU ${cpu.socket} y motherboard ${motherboard.socket}.`);
    }

    if (motherboard && ram && motherboard.ramType && ram.ramType && motherboard.ramType !== ram.ramType) {
      issues.push(`Memoria incompatible: la motherboard usa ${motherboard.ramType} y la RAM es ${ram.ramType}.`);
    }

    if (motherboard && storage && storage.interface === "M.2 NVMe" && motherboard.m2 === false) {
      issues.push("La motherboard seleccionada no dispone de una ranura M.2 compatible.");
    }

    if (motherboard && pcCase && motherboard.formFactor && Array.isArray(pcCase.formFactors) && !pcCase.formFactors.includes(motherboard.formFactor)) {
      issues.push(`El case no admite formato ${motherboard.formFactor}.`);
    }

    if (gpu && pcCase && gpu.lengthMm && pcCase.gpuMaxMm && gpu.lengthMm > pcCase.gpuMaxMm) {
      issues.push(`La GPU mide aproximadamente ${gpu.lengthMm} mm y el case admite hasta ${pcCase.gpuMaxMm} mm.`);
    }

    const minPsu = recommendedPsu(selection);
    if (psu?.watts && minPsu && psu.watts < minPsu) {
      issues.push(`Fuente insuficiente: ${psu.watts} W seleccionados; se recomiendan al menos ${minPsu} W.`);
    }

    if (selection.psu && psu && !psu.watts) warnings.push("No se pudo determinar la potencia de la fuente seleccionada.");

    return {
      issues: [...new Set(issues)],
      warnings: [...new Set(warnings)],
      complete: selectedCount(selection) === STEPS.length,
      watts: estimatedPower(selection),
      recommendedPsu: minPsu,
      total: totalPrice(selection)
    };
  }

  function candidateRelation(stepKey, candidate) {
    if (!candidate) return { ok: false, text: "Producto inválido" };
    if (Number(candidate.stock || 0) <= 0) return { ok: false, text: "Agotado" };

    const candidateSpec = specFor(candidate);
    if (!candidateSpec) return { ok: true, warning: true, text: "Revisión manual" };

    const cpu = stepKey === "cpu" ? candidateSpec : selectedSpec("cpu");
    const motherboard = stepKey === "motherboard" ? candidateSpec : selectedSpec("motherboard");
    const gpu = stepKey === "gpu" ? candidateSpec : selectedSpec("gpu");
    const ram = stepKey === "ram" ? candidateSpec : selectedSpec("ram");
    const psu = stepKey === "psu" ? candidateSpec : selectedSpec("psu");
    const pcCase = stepKey === "case" ? candidateSpec : selectedSpec("case");

    // Al cambiar un componente "aguas arriba" permitimos la selección y
    // limpiamos automáticamente las piezas dependientes incompatibles.
    // Esto evita que una motherboard vieja bloquee el cambio de CPU, o que
    // un case/PSU viejo bloquee el cambio de GPU.
    if (
      stepKey !== "cpu" &&
      cpu && motherboard &&
      cpu.socket && motherboard.socket &&
      cpu.socket !== motherboard.socket
    ) {
      return { ok: false, text: `Requiere socket ${cpu.socket}` };
    }

    if (
      stepKey !== "motherboard" &&
      motherboard && ram &&
      motherboard.ramType && ram.ramType &&
      motherboard.ramType !== ram.ramType
    ) {
      return { ok: false, text: `Requiere ${motherboard.ramType}` };
    }

    if (
      stepKey !== "motherboard" &&
      motherboard && pcCase &&
      motherboard.formFactor &&
      Array.isArray(pcCase.formFactors) &&
      !pcCase.formFactors.includes(motherboard.formFactor)
    ) {
      return { ok: false, text: `No admite ${motherboard.formFactor}` };
    }

    if (
      stepKey !== "gpu" &&
      gpu && pcCase &&
      gpu.lengthMm && pcCase.gpuMaxMm &&
      gpu.lengthMm > pcCase.gpuMaxMm
    ) {
      return { ok: false, text: `GPU ${gpu.lengthMm} mm > case ${pcCase.gpuMaxMm} mm` };
    }

    if (stepKey === "cpu" && motherboard?.socket && cpu?.socket && motherboard.socket !== cpu.socket) {
      return {
        ok: true,
        warning: true,
        text: `Cambiará la motherboard a ${cpu.socket}`
      };
    }

    if (stepKey === "motherboard") {
      const selectedRam = selectedSpec("ram");
      const selectedCase = selectedSpec("case");

      if (
        selectedRam &&
        candidateSpec.ramType &&
        selectedRam.ramType &&
        candidateSpec.ramType !== selectedRam.ramType
      ) {
        return {
          ok: true,
          warning: true,
          text: `Cambiará la RAM a ${candidateSpec.ramType}`
        };
      }

      if (
        selectedCase &&
        candidateSpec.formFactor &&
        Array.isArray(selectedCase.formFactors) &&
        !selectedCase.formFactors.includes(candidateSpec.formFactor)
      ) {
        return {
          ok: true,
          warning: true,
          text: "Cambiará el gabinete"
        };
      }
    }

    if (stepKey === "gpu") {
      const selectedCase = selectedSpec("case");
      if (
        selectedCase &&
        candidateSpec.lengthMm &&
        selectedCase.gpuMaxMm &&
        candidateSpec.lengthMm > selectedCase.gpuMaxMm
      ) {
        return {
          ok: true,
          warning: true,
          text: "Cambiará el gabinete"
        };
      }
    }

    if (stepKey === "psu" && psu?.watts) {
      const temp = { ...state.selections, psu: candidate.id };
      const required = recommendedPsu(temp);
      if (required && psu.watts < required) return { ok: false, text: `Se recomiendan ${required} W` };
    }

    return { ok: true, warning: Boolean(candidateSpec.inferred), text: candidateSpec.inferred ? "Compatibilidad inferida" : "Compatible" };
  }

  function clearDependentConflicts(changedKey) {
    const current = { ...state.selections };

    if (changedKey === "cpu") {
      const cpu = selectedSpec("cpu");
      const motherboard = selectedSpec("motherboard");
      if (cpu && motherboard && cpu.socket !== motherboard.socket) {
        current.motherboard = "";
        current.ram = "";
        current.case = "";
      }
    }

    if (changedKey === "motherboard") {
      const motherboard = selectedSpec("motherboard");
      const ram = selectedSpec("ram");
      const pcCase = selectedSpec("case");
      if (motherboard && ram && motherboard.ramType !== ram.ramType) current.ram = "";
      if (motherboard && pcCase && !pcCase.formFactors?.includes(motherboard.formFactor)) current.case = "";
    }

    if (changedKey === "gpu") {
      const gpu = selectedSpec("gpu");
      const pcCase = selectedSpec("case");
      if (gpu && pcCase && gpu.lengthMm > pcCase.gpuMaxMm) current.case = "";

      const psu = selectedSpec("psu");
      const required = recommendedPsu(current);
      if (psu?.watts && required && psu.watts < required) current.psu = "";
    }

    state.selections = current;
  }

  function nextIncompleteStep() {
    return STEPS.find(step => !selectedProduct(step.key))?.key || state.activeStep;
  }

  function selectProduct(stepKey, productId) {
    const product = productById(productId);
    if (!product) return;

    const relation = candidateRelation(stepKey, product);
    if (!relation.ok) {
      api()?.notify?.(relation.text || "Ese componente no es compatible con la configuración actual.");
      return;
    }

    state.selections[stepKey] = String(product.id);
    clearDependentConflicts(stepKey);
    state.activeStep = nextIncompleteStep();
    state.search = "";
    save();
    render();
  }

  function removeSelection(stepKey) {
    state.selections[stepKey] = "";

    if (stepKey === "cpu") {
      state.selections.motherboard = "";
      state.selections.ram = "";
      state.selections.case = "";
    }

    if (stepKey === "motherboard") {
      state.selections.ram = "";
      state.selections.case = "";
    }

    if (stepKey === "gpu") {
      state.selections.psu = "";
      state.selections.case = "";
    }

    state.activeStep = stepKey;
    save();
    render();
  }

  function stepContextText(stepKey) {
    if (stepKey === "motherboard") {
      const cpu = selectedSpec("cpu");
      if (cpu?.socket) return `Filtrando compatibilidad con socket ${cpu.socket}.`;
    }

    if (stepKey === "ram") {
      const motherboard = selectedSpec("motherboard");
      if (motherboard?.ramType) return `La motherboard seleccionada utiliza ${motherboard.ramType}.`;
    }

    if (stepKey === "psu") {
      const required = recommendedPsu();
      if (required) return `La configuración actual requiere aproximadamente una fuente de ${required} W o superior.`;
    }

    if (stepKey === "case") {
      const motherboard = selectedSpec("motherboard");
      const gpu = selectedSpec("gpu");
      const parts = [];
      if (motherboard?.formFactor) parts.push(`motherboard ${motherboard.formFactor}`);
      if (gpu?.lengthMm) parts.push(`GPU de ~${gpu.lengthMm} mm`);
      if (parts.length) return `Buscando espacio para ${parts.join(" y ")}.`;
    }

    return "Todos los productos se leen directamente del inventario actual de NEXUS.";
  }

  function tierLabel(value) {
    if (value === "entrada") return "Gama de entrada";
    if (value === "media") return "Gama media";
    if (value === "alta") return "Gama alta";
    return "Gama sin clasificar";
  }

  function tierRank(value) {
    return value === "entrada" ? 1 : value === "media" ? 2 : value === "alta" ? 3 : 0;
  }

  function specsText(product) {
    const spec = specFor(product);
    if (!spec) return ["Sin ficha técnica"];

    if (spec.type === "cpu") return [spec.socket, `${spec.power || "?"} W`];
    if (spec.type === "motherboard") return [spec.socket, spec.ramType, spec.formFactor];
    if (spec.type === "gpu") return [`${spec.power || "?"} W`, `${spec.lengthMm || "?"} mm`, `PSU ${spec.recommendedPsu || "?"} W`];
    if (spec.type === "ram") return [spec.ramType || "RAM", product.nombre.match(/\d+GB/i)?.[0] || ""];
    if (spec.type === "storage") return [spec.interface || "Almacenamiento", product.nombre.match(/\d+TB/i)?.[0] || ""];
    if (spec.type === "psu") return [`${spec.watts || "?"} W`];
    if (spec.type === "case") return [`GPU máx. ${spec.gpuMaxMm || "?"} mm`, (spec.formFactors || []).join(" / ")];
    return [];
  }

  function renderStepList() {
    const list = $("pc-builder-step-list");
    if (!list) return;
    list.textContent = "";

    STEPS.forEach((step, index) => {
      const product = selectedProduct(step.key);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pc-builder-step";
      if (step.key === state.activeStep) button.classList.add("active");
      if (product) button.classList.add("done");

      const number = document.createElement("span");
      number.className = "pc-builder-step-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", step.icon);
      icon.setAttribute("aria-hidden", "true");

      const copy = document.createElement("span");
      copy.className = "pc-builder-step-copy";
      const strong = document.createElement("strong");
      strong.textContent = step.label;
      const small = document.createElement("small");
      small.textContent = product ? product.nombre : "Pendiente";
      copy.append(strong, small);

      button.append(number, icon, copy);

      if (product) {
        const remove = document.createElement("span");
        remove.className = "pc-builder-step-remove";
        remove.title = "Quitar selección";
        remove.setAttribute("role", "button");
        remove.setAttribute("tabindex", "0");
        remove.textContent = "×";
        remove.addEventListener("click", event => {
          event.stopPropagation();
          removeSelection(step.key);
        });
        remove.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            removeSelection(step.key);
          }
        });
        button.append(remove);
      }

      button.addEventListener("click", () => {
        state.activeStep = step.key;
        state.search = "";
        save();
        render();
      });

      list.append(button);
    });
  }

  function renderProductGrid() {
    const step = STEPS.find(item => item.key === state.activeStep) || STEPS[0];
    const grid = $("pc-builder-product-grid");
    if (!grid) return;

    $("pc-builder-step-kicker").textContent = `PASO ${STEPS.indexOf(step) + 1} DE ${STEPS.length}`;
    $("pc-builder-step-title").textContent = step.label;
    $("pc-builder-step-description").textContent = step.description;
    $("pc-builder-context-note").textContent = stepContextText(step.key);

    const search = normalize(state.search);
    let list = productsForStep(step.key);
    if (search) list = list.filter(product => normalize(`${product.nombre} ${product.marca}`).includes(search));

    if (state.tier) {
      list = list.filter(product => specFor(product)?.tier === state.tier);
    }

    list.sort((a, b) => {
      const aRel = candidateRelation(step.key, a);
      const bRel = candidateRelation(step.key, b);
      if (aRel.ok !== bRel.ok) return aRel.ok ? -1 : 1;
      if ((a.stock > 0) !== (b.stock > 0)) return a.stock > 0 ? -1 : 1;

      const tierDifference = tierRank(specFor(a)?.tier) - tierRank(specFor(b)?.tier);
      if (tierDifference !== 0) return tierDifference;

      return Number(a.precio || 0) - Number(b.precio || 0);
    });

    grid.textContent = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "pc-builder-empty";
      empty.innerHTML = `<strong>No hay productos para este paso${state.tier ? " en " + tierLabel(state.tier).toLowerCase() : ""}.</strong><span>Prueba otra gama, cambia la búsqueda o importa el pack de componentes ampliado.</span>`;
      grid.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach(product => {
      const relation = candidateRelation(step.key, product);
      const selected = String(state.selections[step.key]) === String(product.id);
      const card = document.createElement("article");
      card.className = "pc-builder-product-card" + (selected ? " selected" : "") + (!relation.ok ? " incompatible" : "");

      const media = document.createElement("div");
      media.className = "pc-builder-product-media";
      const img = document.createElement("img");
      img.src = product.imagen;
      img.alt = product.nombre;
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.src = "../src/imgs/producto-default.svg";
        card.classList.add("image-fallback");
      });
      media.append(img);

      const badge = document.createElement("span");
      badge.className = "pc-builder-compat-badge " + (relation.ok ? (relation.warning ? "warning" : "ok") : "bad");
      badge.textContent = relation.text;
      media.append(badge);

      const body = document.createElement("div");
      body.className = "pc-builder-product-body";

      const meta = document.createElement("div");
      meta.className = "pc-builder-product-meta";

      const brand = document.createElement("small");
      brand.textContent = product.marca || "NEXUS";

      const productTier = specFor(product)?.tier || "";
      const tier = document.createElement("span");
      tier.className = "pc-builder-tier-badge " + (productTier || "unknown");
      tier.textContent = tierLabel(productTier);

      meta.append(brand, tier);

      const title = document.createElement("h4");
      title.textContent = product.nombre;

      const chips = document.createElement("div");
      chips.className = "pc-builder-spec-chips";
      specsText(product).filter(Boolean).forEach(text => {
        const chip = document.createElement("span");
        chip.textContent = text;
        chips.append(chip);
      });

      const footer = document.createElement("div");
      footer.className = "pc-builder-product-footer";
      const price = document.createElement("strong");
      price.textContent = formatPrice(product.precio);
      const stock = document.createElement("small");
      stock.textContent = product.stock > 0 ? `${product.stock} en stock` : "Agotado";
      footer.append(price, stock);

      const select = document.createElement("button");
      select.type = "button";
      select.className = "pc-builder-select-button";
      select.disabled = !relation.ok || selected;
      select.textContent = selected ? "Seleccionado ✓" : relation.ok ? "Seleccionar" : "Incompatible";
      select.addEventListener("click", () => selectProduct(step.key, product.id));

      body.append(meta, title, chips, footer, select);
      card.append(media, body);
      fragment.append(card);
    });

    grid.append(fragment);
  }

  function renderSelectedList() {
    const list = $("pc-builder-selected-list");
    if (!list) return;
    list.textContent = "";

    STEPS.forEach(step => {
      const product = selectedProduct(step.key);
      const row = document.createElement("div");
      row.className = "pc-builder-selected-row" + (product ? " filled" : "");

      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", step.icon);
      icon.setAttribute("aria-hidden", "true");

      const copy = document.createElement("div");
      const small = document.createElement("small");
      small.textContent = step.label;
      const strong = document.createElement("strong");
      strong.textContent = product ? product.nombre : "Pendiente";
      copy.append(small, strong);

      const price = document.createElement("span");
      price.textContent = product ? formatPrice(product.precio) : "—";

      row.append(icon, copy, price);
      row.addEventListener("click", () => {
        state.activeStep = step.key;
        render();
      });
      list.append(row);
    });
  }

  function renderIssues(result) {
    const box = $("pc-builder-issues");
    if (!box) return;
    box.textContent = "";

    if (result.issues.length) {
      result.issues.forEach(text => {
        const item = document.createElement("div");
        item.className = "pc-builder-issue error";
        item.innerHTML = '<i data-lucide="circle-x" aria-hidden="true"></i><span></span>';
        item.querySelector("span").textContent = text;
        box.append(item);
      });
      return;
    }

    if (result.warnings.length) {
      const item = document.createElement("div");
      item.className = "pc-builder-issue warning";
      item.innerHTML = '<i data-lucide="triangle-alert" aria-hidden="true"></i><span></span>';
      item.querySelector("span").textContent = "Sin conflictos conocidos. Algunas fichas usan datos inferidos y deben verificarse para una compra real.";
      box.append(item);
      return;
    }

    const item = document.createElement("div");
    item.className = "pc-builder-issue success";
    item.innerHTML = '<i data-lucide="circle-check" aria-hidden="true"></i><span></span>';
    item.querySelector("span").textContent = result.complete ? "Configuración completa y sin conflictos conocidos." : "No hay conflictos conocidos entre los componentes seleccionados.";
    box.append(item);
  }

  function statusText(result) {
    if (result.issues.length) return `${result.issues.length} conflicto${result.issues.length === 1 ? "" : "s"}`;
    if (result.complete) return "Todo compatible";
    if (selectedCount()) return "Sin conflictos";
    return "Listo para empezar";
  }

  function renderSummary() {
    const result = evaluate();
    const count = selectedCount();
    const psu = selectedSpec("psu");
    const load = psu?.watts && result.watts ? Math.min(100, Math.round((result.watts / psu.watts) * 100)) : 0;

    $("pc-builder-summary-status").textContent = statusText(result);
    $("pc-builder-summary-count").textContent = `${count} / ${STEPS.length}`;
    $("pc-builder-summary-watts").textContent = `${result.watts} W`;
    $("pc-builder-summary-psu").textContent = result.recommendedPsu ? `${result.recommendedPsu} W` : "—";
    $("pc-builder-summary-total").textContent = formatPrice(result.total);

    const budgetRow = $("pc-builder-budget-row");
    if (state.budget > 0) {
      budgetRow.hidden = false;
      const remaining = state.budget - result.total;
      const remainingEl = $("pc-builder-summary-remaining");
      remainingEl.textContent = (remaining < 0 ? "−" : "") + formatPrice(Math.abs(remaining));
      remainingEl.classList.toggle("negative", remaining < 0);
    } else {
      budgetRow.hidden = true;
    }

    const add = $("pc-builder-add-cart");
    add.disabled = !result.complete || result.issues.length > 0 || selectedProducts().some(product => product.stock <= 0);

    renderSelectedList();
    renderIssues(result);
    renderMainPreview();
  }

  function renderMainPreview() {
    const result = evaluate();
    const count = selectedCount();
    const percent = Math.round((count / STEPS.length) * 100);
    const psu = selectedSpec("psu");
    const load = psu?.watts && result.watts ? Math.min(100, Math.round((result.watts / psu.watts) * 100)) : 0;

    const progressLabel = $("builder-main-progress-label");
    const progressCount = $("builder-main-progress-count");
    const progressBar = $("builder-main-progress-bar");
    if (progressLabel) progressLabel.textContent = count ? (result.complete ? "Configuración completa" : "Configuración en curso") : "Listo para empezar";
    if (progressCount) progressCount.textContent = `${count} / ${STEPS.length}`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    const status = $("builder-main-status");
    if (status) {
      status.classList.toggle("has-error", result.issues.length > 0);
      status.classList.toggle("complete", result.complete && !result.issues.length);
      const text = status.querySelector("span");
      if (text) text.textContent = statusText(result);
    }

    $("builder-main-compatibility") && ($("builder-main-compatibility").textContent = statusText(result));
    $("builder-main-watts") && ($("builder-main-watts").textContent = `${result.watts} W`);
    $("builder-main-load") && ($("builder-main-load").textContent = psu?.watts ? `${load}%` : "—");
    $("builder-main-meter") && ($("builder-main-meter").style.width = `${load}%`);
    $("builder-main-total") && ($("builder-main-total").textContent = formatPrice(result.total));
    $("builder-main-psu-note") && ($("builder-main-psu-note").textContent = result.recommendedPsu ? `Fuente recomendada: ${result.recommendedPsu} W o superior.` : "Selecciona CPU y GPU para calcular la fuente recomendada.");

    const button = $("btn-builder");
    if (button) button.childNodes[0].textContent = count ? "Continuar configuración " : "Abrir configurador ";

    document.querySelectorAll("[data-builder-main-step]").forEach((row, index) => {
      const step = STEPS[index];
      const product = selectedProduct(step.key);
      row.classList.toggle("done", Boolean(product));
      row.classList.toggle("active", step.key === nextIncompleteStep() && !result.complete);
      const small = row.querySelector("small");
      if (small) small.textContent = product ? product.nombre : "Pendiente";
      const marker = row.querySelector("b");
      if (marker) marker.textContent = product ? "✓" : step.key === nextIncompleteStep() && !result.complete ? "→" : "";
    });
  }

  function render() {
    const step = STEPS.find(item => item.key === state.activeStep) || STEPS[0];
    state.activeStep = step.key;

    const searchInput = $("pc-builder-search");
    if (searchInput && searchInput.value !== state.search) searchInput.value = state.search;

    const tierSelect = $("pc-builder-tier");
    if (tierSelect && tierSelect.value !== state.tier) tierSelect.value = state.tier;

    const budgetInput = $("pc-builder-budget");
    if (budgetInput && Number(budgetInput.value || 0) !== state.budget) budgetInput.value = state.budget || "";

    renderStepList();
    renderProductGrid();
    renderSummary();

    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function reset() {
    STEPS.forEach(step => state.selections[step.key] = "");
    state.activeStep = "cpu";
    state.search = "";
    state.tier = "";
    state.budget = 0;
    save();
    render();
  }

  function addBuildToCart() {
    const result = evaluate();
    if (!result.complete || result.issues.length) {
      api()?.notify?.("Completa una configuración compatible antes de agregarla al carrito.");
      return;
    }

    const response = api()?.addProductsToCart?.(STEPS.map(step => state.selections[step.key]));
    if (!response) return;

    if (response.added.length) {
      api()?.notify?.(`${response.added.length} componentes agregados al carrito.`);
      close();
      api()?.openCart?.();
    }

    if (response.skipped.length) {
      api()?.notify?.(`Algunos componentes no pudieron agregarse por stock: ${response.skipped.join(", ")}.`);
    }
  }

  function askAI() {
    const result = evaluate();
    const lines = STEPS.map(step => {
      const product = selectedProduct(step.key);
      return `${step.label}: ${product ? `${product.nombre} (${formatPrice(product.precio)})` : "sin seleccionar"}`;
    });

    const prompt = [
      "Analiza esta configuración que armé en NEXUS.",
      ...lines,
      `Total: ${formatPrice(result.total)}.`,
      `Consumo estimado local: ${result.watts} W.`,
      `Fuente recomendada local: ${result.recommendedPsu || "sin calcular"} W.`,
      result.issues.length ? `Conflictos detectados por el builder: ${result.issues.join(" | ")}` : "El builder no detectó conflictos conocidos.",
      "Dime si está equilibrada, para qué resolución o uso la recomendarías y qué mejorarías usando únicamente el inventario NEXUS."
    ].join("\n");

    close();
    api()?.openAI?.(prompt, true);
  }

  function cheapest(list) {
    return list.filter(p => p.stock > 0).sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))[0] || null;
  }


  function normalizeBrandPreference(value) {
    const text = normalize(value);
    if (!text) return "";
    if (text.includes("nvidia") || text.includes("geforce")) return "nvidia";
    if (text.includes("amd") || text.includes("radeon") || text.includes("ryzen")) return "amd";
    if (text.includes("intel") || text.includes("arc") || text.includes("core")) return "intel";
    return text;
  }

  function productBrandKey(product) {
    const text = normalize(`${product?.marca || ""} ${product?.nombre || ""}`);
    if (text.includes("nvidia") || text.includes("geforce")) return "nvidia";
    if (text.includes("amd") || text.includes("radeon") || text.includes("ryzen")) return "amd";
    if (text.includes("intel") || text.includes("arc") || text.includes("core")) return "intel";
    return normalize(product?.marca || "");
  }

  function componentCapacityGb(product) {
    const name = normalize(product?.nombre || "");

    const tb = name.match(/(\d+(?:[.,]\d+)?)\s*tb\b/);
    if (tb) return Math.round(Number(tb[1].replace(",", ".")) * 1024);

    const gb = name.match(/(\d{1,4})\s*gb\b/);
    if (gb) return Number(gb[1]);

    return 0;
  }

  function normalizeResolution(value) {
    const text = normalize(value);

    if (text.includes("4k") || text.includes("2160")) return "4k";
    if (text.includes("1440") || text.includes("2k") || text.includes("qhd")) return "1440p";
    if (text.includes("1080") || text.includes("full hd") || text.includes("fhd")) return "1080p";

    return "";
  }

  function normalizeSocket(value) {
    const text = String(value || "").toUpperCase().replace(/\s+/g, "");
    const sockets = ["AM4", "AM5", "LGA1200", "LGA1700", "LGA1851"];
    return sockets.find(socket => text.includes(socket)) || "";
  }

  function normalizeTier(value) {
    const text = normalize(value);
    if (text.includes("entrada") || text.includes("econom")) return "entrada";
    if (text.includes("media")) return "media";
    if (text.includes("alta") || text.includes("entusiasta")) return "alta";
    return "";
  }

  function resolutionProfile(resolution, usage = "gaming") {
    const normalizedResolution = normalizeResolution(resolution);
    const normalizedUsage = normalize(usage);

    if (normalizedResolution === "4k") {
      return { resolution: "4k", gpuTarget: 72, cpuTarget: 42, gpuWeight: 5.2, cpuWeight: 1.9 };
    }

    if (normalizedResolution === "1440p") {
      return { resolution: "1440p", gpuTarget: 52, cpuTarget: 36, gpuWeight: 4.8, cpuWeight: 2.1 };
    }

    if (normalizedResolution === "1080p") {
      return { resolution: "1080p", gpuTarget: 32, cpuTarget: 30, gpuWeight: 4.0, cpuWeight: 2.5 };
    }

    if (
      normalizedUsage.includes("trabajo") ||
      normalizedUsage.includes("program") ||
      normalizedUsage.includes("edicion") ||
      normalizedUsage.includes("render")
    ) {
      return { resolution: "", gpuTarget: 28, cpuTarget: 45, gpuWeight: 2.2, cpuWeight: 4.1 };
    }

    return { resolution: "1080p", gpuTarget: 32, cpuTarget: 30, gpuWeight: 4.0, cpuWeight: 2.5 };
  }

  function normalizeBuildOptions(raw = {}) {
    const budget = Math.max(0, Math.floor(Number(raw.budget || raw.presupuesto || 0)));
    const resolution = normalizeResolution(raw.resolution || raw.resolucion || "");
    const usage = normalize(raw.usage || raw.uso || "gaming") || "gaming";
    const cpuBrand = normalizeBrandPreference(raw.cpuBrand || raw.cpuMarca || "");
    const gpuBrand = normalizeBrandPreference(raw.gpuBrand || raw.gpuMarca || "");
    const socket = normalizeSocket(raw.socket || raw.plataforma || "");
    const tier = normalizeTier(raw.tier || raw.gama || "");
    const minRamGb = Math.max(0, Math.floor(Number(raw.minRamGb || raw.ramGb || 0)));
    const minStorageGb = Math.max(0, Math.floor(Number(raw.minStorageGb || raw.storageGb || 0)));

    const excludedBrands = Array.isArray(raw.excludeBrands)
      ? raw.excludeBrands.map(normalizeBrandPreference).filter(Boolean)
      : [];

    return {
      budget,
      resolution,
      usage,
      cpuBrand,
      gpuBrand,
      socket,
      tier,
      minRamGb,
      minStorageGb,
      excludeBrands: [...new Set(excludedBrands)]
    };
  }

  function buildProducts(selection) {
    return STEPS.map(step => {
      const product = productById(selection?.[step.key]);
      if (!product) return null;

      const spec = specFor(product);

      return {
        key: step.key,
        label: step.label,
        id: String(product.id),
        nombre: product.nombre,
        marca: product.marca || "",
        categoria: product.categoria || "",
        precio: Number(product.precio || 0),
        stock: Number(product.stock || 0),
        imagen: product.imagen || "",
        tier: spec?.tier || "",
        socket: spec?.socket || "",
        ramType: spec?.ramType || "",
        watts: Number(spec?.watts || 0),
        power: Number(spec?.power || 0),
        performance: Number(spec?.performance || 0)
      };
    }).filter(Boolean);
  }

  function buildPerformanceDeficit(cpuSpec, gpuSpec, profile) {
    const cpuDeficit = Math.max(0, Number(profile.cpuTarget || 0) - Number(cpuSpec?.performance || 0));
    const gpuDeficit = Math.max(0, Number(profile.gpuTarget || 0) - Number(gpuSpec?.performance || 0));
    return cpuDeficit + gpuDeficit * 1.35;
  }

  function generateBuild(rawOptions = {}) {
    const options = normalizeBuildOptions(rawOptions);
    const profile = resolutionProfile(options.resolution, options.usage);

    const matchesCommon = product => {
      if (!product || Number(product.stock || 0) <= 0) return false;

      const brand = productBrandKey(product);
      if (options.excludeBrands.includes(brand)) return false;

      return true;
    };

    let cpus = productsForStep("cpu").filter(product => matchesCommon(product) && specFor(product));
    let boards = productsForStep("motherboard").filter(product => matchesCommon(product) && specFor(product));
    let gpus = productsForStep("gpu").filter(product => matchesCommon(product) && specFor(product));
    let rams = productsForStep("ram").filter(product => matchesCommon(product) && specFor(product));
    let storages = productsForStep("storage").filter(product => matchesCommon(product) && specFor(product));
    let psus = productsForStep("psu").filter(product => matchesCommon(product) && specFor(product));
    let cases = productsForStep("case").filter(product => matchesCommon(product) && specFor(product));

    if (options.cpuBrand) {
      cpus = cpus.filter(product => productBrandKey(product) === options.cpuBrand);
    }

    if (options.gpuBrand) {
      gpus = gpus.filter(product => productBrandKey(product) === options.gpuBrand);
    }

    if (options.socket) {
      cpus = cpus.filter(product => specFor(product)?.socket === options.socket);
      boards = boards.filter(product => specFor(product)?.socket === options.socket);
    }

    if (options.tier) {
      const tieredCpus = cpus.filter(product => specFor(product)?.tier === options.tier);
      const tieredGpus = gpus.filter(product => specFor(product)?.tier === options.tier);

      if (tieredCpus.length) cpus = tieredCpus;
      if (tieredGpus.length) gpus = tieredGpus;
    }

    const recommendedRamGb =
      options.minRamGb ||
      (profile.resolution === "4k" || profile.resolution === "1440p" ? 32 : 16);

    const recommendedStorageGb =
      options.minStorageGb ||
      1024;

    let bestWithinBudget = null;
    let cheapestTarget = null;
    let closestTarget = null;
    let cheapestValid = null;

    for (const cpu of cpus) {
      const cpuSpec = specFor(cpu);

      for (const motherboard of boards) {
        const boardSpec = specFor(motherboard);
        if (!cpuSpec?.socket || cpuSpec.socket !== boardSpec?.socket) continue;

        const compatibleRams = rams
          .filter(item => {
            const ramSpec = specFor(item);
            if (!ramSpec || ramSpec.ramType !== boardSpec.ramType) return false;
            const capacity = componentCapacityGb(item);
            return !capacity || capacity >= recommendedRamGb;
          })
          .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0));

        let ram = compatibleRams[0];

        // Si no existe 32 GB dentro del presupuesto/inventario, permitimos
        // 16 GB antes de declarar que no hay build.
        if (!ram && recommendedRamGb > 16) {
          ram = rams
            .filter(item => specFor(item)?.ramType === boardSpec.ramType && componentCapacityGb(item) >= 16)
            .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))[0];
        }

        const storage = storages
          .filter(item => {
            const storageSpec = specFor(item);
            if (storageSpec?.interface === "M.2 NVMe" && boardSpec.m2 === false) return false;
            const capacity = componentCapacityGb(item);
            return !capacity || capacity >= recommendedStorageGb;
          })
          .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))[0]
          ||
          cheapest(storages);

        if (!ram || !storage) continue;

        for (const gpu of gpus) {
          const gpuSpec = specFor(gpu);

          const pcCase = cases
            .filter(item => {
              const caseSpec = specFor(item);
              if (!caseSpec) return false;

              const boardFits =
                !boardSpec.formFactor ||
                !Array.isArray(caseSpec.formFactors) ||
                caseSpec.formFactors.includes(boardSpec.formFactor);

              const gpuFits =
                !gpuSpec?.lengthMm ||
                !caseSpec.gpuMaxMm ||
                Number(gpuSpec.lengthMm) <= Number(caseSpec.gpuMaxMm);

              return boardFits && gpuFits;
            })
            .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))[0];

          if (!pcCase) continue;

          const partial = {
            cpu: cpu.id,
            motherboard: motherboard.id,
            gpu: gpu.id,
            ram: ram.id,
            storage: storage.id,
            psu: "",
            case: pcCase.id
          };

          const requiredPsu = recommendedPsu(partial);

          const psu = psus
            .filter(item => Number(specFor(item)?.watts || 0) >= requiredPsu)
            .sort((a, b) => Number(a.precio || 0) - Number(b.precio || 0))[0];

          if (!psu) continue;

          const selection = {
            ...partial,
            psu: psu.id
          };

          const evaluation = evaluate(selection);
          if (!evaluation.complete || evaluation.issues.length) continue;

          const total = evaluation.total;
          const cpuPerf = Number(cpuSpec?.performance || 0);
          const gpuPerf = Number(gpuSpec?.performance || 0);
          const deficit = buildPerformanceDeficit(cpuSpec, gpuSpec, profile);
          const targetReached = deficit <= 0;

          const cpuTier = tierRank(cpuSpec?.tier);
          const gpuTier = tierRank(gpuSpec?.tier);
          const imbalancePenalty = Math.abs(cpuTier - gpuTier) * 15;

          const performanceScore =
            cpuPerf * Number(profile.cpuWeight || 2) +
            gpuPerf * Number(profile.gpuWeight || 4) -
            imbalancePenalty;

          const candidate = {
            selection,
            total,
            score: performanceScore,
            deficit,
            targetReached,
            evaluation
          };

          if (!cheapestValid || total < cheapestValid.total) {
            cheapestValid = candidate;
          }

          if (
            targetReached &&
            (!cheapestTarget || total < cheapestTarget.total || (total === cheapestTarget.total && performanceScore > cheapestTarget.score))
          ) {
            cheapestTarget = candidate;
          }

          if (
            !closestTarget ||
            deficit < closestTarget.deficit ||
            (deficit === closestTarget.deficit && total < closestTarget.total)
          ) {
            closestTarget = candidate;
          }

          if (options.budget > 0 && total <= options.budget) {
            if (
              !bestWithinBudget ||
              performanceScore > bestWithinBudget.score ||
              (performanceScore === bestWithinBudget.score && total < bestWithinBudget.total)
            ) {
              bestWithinBudget = candidate;
            }
          }
        }
      }
    }

    let winner = null;

    if (options.budget > 0) {
      winner = bestWithinBudget;
    } else if (cheapestTarget) {
      winner = cheapestTarget;
    } else {
      winner = closestTarget;
    }

    if (!winner) {
      return {
        ok: false,
        error: cheapestValid && options.budget > 0
          ? `No encontré una configuración completa dentro de ${formatPrice(options.budget)}. La build compatible más económica ronda ${formatPrice(cheapestValid.total)}.`
          : "No encontré una combinación completa compatible con el inventario y las preferencias solicitadas.",
        cheapestTotal: cheapestValid?.total || 0,
        options
      };
    }

    const budgetRemaining =
      options.budget > 0
        ? options.budget - winner.total
        : null;

    const productsList = buildProducts(winner.selection);

    const build = {
      ok: true,
      id: `nexus-build-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      options,
      profile,
      selection: { ...winner.selection },
      products: productsList,
      total: winner.total,
      watts: winner.evaluation.watts,
      recommendedPsu: winner.evaluation.recommendedPsu,
      issues: winner.evaluation.issues.slice(),
      warnings: winner.evaluation.warnings.slice(),
      targetReached: winner.targetReached,
      deficit: winner.deficit,
      budgetRemaining
    };

    return build;
  }

  let lastGeneratedBuild = null;

  function applyGeneratedBuild(build, { openBuilder = false } = {}) {
    if (!build?.ok || !build.selection) {
      return { ok: false, error: "La build recibida no es válida." };
    }

    const result = evaluate(build.selection);

    if (!result.complete || result.issues.length) {
      return {
        ok: false,
        error: result.issues[0] || "La configuración ya no es compatible con el inventario actual."
      };
    }

    state.selections = Object.fromEntries(
      STEPS.map(step => [step.key, String(build.selection[step.key] || "")])
    );

    state.budget = Math.max(0, Number(build.options?.budget || 0));
    state.activeStep = "cpu";
    lastGeneratedBuild = {
      ...build,
      products: buildProducts(state.selections),
      total: result.total,
      watts: result.watts,
      recommendedPsu: result.recommendedPsu
    };

    save();
    renderMainPreview();

    if (openBuilder) open();
    else if (!$("pc-builder-modal")?.hidden) render();

    return { ok: true, build: lastGeneratedBuild };
  }

  function addGeneratedBuildToCart(build, { openCart = true } = {}) {
    const applied = applyGeneratedBuild(build, { openBuilder: false });

    if (!applied.ok) {
      return {
        ok: false,
        error: applied.error,
        added: [],
        skipped: []
      };
    }

    const result = api()?.addProductsToCart?.(
      STEPS.map(step => applied.build.selection[step.key])
    );

    if (!result) {
      return {
        ok: false,
        error: "No fue posible acceder al carrito de NEXUS.",
        added: [],
        skipped: []
      };
    }

    if (openCart && result.added?.length) {
      api()?.openCart?.();
    }

    return {
      ok: Boolean(result.added?.length),
      added: result.added || [],
      skipped: result.skipped || [],
      build: applied.build
    };
  }

  function openGeneratedBuild(build) {
    const applied = applyGeneratedBuild(build, { openBuilder: true });
    if (!applied.ok) {
      api()?.notify?.(applied.error);
    }
    return applied;
  }

  function getLastGeneratedBuild() {
    return lastGeneratedBuild;
  }

  function autoBuild() {
    const budget = Math.max(0, Number(state.budget || 0));

    if (!budget) {
      api()?.notify?.("Ingresa un presupuesto para generar una configuración.");
      return;
    }

    const build = generateBuild({
      budget,
      usage: "gaming",
      tier: state.tier
    });

    if (!build.ok) {
      api()?.notify?.(build.error);
      return;
    }

    const applied = applyGeneratedBuild(build, { openBuilder: false });

    if (!applied.ok) {
      api()?.notify?.(applied.error);
      return;
    }

    render();
    api()?.notify?.(`Build sugerida por ${formatPrice(applied.build.total)} usando productos disponibles.`);
  }

  function open() {
    const modal = $("pc-builder-modal");
    if (!modal) return;
    load();
    modal.hidden = false;
    document.body.classList.add("lock");
    render();
  }

  function close() {
    const modal = $("pc-builder-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("lock");
  }

  function refresh() {
    // Limpia selecciones de productos borrados del inventario.
    let changed = false;
    STEPS.forEach(step => {
      if (state.selections[step.key] && !productById(state.selections[step.key])) {
        state.selections[step.key] = "";
        changed = true;
      }
    });
    if (changed) save();
    renderMainPreview();
    if (!$("pc-builder-modal")?.hidden) render();
  }

  function bind() {
    $("pc-builder-close")?.addEventListener("click", close);
    $("pc-builder-modal")?.addEventListener("click", event => {
      if (event.target === event.currentTarget) close();
    });

    $("pc-builder-search")?.addEventListener("input", event => {
      state.search = event.target.value;
      window.clearTimeout(builderSearchTimer);
      builderSearchTimer = window.setTimeout(() => {
        renderProductGrid();
        if (window.lucide?.createIcons) window.lucide.createIcons();
      }, 80);
    });

    $("pc-builder-tier")?.addEventListener("change", event => {
      state.tier = event.target.value;
      save();
      renderProductGrid();
      if (window.lucide?.createIcons) window.lucide.createIcons();
    });

    $("pc-builder-budget")?.addEventListener("input", event => {
      state.budget = Math.max(0, Number(event.target.value || 0));
      save();
      renderSummary();
    });

    $("pc-builder-auto")?.addEventListener("click", autoBuild);
    $("pc-builder-clear")?.addEventListener("click", reset);
    $("pc-builder-add-cart")?.addEventListener("click", addBuildToCart);
    $("pc-builder-ask-ai")?.addEventListener("click", askAI);

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !$("pc-builder-modal")?.hidden) close();
    });
  }

  window.NexusPCBuilder = {
    open,
    close,
    refresh,
    evaluate,
    generateBuild,
    applyBuild: applyGeneratedBuild,
    openBuild: openGeneratedBuild,
    addBuildToCart: addGeneratedBuildToCart,
    getLastGeneratedBuild,
    formatPrice
  };

  document.addEventListener("DOMContentLoaded", () => {
    load();
    bind();
    renderMainPreview();
  });
})();
