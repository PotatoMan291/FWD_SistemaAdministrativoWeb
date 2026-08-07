// ======================================================
// EXPORTACIÓN PDF COMPARTIDA
// ======================================================
// Las dependencias se cargan únicamente cuando el usuario solicita
// un PDF. Así no aumentamos el tiempo inicial de carga de la página.

const PDFReporte = (function() {

    const JSPDF_URL =
        "https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js";

    const AUTOTABLE_URL =
        "https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.8/dist/jspdf.plugin.autotable.min.js";

    let promesaDependencias = null;


    function cargarScriptUnaVez(url, comprobacion) {

        return new Promise(function(resolve, reject) {

            if (comprobacion()) {
                resolve();
                return;
            }

            const existente =
                Array.from(
                    document.scripts
                ).find(
                    function(script) {

                        return script.src === url;
                    }
                );

            if (existente) {

                existente.addEventListener(
                    "load",
                    function() {

                        if (comprobacion()) {
                            resolve();
                        } else {
                            reject(
                                new Error(
                                    "La librería no quedó disponible."
                                )
                            );
                        }
                    },
                    { once: true }
                );

                existente.addEventListener(
                    "error",
                    function() {

                        reject(
                            new Error(
                                "No se pudo cargar una librería para PDF."
                            )
                        );
                    },
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src = url;
            script.async = true;

            script.addEventListener(
                "load",
                function() {

                    if (comprobacion()) {
                        resolve();
                    } else {
                        reject(
                            new Error(
                                "La librería PDF cargó, pero no está disponible."
                            )
                        );
                    }
                },
                { once: true }
            );

            script.addEventListener(
                "error",
                function() {

                    reject(
                        new Error(
                            "No se pudo descargar una librería para PDF."
                        )
                    );
                },
                { once: true }
            );

            document.head.appendChild(
                script
            );
        });
    }


    function cargarDependencias() {

        if (promesaDependencias) {
            return promesaDependencias;
        }

        promesaDependencias =
            cargarScriptUnaVez(
                JSPDF_URL,
                function() {

                    return Boolean(
                        window.jspdf &&
                        window.jspdf.jsPDF
                    );
                }
            )
            .then(
                function() {

                    return cargarScriptUnaVez(
                        AUTOTABLE_URL,
                        function() {

                            return Boolean(
                                window.jspdf &&
                                window.jspdf.jsPDF &&
                                window.jspdf.jsPDF
                                    .API &&
                                window.jspdf.jsPDF
                                    .API.autoTable
                            );
                        }
                    );
                }
            )
            .catch(
                function(error) {

                    // Permitir reintentar si hubo un problema de red.
                    promesaDependencias = null;
                    throw error;
                }
            );

        return promesaDependencias;
    }


    function limpiarTexto(valor) {

        return String(valor ?? "")
            .replace(
                /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
                ""
            )
            .trim();
    }


    function nombreArchivoSeguro(nombre) {

        return limpiarTexto(nombre)
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-z0-9_-]+/g,
                "_"
            )
            .replace(
                /^_+|_+$/g,
                ""
            ) || "reporte";
    }


    function fechaArchivo() {

        const fecha = new Date();

        const yyyy =
            fecha.getFullYear();

        const mm =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const dd =
            String(
                fecha.getDate()
            ).padStart(2, "0");

        return (
            yyyy +
            "-" +
            mm +
            "-" +
            dd
        );
    }


    function fechaHoraLegible() {

        return new Intl.DateTimeFormat(
            "es-CR",
            {
                dateStyle: "long",
                timeStyle: "short"
            }
        ).format(
            new Date()
        );
    }


    function agregarCabecera(
        doc,
        titulo,
        subtitulo
    ) {

        const ancho =
            doc.internal.pageSize
                .getWidth();

        doc.setFillColor(
            70,
            95,
            255
        );

        doc.rect(
            0,
            0,
            ancho,
            27,
            "F"
        );

        doc.setTextColor(
            255,
            255,
            255
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(17);

        doc.text(
            "Sistema Administrativo",
            12,
            11
        );

        doc.setFontSize(10);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            limpiarTexto(titulo),
            12,
            18
        );

        doc.setFontSize(8);

        doc.text(
            fechaHoraLegible(),
            ancho - 12,
            11,
            {
                align: "right"
            }
        );

        if (subtitulo) {

            doc.text(
                limpiarTexto(subtitulo),
                ancho - 12,
                18,
                {
                    align: "right"
                }
            );
        }

        doc.setTextColor(
            32,
            38,
            51
        );
    }


    function agregarTituloSeccion(
        doc,
        texto,
        y
    ) {

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(11);

        doc.setTextColor(
            32,
            38,
            51
        );

        doc.text(
            limpiarTexto(texto),
            12,
            y
        );

        doc.setDrawColor(
            220,
            224,
            232
        );

        doc.line(
            12,
            y + 2,
            doc.internal.pageSize
                .getWidth() - 12,
            y + 2
        );

        return y + 7;
    }


    function agregarMetricas(
        doc,
        metricas,
        yInicial
    ) {

        const metricasValidas =
            (metricas || [])
                .filter(
                    function(item) {

                        return (
                            item &&
                            item.etiqueta
                        );
                    }
                );

        if (
            metricasValidas.length === 0
        ) {

            return yInicial;
        }

        const anchoPagina =
            doc.internal.pageSize
                .getWidth();

        const margen = 12;
        const columnas =
            Math.min(
                3,
                metricasValidas.length
            );

        const separacion = 5;

        const anchoTarjeta =
            (
                anchoPagina -
                margen * 2 -
                separacion *
                (columnas - 1)
            ) /
            columnas;

        const altoTarjeta = 18;

        metricasValidas.forEach(
            function(metrica, indice) {

                const fila =
                    Math.floor(
                        indice /
                        columnas
                    );

                const columna =
                    indice %
                    columnas;

                const x =
                    margen +
                    columna *
                    (
                        anchoTarjeta +
                        separacion
                    );

                const y =
                    yInicial +
                    fila *
                    (
                        altoTarjeta +
                        5
                    );

                doc.setFillColor(
                    247,
                    249,
                    252
                );

                doc.setDrawColor(
                    224,
                    228,
                    235
                );

                doc.roundedRect(
                    x,
                    y,
                    anchoTarjeta,
                    altoTarjeta,
                    2,
                    2,
                    "FD"
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setFontSize(7.5);

                doc.setTextColor(
                    95,
                    105,
                    125
                );

                doc.text(
                    limpiarTexto(
                        metrica.etiqueta
                    ),
                    x + 4,
                    y + 6
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(11);

                doc.setTextColor(
                    32,
                    38,
                    51
                );

                const valor =
                    limpiarTexto(
                        metrica.valor
                    );

                const valorCortado =
                    valor.length > 34
                        ? (
                            valor.slice(
                                0,
                                31
                            ) +
                            "..."
                        )
                        : valor;

                doc.text(
                    valorCortado,
                    x + 4,
                    y + 13
                );
            }
        );

        const filas =
            Math.ceil(
                metricasValidas.length /
                columnas
            );

        return (
            yInicial +
            filas *
            (
                altoTarjeta + 5
            )
        );
    }


    async function obtenerImagenGrafico(
        chart
    ) {

        if (
            !chart ||
            typeof chart.dataURI !==
                "function"
        ) {

            return null;
        }

        try {

            const resultado =
                await chart.dataURI({
                    scale: 2
                });

            return (
                resultado &&
                resultado.imgURI
                    ? resultado.imgURI
                    : null
            );

        } catch (error) {

            console.warn(
                "No se pudo capturar un gráfico para el PDF:",
                error
            );

            return null;
        }
    }


    function agregarImagenAjustada(
        doc,
        imagen,
        x,
        y,
        anchoMaximo,
        altoMaximo
    ) {

        const propiedades =
            doc.getImageProperties(
                imagen
            );

        const proporcion =
            propiedades.width /
            propiedades.height;

        let ancho =
            anchoMaximo;

        let alto =
            ancho /
            proporcion;

        if (alto > altoMaximo) {

            alto =
                altoMaximo;

            ancho =
                alto *
                proporcion;
        }

        const xFinal =
            x +
            (
                anchoMaximo -
                ancho
            ) /
            2;

        const yFinal =
            y +
            (
                altoMaximo -
                alto
            ) /
            2;

        doc.addImage(
            imagen,
            "PNG",
            xFinal,
            yFinal,
            ancho,
            alto
        );
    }


    async function agregarGraficos(
        doc,
        graficos,
        yInicial,
        fondoOscuro
    ) {

        const graficosValidos =
            (graficos || [])
                .filter(
                    function(grafico) {

                        return (
                            grafico &&
                            grafico.titulo
                        );
                    }
                );

        if (
            graficosValidos.length === 0
        ) {

            return yInicial;
        }

        const resultados = [];

        for (
            const grafico of
            graficosValidos
        ) {

            resultados.push({
                titulo:
                    grafico.titulo,
                imagen:
                    await obtenerImagenGrafico(
                        grafico.chart
                    )
            });
        }

        const anchoPagina =
            doc.internal.pageSize
                .getWidth();

        const margen = 12;
        const separacion = 7;

        const columnas =
            resultados.length >= 2
                ? 2
                : 1;

        const anchoTarjeta =
            (
                anchoPagina -
                margen * 2 -
                (
                    columnas - 1
                ) *
                separacion
            ) /
            columnas;

        const altoTarjeta =
            columnas === 1
                ? 78
                : 70;

        resultados.forEach(
            function(resultado, indice) {

                const fila =
                    Math.floor(
                        indice /
                        columnas
                    );

                const columna =
                    indice %
                    columnas;

                const x =
                    margen +
                    columna *
                    (
                        anchoTarjeta +
                        separacion
                    );

                const y =
                    yInicial +
                    fila *
                    (
                        altoTarjeta +
                        7
                    );

                if (fondoOscuro) {

                    doc.setFillColor(
                        15,
                        23,
                        42
                    );

                    doc.setDrawColor(
                        48,
                        59,
                        82
                    );

                } else {

                    doc.setFillColor(
                        255,
                        255,
                        255
                    );

                    doc.setDrawColor(
                        224,
                        228,
                        235
                    );
                }

                doc.roundedRect(
                    x,
                    y,
                    anchoTarjeta,
                    altoTarjeta,
                    2,
                    2,
                    "FD"
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(8.5);

                doc.setTextColor(
                    fondoOscuro
                        ? 245
                        : 32,
                    fondoOscuro
                        ? 247
                        : 38,
                    fondoOscuro
                        ? 250
                        : 51
                );

                doc.text(
                    limpiarTexto(
                        resultado.titulo
                    ),
                    x + 4,
                    y + 7
                );

                if (resultado.imagen) {

                    agregarImagenAjustada(
                        doc,
                        resultado.imagen,
                        x + 4,
                        y + 10,
                        anchoTarjeta - 8,
                        altoTarjeta - 14
                    );

                } else {

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(8);

                    doc.setTextColor(
                        fondoOscuro
                            ? 190
                            : 110,
                        fondoOscuro
                            ? 198
                            : 118,
                        fondoOscuro
                            ? 212
                            : 135
                    );

                    doc.text(
                        "Gráfico no disponible para captura.",
                        x +
                            anchoTarjeta /
                            2,
                        y +
                            altoTarjeta /
                            2,
                        {
                            align:
                                "center"
                        }
                    );
                }
            }
        );

        const filas =
            Math.ceil(
                resultados.length /
                columnas
            );

        return (
            yInicial +
            filas *
            (
                altoTarjeta + 7
            )
        );
    }


    function agregarTabla(
        doc,
        tabla,
        titulo
    ) {

        doc.addPage();

        agregarCabecera(
            doc,
            titulo,
            "Detalle de registros"
        );

        let y =
            agregarTituloSeccion(
                doc,
                tabla.titulo ||
                "Datos registrados",
                36
            );

        doc.autoTable({
            startY: y,
            head: [
                (
                    tabla.columnas ||
                    []
                ).map(
                    limpiarTexto
                )
            ],
            body:
                (
                    tabla.filas ||
                    []
                ).map(
                    function(fila) {

                        return fila.map(
                            limpiarTexto
                        );
                    }
                ),
            theme: "grid",
            styles: {
                font:
                    "helvetica",
                fontSize: 7.2,
                cellPadding: 2.2,
                overflow:
                    "linebreak",
                valign:
                    "middle",
                textColor:
                    [45, 52, 65],
                lineColor:
                    [226, 230, 236],
                lineWidth:
                    0.15
            },
            headStyles: {
                fillColor:
                    [70, 95, 255],
                textColor:
                    [255, 255, 255],
                fontStyle:
                    "bold",
                fontSize:
                    7.5
            },
            alternateRowStyles: {
                fillColor:
                    [248, 249, 252]
            },
            margin: {
                top: 31,
                right: 10,
                bottom: 14,
                left: 10
            },
            rowPageBreak:
                "avoid",
            showHead:
                "everyPage",
            didDrawPage:
                function(data) {

                    if (
                        data.pageNumber > 1
                    ) {

                        agregarCabecera(
                            doc,
                            titulo,
                            "Detalle de registros"
                        );
                    }
                }
        });
    }


    function agregarPaginacion(
        doc
    ) {

        const totalPaginas =
            doc.getNumberOfPages();

        const ancho =
            doc.internal.pageSize
                .getWidth();

        const alto =
            doc.internal.pageSize
                .getHeight();

        for (
            let pagina = 1;
            pagina <= totalPaginas;
            pagina++
        ) {

            doc.setPage(
                pagina
            );

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(7);

            doc.setTextColor(
                130,
                138,
                153
            );

            doc.text(
                "Datos obtenidos del LocalStorage del navegador",
                12,
                alto - 6
            );

            doc.text(
                "Página " +
                pagina +
                " de " +
                totalPaginas,
                ancho - 12,
                alto - 6,
                {
                    align: "right"
                }
            );
        }
    }


    function mostrarCarga(
        titulo
    ) {

        if (!window.Swal) {
            return;
        }

        Swal.fire({
            title:
                titulo ||
                "Generando PDF",
            text:
                "Preparando datos y gráficas...",
            allowOutsideClick:
                false,
            allowEscapeKey:
                false,
            didOpen:
                function() {

                    Swal.showLoading();
                }
        });
    }


    function cerrarCarga() {

        if (window.Swal) {
            Swal.close();
        }
    }


    async function generarReporte(
        configuracion
    ) {

        const config =
            configuracion || {};

        mostrarCarga(
            "Generando reporte PDF"
        );

        try {

            await cargarDependencias();

            const jsPDF =
                window.jspdf.jsPDF;

            const doc =
                new jsPDF({
                    orientation:
                        "landscape",
                    unit: "mm",
                    format: "a4",
                    compress: true,
                    putOnlyUsedFonts:
                        true
                });

            agregarCabecera(
                doc,
                config.titulo ||
                    "Reporte",
                config.subtitulo ||
                    "Resumen"
            );

            let y =
                agregarTituloSeccion(
                    doc,
                    "Resumen",
                    36
                );

            y =
                agregarMetricas(
                    doc,
                    config.metricas ||
                        [],
                    y
                );

            if (
                config.graficos &&
                config.graficos.length >
                    0
            ) {

                y =
                    agregarTituloSeccion(
                        doc,
                        "Gráficas",
                        y + 1
                    );

                await agregarGraficos(
                    doc,
                    config.graficos,
                    y,
                    Boolean(
                        config.fondoGraficosOscuro
                    )
                );
            }

            agregarTabla(
                doc,
                config.tabla || {
                    columnas: [],
                    filas: []
                },
                config.titulo ||
                    "Reporte"
            );

            agregarPaginacion(
                doc
            );

            const nombre =
                nombreArchivoSeguro(
                    config.nombreArchivo ||
                    config.titulo ||
                    "reporte"
                );

            doc.save(
                nombre +
                "_" +
                fechaArchivo() +
                ".pdf"
            );

            cerrarCarga();

            if (
                typeof config.alFinalizar ===
                "function"
            ) {

                config.alFinalizar();
            }

            return true;

        } catch (error) {

            cerrarCarga();

            console.error(
                "Error al generar PDF:",
                error
            );

            if (window.Swal) {

                Swal.fire({
                    title:
                        "No se pudo generar el PDF",
                    text:
                        "Verifica tu conexión a Internet e inténtalo nuevamente.",
                    icon: "error",
                    confirmButtonText:
                        "Entendido"
                });

            } else {

                alert(
                    "No se pudo generar el PDF."
                );
            }

            return false;
        }
    }


    return {
        generarReporte:
            generarReporte
    };

})();
