// ======================================================
// NEXUS · UTILIDADES DE IMPORTACIÓN CSV
// Compatible con CSV separado por coma, punto y coma o tabulación.
// No requiere librerías externas.
// ======================================================

(function (global) {
    "use strict";

    function normalizarEncabezado(valor) {
        return String(valor || "")
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
    }

    function contarSeparador(linea, separador) {
        let cantidad = 0;
        let entreComillas = false;

        for (let i = 0; i < linea.length; i++) {
            const caracter = linea[i];

            if (caracter === '"') {
                if (entreComillas && linea[i + 1] === '"') {
                    i++;
                } else {
                    entreComillas = !entreComillas;
                }
                continue;
            }

            if (!entreComillas && caracter === separador) {
                cantidad++;
            }
        }

        return cantidad;
    }

    function detectarSeparador(texto) {
        const primeraLinea = String(texto || "")
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .find(function (linea) {
                return linea.trim() !== "";
            }) || "";

        const candidatos = [",", ";", "\t"];
        let mejor = ",";
        let mayor = -1;

        candidatos.forEach(function (separador) {
            const cantidad = contarSeparador(primeraLinea, separador);
            if (cantidad > mayor) {
                mayor = cantidad;
                mejor = separador;
            }
        });

        return mejor;
    }

    function parsearMatriz(texto, separador) {
        const filas = [];
        let fila = [];
        let campo = "";
        let entreComillas = false;
        const contenido = String(texto || "").replace(/^\uFEFF/, "");

        for (let i = 0; i < contenido.length; i++) {
            const caracter = contenido[i];

            if (caracter === '"') {
                if (entreComillas && contenido[i + 1] === '"') {
                    campo += '"';
                    i++;
                } else {
                    entreComillas = !entreComillas;
                }
                continue;
            }

            if (!entreComillas && caracter === separador) {
                fila.push(campo);
                campo = "";
                continue;
            }

            if (!entreComillas && (caracter === "\n" || caracter === "\r")) {
                if (caracter === "\r" && contenido[i + 1] === "\n") {
                    i++;
                }
                fila.push(campo);
                campo = "";
                filas.push(fila);
                fila = [];
                continue;
            }

            campo += caracter;
        }

        if (campo !== "" || fila.length > 0) {
            fila.push(campo);
            filas.push(fila);
        }

        return filas;
    }

    function parsear(texto) {
        const separador = detectarSeparador(texto);
        const matriz = parsearMatriz(texto, separador);

        while (
            matriz.length > 0 &&
            matriz[0].every(function (valor) {
                return String(valor).trim() === "";
            })
        ) {
            matriz.shift();
        }

        if (matriz.length === 0) {
            throw new Error("El archivo CSV está vacío.");
        }

        const encabezadosOriginales = matriz[0].map(function (valor) {
            return String(valor || "").trim();
        });

        const encabezados = encabezadosOriginales.map(normalizarEncabezado);

        if (encabezados.some(function (valor) { return valor === ""; })) {
            throw new Error("El CSV contiene una columna sin nombre en el encabezado.");
        }

        const repetidos = encabezados.filter(function (valor, indice) {
            return encabezados.indexOf(valor) !== indice;
        });

        if (repetidos.length > 0) {
            throw new Error("El CSV contiene encabezados repetidos: " + [...new Set(repetidos)].join(", ") + ".");
        }

        const filas = [];

        for (let i = 1; i < matriz.length; i++) {
            const valores = matriz[i];
            const vacia = valores.every(function (valor) {
                return String(valor || "").trim() === "";
            });

            if (vacia) {
                continue;
            }

            const objeto = { __linea: i + 1 };

            encabezados.forEach(function (encabezado, indice) {
                objeto[encabezado] = String(valores[indice] ?? "").trim();
            });

            filas.push(objeto);
        }

        return {
            separador: separador,
            encabezados: encabezados,
            encabezadosOriginales: encabezadosOriginales,
            filas: filas
        };
    }

    function leerArchivo(archivo) {
        if (!archivo) {
            return Promise.reject(new Error("No se seleccionó ningún archivo."));
        }

        if (archivo.size > 5 * 1024 * 1024) {
            return Promise.reject(new Error("El CSV no puede superar 5 MB."));
        }

        if (typeof archivo.text === "function") {
            return archivo.text();
        }

        return new Promise(function (resolve, reject) {
            const lector = new FileReader();
            lector.onload = function () { resolve(String(lector.result || "")); };
            lector.onerror = function () { reject(new Error("No se pudo leer el archivo CSV.")); };
            lector.readAsText(archivo, "UTF-8");
        });
    }

    function valor(fila, alias) {
        const opciones = Array.isArray(alias) ? alias : [alias];

        for (let i = 0; i < opciones.length; i++) {
            const clave = normalizarEncabezado(opciones[i]);
            if (Object.prototype.hasOwnProperty.call(fila, clave)) {
                return String(fila[clave] ?? "").trim();
            }
        }

        return "";
    }

    function tieneColumna(encabezados, alias) {
        const disponibles = new Set(encabezados.map(normalizarEncabezado));
        const opciones = Array.isArray(alias) ? alias : [alias];
        return opciones.some(function (opcion) {
            return disponibles.has(normalizarEncabezado(opcion));
        });
    }

    function numero(valor) {
        let texto = String(valor ?? "")
            .trim()
            .replace(/\s+/g, "")
            .replace(/CRC/gi, "")
            .replace(/[₡$€£]/g, "");

        if (texto === "") {
            return NaN;
        }

        const tieneComa = texto.includes(",");
        const tienePunto = texto.includes(".");

        if (tieneComa && tienePunto) {
            if (texto.lastIndexOf(",") > texto.lastIndexOf(".")) {
                texto = texto.replace(/\./g, "").replace(",", ".");
            } else {
                texto = texto.replace(/,/g, "");
            }
        } else if (tieneComa) {
            const partes = texto.split(",");
            if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && partes[0].length >= 1)) {
                texto = texto.replace(/,/g, "");
            } else {
                texto = texto.replace(",", ".");
            }
        } else if (tienePunto) {
            const partes = texto.split(".");
            if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && partes[0].length >= 1)) {
                texto = texto.replace(/\./g, "");
            }
        }

        const resultado = Number(texto);
        return Number.isFinite(resultado) ? resultado : NaN;
    }

    function nombreSeparador(separador) {
        if (separador === ";") return "punto y coma";
        if (separador === "\t") return "tabulación";
        return "coma";
    }

    global.NexusCSV = Object.freeze({
        parsear: parsear,
        leerArchivo: leerArchivo,
        valor: valor,
        tieneColumna: tieneColumna,
        numero: numero,
        normalizarEncabezado: normalizarEncabezado,
        nombreSeparador: nombreSeparador
    });
})(window);
