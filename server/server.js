import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadLocalEnv() {
  const envPath = join(__dirname, ".env");

  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index <= 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();

const MAX_BODY_BYTES = 180 * 1024;
const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY_ITEMS = 10;
const MAX_PRODUCTS = 50;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map();

function cleanText(value, max = 800) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function json(res, status, payload, origin = "") {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.end(JSON.stringify(payload));
}

function allowedOrigin(origin) {
  return (
    !origin ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  );
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");

  if (!allowedOrigin(origin)) return false;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  return true;
}

function checkRateLimit(req) {
  const ip = req.socket.remoteAddress || "local";
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || [];
  const active = bucket.filter(timestamp => now - timestamp < RATE_WINDOW_MS);

  if (active.length >= RATE_MAX_REQUESTS) {
    return false;
  }

  active.push(now);
  rateBuckets.set(ip, active);
  return true;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on("data", chunk => {
      total += chunk.length;

      if (total > MAX_BODY_BYTES) {
        const error = new Error("BODY_TOO_LARGE");
        error.code = "BODY_TOO_LARGE";
        reject(error);
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch {
        const error = new Error("INVALID_JSON");
        error.code = "INVALID_JSON";
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];

  const entries = raw
    .slice(-MAX_HISTORY_ITEMS)
    .map(item => ({
      role: item?.role === "model" ? "model" : "user",
      text: cleanText(item?.text, 1600)
    }))
    .filter(item => item.text);

  const normalized = [];
  let expected = "user";

  for (const item of entries) {
    if (item.role !== expected) continue;
    normalized.push(item);
    expected = expected === "user" ? "model" : "user";
  }

  if (normalized.at(-1)?.role === "user") {
    normalized.pop();
  }

  return normalized;
}

function normalizeContext(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  const productos = Array.isArray(source.productos)
    ? source.productos.slice(0, MAX_PRODUCTS).map(product => ({
        nombre: cleanText(product?.nombre, 120),
        marca: cleanText(product?.marca, 80),
        categoria: cleanText(product?.categoria, 80),
        descripcion: cleanText(product?.descripcion, 240),
        precioCRC: Math.max(0, finiteNumber(product?.precio, 0)),
        stock: Math.max(0, Math.floor(finiteNumber(product?.stock, 0))),
        gaming: Boolean(product?.gaming),
        proveedor: cleanText(product?.proveedor, 100)
      })).filter(product => product.nombre)
    : [];

  const categorias = Array.isArray(source.categorias)
    ? source.categorias.slice(0, 40).map(category => ({
        nombre: cleanText(category?.nombre, 80),
        descripcion: cleanText(category?.descripcion, 180)
      })).filter(category => category.nombre)
    : [];

  const carrito = Array.isArray(source.carrito)
    ? source.carrito.slice(0, 20).map(item => ({
        producto: cleanText(item?.producto, 120),
        cantidad: Math.max(1, Math.floor(finiteNumber(item?.cantidad, 1))),
        precioUnitarioCRC: Math.max(0, finiteNumber(item?.precioUnitario, 0))
      })).filter(item => item.producto)
    : [];

  const comparador = Array.isArray(source.comparador)
    ? source.comparador.slice(0, 3).map(product => ({
        nombre: cleanText(product?.nombre, 120),
        marca: cleanText(product?.marca, 80),
        categoria: cleanText(product?.categoria, 80),
        precioCRC: Math.max(0, finiteNumber(product?.precio, 0)),
        stock: Math.max(0, Math.floor(finiteNumber(product?.stock, 0))),
        descripcion: cleanText(product?.descripcion, 200)
      })).filter(product => product.nombre)
    : [];

  return { productos, categorias, carrito, comparador };
}

function buildSystemInstruction() {
  return `Eres NEXUS AI, el asistente virtual de una tienda académica de tecnología y gaming en Costa Rica.

OBJETIVO:
- Ayudar a elegir productos y componentes.
- Comparar hardware.
- Explicar tecnología con claridad.
- Recomendar según presupuesto y necesidad.
- Orientar al usuario para armar una PC.

REGLAS SOBRE LA TIENDA:
- El inventario incluido en cada consulta es la única fuente de verdad para afirmar qué productos vende NEXUS, sus precios y su stock.
- Nunca inventes que NEXUS tiene un producto que no esté en el inventario recibido.
- Si un producto tiene stock 0, indica que está agotado.
- Los precios de la tienda están en colones costarricenses (CRC).
- Puedes usar conocimiento general para explicar especificaciones, compatibilidad, rendimiento o conceptos técnicos.
- Si la información disponible no basta para confirmar compatibilidad exacta, dilo claramente y pide el dato que falta.
- No afirmes que realizaste compras, cambios de stock, pedidos o modificaciones reales. Solo asesora.
- Si el usuario pregunta por su carrito o comparador, usa únicamente el contexto recibido.

ESTILO:
- Responde en español salvo que el usuario pida otro idioma.
- Sé útil, concreto y amigable.
- Para recomendaciones, explica brevemente el porqué.
- Evita respuestas excesivamente largas salvo que el usuario pida detalle.`;
}

function buildUserPrompt(message, context) {
  return `CONTEXTO ACTUAL DE NEXUS

CATEGORÍAS:
${JSON.stringify(context.categorias, null, 2)}

INVENTARIO REAL:
${JSON.stringify(context.productos, null, 2)}

CARRITO ACTUAL DEL USUARIO:
${JSON.stringify(context.carrito, null, 2)}

PRODUCTOS EN EL COMPARADOR:
${JSON.stringify(context.comparador, null, 2)}

CONSULTA DEL USUARIO:
${message}`;
}

async function callGemini({ message, history, context }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

  const contents = history.map(item => ({
    role: item.role,
    parts: [{ text: item.text }]
  }));

  contents.push({
    role: "user",
    parts: [{ text: buildUserPrompt(message, context) }]
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemInstruction() }]
        },
        contents,
        generationConfig: {
          temperature: 0.45,
          topP: 0.9,
          maxOutputTokens: 650
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const googleMessage = cleanText(data?.error?.message, 500);
      const error = new Error(googleMessage || `Gemini respondió HTTP ${response.status}.`);
      error.status = response.status;
      throw error;
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map(part => typeof part?.text === "string" ? part.text : "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Gemini no devolvió texto en la respuesta.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  const origin = String(req.headers.origin || "");

  if (!applyCors(req, res)) {
    return json(res, 403, {
      error: "Origen no permitido por el servidor local de NEXUS AI."
    });
  }

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || `localhost:${PORT}`}`);

  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    const configured = Boolean(GEMINI_API_KEY) && GEMINI_API_KEY !== "PEGA_TU_CLAVE_AQUI";

    return json(res, configured ? 200 : 503, {
      ok: configured,
      configured,
      model: GEMINI_MODEL
    }, origin);
  }

  if (req.method === "POST" && requestUrl.pathname === "/api/chat") {
    if (!checkRateLimit(req)) {
      return json(res, 429, {
        error: "Has enviado muchas preguntas seguidas. Espera unos minutos y vuelve a intentar."
      }, origin);
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "PEGA_TU_CLAVE_AQUI") {
      return json(res, 503, {
        error: "NEXUS AI todavía no tiene una GEMINI_API_KEY configurada en server/.env."
      }, origin);
    }

    let body;

    try {
      body = await readJsonBody(req);
    } catch (error) {
      if (error.code === "BODY_TOO_LARGE") {
        return json(res, 413, {
          error: "La solicitud enviada al asistente es demasiado grande."
        }, origin);
      }

      return json(res, 400, {
        error: "La solicitud enviada al asistente no contiene JSON válido."
      }, origin);
    }

    const message = cleanText(body?.mensaje, MAX_MESSAGE_CHARS);

    if (!message) {
      return json(res, 400, {
        error: "Escribe una pregunta antes de enviar."
      }, origin);
    }

    const history = normalizeHistory(body?.historial);
    const context = normalizeContext(body?.contexto);

    try {
      const answer = await callGemini({ message, history, context });
      return json(res, 200, { respuesta: answer }, origin);
    } catch (error) {
      console.error("[NEXUS AI]", error.message);

      if (error.name === "AbortError") {
        return json(res, 504, {
          error: "Gemini tardó demasiado en responder. Intenta nuevamente."
        }, origin);
      }

      if (error.status === 429) {
        return json(res, 429, {
          error: "Se alcanzó temporalmente el límite gratuito de Gemini. Espera un momento y vuelve a intentar."
        }, origin);
      }

      if (error.status === 400 || error.status === 403) {
        return json(res, error.status, {
          error: "Gemini rechazó la solicitud. Revisa que tu API key sea válida y que el modelo esté disponible en tu cuenta."
        }, origin);
      }

      return json(res, 502, {
        error: "No fue posible obtener una respuesta de Gemini en este momento."
      }, origin);
    }
  }

  return json(res, 404, {
    error: "Ruta no encontrada."
  }, origin);
});

server.listen(PORT, () => {
  const configured = Boolean(GEMINI_API_KEY) && GEMINI_API_KEY !== "PEGA_TU_CLAVE_AQUI";

  console.log("========================================");
  console.log(" NEXUS AI · servidor local");
  console.log(` http://localhost:${PORT}`);
  console.log(` Modelo: ${GEMINI_MODEL}`);
  console.log(` API key: ${configured ? "configurada" : "PENDIENTE"}`);
  console.log("========================================");

  if (!configured) {
    console.log("Edita server/.env y pega tu GEMINI_API_KEY.");
  }
});
