// ===== 0. CONFIGURACIÓN =====

const INDICADORES = {
    temperatura: { rojo: { min: 35, max: 39 }, amarillo: { min: 36, max: 38 } },
    frecuencia: { rojo: { min: 40, max: 130 }, amarillo: { min: 50, max: 100 } },
    sistolica: { rojo: { min: 80, max: 181 }, amarillo: { min: 90, max: 130 } },
    diastolica: { rojo: { min: 50, max: 121 }, amarillo: { min: 60, max: 80 } },
    glucosa: { rojo: { min: 54, max: 251 }, amarillo: { min: 70, max: 181 } },
    sueno: { rojo: { min: 5, max: Infinity }, amarillo: { min: 7, max: Infinity } },
    animo: { rojo: { min: 2, max: Infinity }, amarillo: { min: 3, max: Infinity } },
};

const PRIORIDAD = { "sin-dato": 0, verde: 1, amarillo: 2, rojo: 3 };
const HISTORIAL = [];
const UMBRAL_TENDENCIA = 3;
const INTERVALO_MS = 10000;

const NOMBRES = {
    temperatura: { nombre: "temperatura", unidad: "°C" },
    frecuencia: { nombre: "Frecuencia cardiaca", unidad: "lpm" },
    sistolica: { nombre: "Presion sistolica", unidad: "mmHg" },
    diastolica: { nombre: "Presion diastolica", unidad: "mmHg" },
    glucosa: { nombre: "Glucosa", unidad: "mg/dl" },
    sueno: { nombre: "Sueño", unidad: "h" },
    animo: { nombre: "Estado de Animo", unidad: "/5" },
};

const TEXTO_ESTADO = {
    verde: "Normal",
    amarillo: "Atencion",
    rojo: "Alerta",
    "sin-dato": "Sin Dato",
};

const MENSAJES_PRESION = {
    "amarillo-alto": { pasa: "Tu presión está alta.", hacer: "Descansa 5 minutos y vuelve a medir. Reduce la sal en tus comidas." },
    "rojo-alto": { pasa: "Tu presión está peligrosamente alta.", hacer: "Siéntate y no hagas esfuerzos. Avisa a un compañero. Se enviará un aviso a Tierra." },
    "amarillo-bajo": { pasa: "Tu presión está baja. Solo es un problema si te mareas.", hacer: "Levántate despacio. Bebe agua. Vuelve a medir." },
    "rojo-bajo": { pasa: "Tu presión está muy baja.", hacer: "Túmbate con las piernas elevadas. Avisa a un compañero. Se enviará un aviso a Tierra." },
};

const MENSAJES = {
    temperatura: {
        "amarillo-alto": { pasa: "Tu temperatura está un poco alta. Puede ser el inicio de una fiebre.", hacer: "Bebe agua, descansa, evita ejercicio intenso. Vuelve a medir en 30 minutos." },
        "rojo-alto": { pasa: "Tienes fiebre alta.", hacer: "Avisa a un compañero ahora. Descansa en un lugar fresco. Se enviará un aviso a Tierra." },
        "amarillo-bajo": { pasa: "Tu temperatura está algo baja.", hacer: "Abrígate y vuelve a medir en 15 minutos. Revisa que mediste bien." },
        "rojo-bajo": { pasa: "Tu temperatura está peligrosamente baja (posible hipotermia).", hacer: "Avisa a un compañero ahora. Abrígate. Se enviará un aviso a Tierra." },
    },
    frecuencia: {
        "amarillo-alto": { pasa: "Tu corazón late más rápido de lo normal en reposo. Puede deberse a estrés, cafeína, fiebre o deshidratación.", hacer: "Siéntate, respira despacio, bebe agua. Vuelve a medir en 10 minutos." },
        "rojo-alto": { pasa: "Tu corazón late muy rápido en reposo.", hacer: "Siéntate o túmbate. Avisa a un compañero. Se enviará un aviso a Tierra." },
        "amarillo-bajo": { pasa: "Tu corazón late lento. En personas muy entrenadas puede ser normal.", hacer: "Si te sientes bien, vuelve a medir más tarde. Si te mareas, avisa a un compañero." },
        "rojo-bajo": { pasa: "Tu corazón late demasiado lento.", hacer: "Túmbate. Avisa a un compañero. Se enviará un aviso a Tierra." },
    },
    sistolica: MENSAJES_PRESION,
    diastolica: MENSAJES_PRESION,
    glucosa: {
        "amarillo-bajo": { pasa: "Tu glucosa está baja.", hacer: "Toma 15 g de azúcar rápida (glucosa, jugo). Vuelve a medir en 15 minutos. Repite si sigue baja." },
        "rojo-bajo": { pasa: "Tu glucosa está muy baja. Puedes confundirte pronto.", hacer: "Toma 15 g de azúcar rápida YA. Avisa a un compañero para que esté contigo. Se enviará un aviso a Tierra." },
        "amarillo-alto": { pasa: "Tu glucosa está alta.", hacer: "Bebe agua. Vuelve a medir en 2 horas." },
        "rojo-alto": { pasa: "Tu glucosa está muy alta.", hacer: "Avisa a un compañero. Se enviará un aviso a Tierra." },
    },
    sueno: {
        "amarillo-bajo": { pasa: "Dormiste menos de lo recomendado.", hacer: "Esta noche acuéstate a la hora habitual. Evita pantallas 30 minutos antes." },
        "rojo-bajo": { pasa: "Dormiste muy poco. Tu atención puede estar reducida.", hacer: "Evita tareas críticas si es posible. Informa a la tripulación." },
    },
    animo: {
        "amarillo-bajo": { pasa: "Hoy no te sientes bien. Es normal tener días así.", hacer: "Habla con un compañero o con tu familia en la próxima llamada. Haz una pausa." },
        "rojo-bajo": { pasa: "Te sientes muy mal.", hacer: "Habla hoy con un compañero de confianza. Se avisará al equipo de apoyo psicológico en Tierra." },
    },
};

const HABITATS = {
    iss: { nombre: "estacion espacial", retrasoSeg: 0.5, protocolo: "Los médicos responden casi al instante. Prepárate por si se decide una evacuación." },
    transito: { nombre: "Nave en Transito a Marte", retrasoSeg: 720, protocolo: "No hay regreso posible durante el viaje. Todo se trata a bordo: sigue el protocolo." },
    luna: { nombre: "Base lunar", retrasoSeg: 1.3, protocolo: "Los médicos responden casi al instante. Un regreso a la Tierra tomaría días." },
    marte: { nombre: "Base en Marte", retrasoSeg: 720, protocolo: "Estás en máxima autonomía. Sigue el protocolo mientras llega la respuesta." },
};

const ESCENARIOS = {
    normal: {
        temperatura: [36.8, 0.4],
        frecuencia: [72, 8],
        sistolica: [115, 8],
        diastolica: [75, 6],
        glucosa: [95, 15],
        sueno: [7, 1],
        animo: [4, 0.5],
    },
    fiebre: {
        temperatura: [39.5, 0.3],
        frecuencia: [110, 8],
        sistolica: [105, 8],
        diastolica: [65, 6],
        glucosa: [105, 15],
        sueno: [5.5, 1],
        animo: [2, 0.5],
    },
    hipotension: {
        temperatura: [36.5, 0.3],
        frecuencia: [105, 10],
        sistolica: [75, 5],
        diastolica: [45, 5],
        glucosa: [90, 15],
        sueno: [7, 1],
        animo: [3, 0.5],
    },
    hipoglucemia: {
        temperatura: [36.6, 0.3],
        frecuencia: [95, 10],
        sistolica: [110, 8],
        diastolica: [72, 6],
        glucosa: [48, 4],
        sueno: [6, 1],
        animo: [2, 0.5],
    },
};

// ===== 1. UTILIDADES =====

function variar(base, margen) {
    const cambio = (Math.random() * 2 - 1) * margen;
    return base + cambio;
}

function leerValor(id) {
    const texto = document.getElementById(id).value;
    if (texto === "") {
        return null;
    }
    return Number(texto);
}

function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${String(seg).padStart(2, "0")}`;
}

function promedio(arr) {
    const valoresValidos = arr.filter(
        valor => valor !== null && Number.isFinite(valor)
    );

    if (valoresValidos.length === 0) {
        return null;
    }

    return valoresValidos.reduce((a, b) => a + b, 0)
        / valoresValidos.length;
}

// ===== 2. LEER =====

function simularAstroskin() {
    const nombre = document.getElementById("escenario").value;
    const esc = ESCENARIOS[nombre];

    document.getElementById("temperatura").value = variar(esc.temperatura[0], esc.temperatura[1]).toFixed(1);
    document.getElementById("frecuencia").value = Math.round(variar(esc.frecuencia[0], esc.frecuencia[1]));
    document.getElementById("sistolica").value = Math.round(variar(esc.sistolica[0], esc.sistolica[1]));
    document.getElementById("diastolica").value = Math.round(variar(esc.diastolica[0], esc.diastolica[1]));
    document.getElementById("glucosa").value = Math.round(variar(esc.glucosa[0], esc.glucosa[1]));
    document.getElementById("sueno").value = Math.round(variar(esc.sueno[0], esc.sueno[1]) * 2) / 2;
    document.getElementById("animo").value = Math.round(variar(esc.animo[0], esc.animo[1]));
}

function leerMediciones() {
    return {
        temperatura: leerValor("temperatura"),
        frecuencia: leerValor("frecuencia"),
        sistolica: leerValor("sistolica"),
        diastolica: leerValor("diastolica"),
        glucosa: leerValor("glucosa"),
        sueno: leerValor("sueno"),
        animo: leerValor("animo"),
    };
}

function calcularEntorno() {
    const claveHabitat = document.getElementById("habitat").value;
    const dia = Number(document.getElementById("dia-mision").value) || 1;

    let radiacionMSv = 0;

    if (claveHabitat === "iss") {
        radiacionMSv = 0.35 * dia;
    } else if (claveHabitat === "luna") {
        radiacionMSv = 0.35 * dia;
    } else if (claveHabitat === "transito") {
        radiacionMSv = 1.8 * dia;
    } else if (claveHabitat === "marte") {
        radiacionMSv = (1.8 * 180) + (0.64 * dia);
    }

    const porcentajeLimite = (radiacionMSv / 600) * 100;

    let perdidaOsea = null;
    if (claveHabitat === "iss" || claveHabitat === "transito") {
        const meses = dia / 30;
        perdidaOsea = [meses * 1, meses * 1.5];
    }

    const gravedad = { iss: 0, transito: 0, luna: 0.16, marte: 0.38 };

    return {
        radiacionMSv: radiacionMSv,
        porcentajeLimite: porcentajeLimite,
        perdidaOsea: perdidaOsea,
        gravedad: gravedad[claveHabitat],
        nombreHabitat: HABITATS[claveHabitat].nombre,
        diaMision: dia,
    };
}

function registrarLectura(mediciones, resultados, entorno) {
    HISTORIAL.push({
        diaMision: Number(document.getElementById("dia-mision").value),
        mediciones: mediciones,
        resultados: resultados,
        entorno: entorno,
    });
}

function detectarTendencias() {
    const claves = ["sueno", "animo"];
    const alertas = [];

    for (let i = 0; i < claves.length; i++) {
        const clave = claves[i];
        const ultimas = HISTORIAL.slice(-UMBRAL_TENDENCIA);

        if (ultimas.length < UMBRAL_TENDENCIA) continue;

        let todasMalas = true;
        for (let j = 0; j < ultimas.length; j++) {
            const estado = ultimas[j].resultados[clave].estado;
            if (estado !== "rojo" && estado !== "amarillo") {
                todasMalas = false;
                break;
            }
        }

        if (todasMalas) {
            alertas.push(clave);
        }
    }

    return alertas;
}


// ===== 3b. GRÁFICOS (dos grupos, eje Y real, banda normal, chips interactivos) =====

const grafFoco = {};      // idCanvas -> clave enfocada | null (si no existe, usa el foco inicial)
const grafUltimo = {};    // idCanvas -> argumentos del último dibujo (para redibujar al hacer clic)
const COLOR_ESTADO = { verde: "#2ecc71", amarillo: "#f1c40f", rojo: "#e74c3c", "sin-dato": "#888" };

function dibujarGrafico(idCanvas, dias, series, opciones) {
    opciones = opciones || {};
    grafUltimo[idCanvas] = [dias, series, opciones];

    const canvas = document.getElementById(idCanvas);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Nitidez y ancho adaptable (la altura original del canvas se conserva)
    if (!canvas.dataset.alto) canvas.dataset.alto = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const ancho = Math.max(280, Math.min((canvas.parentElement && canvas.parentElement.clientWidth) || 700, 900));
    const alto = Number(canvas.dataset.alto);
    canvas.style.width = ancho + "px";
    canvas.style.height = alto + "px";
    canvas.width = Math.round(ancho * dpr);
    canvas.height = Math.round(alto * dpr);
    if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const margenIzquierdo = 52, margenDerecho = 48, margenSuperior = 24, margenInferior = 34;
    const areaAncho = ancho - margenIzquierdo - margenDerecho;
    const areaAlto = alto - margenSuperior - margenInferior;

    // Foco: serie con eje propio y banda normal
    const foco = (idCanvas in grafFoco) ? grafFoco[idCanvas] : (opciones.focoInicial || null);
    const serieFoco = series.find(x => x.indicador === foco) || null;

    // Escala del eje Y
    let ejeMin, ejeMax, modoEje;
    if (serieFoco) {
        ejeMin = serieFoco.min; ejeMax = serieFoco.max; modoEje = "foco";
    } else if (opciones.compartido) {
        ejeMin = Math.min(...series.map(x => x.min));
        ejeMax = Math.max(...series.map(x => x.max));
        modoEje = "compartido";
    } else {
        ejeMin = 0; ejeMax = 1; modoEje = "relativo";
    }

    const yDe = (serie, valor) => {
        let min = ejeMin, max = ejeMax;
        if (modoEje === "relativo" || (modoEje === "foco" && serie !== serieFoco)) {
            min = serie.min; max = serie.max;
        }
        const t = Math.max(0, Math.min(1, (valor - min) / (max - min)));
        return alto - margenInferior - t * areaAlto;
    };
    const yEje = v => alto - margenInferior - ((v - ejeMin) / (ejeMax - ejeMin)) * areaAlto;
    const posicionX = i => margenIzquierdo + (i / Math.max(dias.length - 1, 1)) * areaAncho;

    // Fondo
    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, ancho, alto);

    // Chips (leyenda interactiva con el último valor)
    pintarChips(idCanvas, series, foco);

    if (dias.length === 0) {
        ctx.fillStyle = "#aaa"; ctx.font = "14px Arial"; ctx.textAlign = "center";
        ctx.fillText("No hay datos para mostrar", ancho / 2, alto / 2);
        return;
    }

    // Banda de rango normal (solo con foco)
    if (serieFoco && INDICADORES[serieFoco.indicador]) {
        const am = INDICADORES[serieFoco.indicador].amarillo;
        const lo = Math.max(ejeMin, Number.isFinite(am.min) ? am.min : ejeMin);
        const hi = Math.min(ejeMax, Number.isFinite(am.max) ? am.max : ejeMax);
        if (hi > lo) {
            ctx.fillStyle = "rgba(46, 204, 113, 0.13)";
            ctx.fillRect(margenIzquierdo, yEje(hi), areaAncho, yEje(lo) - yEje(hi));
            ctx.fillStyle = "rgba(46, 204, 113, 0.8)";
            ctx.font = "10px Arial"; ctx.textAlign = "right";
            ctx.fillText("rango normal", ancho - margenDerecho - 4, yEje(hi) + 11);
        }
    }

    // Cuadrícula y números del eje Y
    ctx.font = "11px Arial"; ctx.textAlign = "right";
    if (modoEje === "relativo") {
        ctx.strokeStyle = "#2c2c48"; ctx.lineWidth = 1;
        for (let k = 0; k <= 4; k++) {
            const y = margenSuperior + (k / 4) * areaAlto;
            ctx.beginPath(); ctx.moveTo(margenIzquierdo, y); ctx.lineTo(ancho - margenDerecho, y); ctx.stroke();
        }
        ctx.fillStyle = "#888";
        ctx.fillText("alto", margenIzquierdo - 6, margenSuperior + 4);
        ctx.fillText("bajo", margenIzquierdo - 6, alto - margenInferior + 4);
    } else {
        // Marcas "redondas" del eje (p. ej. 50, 100, 150...)
        const bruto = (ejeMax - ejeMin) / 6;
        const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
        const norm = bruto / mag;
        const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
        for (let v = Math.ceil(ejeMin / paso) * paso; v <= ejeMax + 1e-9; v += paso) {
            const y = yEje(v);
            ctx.strokeStyle = "#2c2c48"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(margenIzquierdo, y); ctx.lineTo(ancho - margenDerecho, y); ctx.stroke();
            ctx.fillStyle = "#aaa";
            const r = Math.round(v * 10) / 10;
            ctx.fillText(r, margenIzquierdo - 6, y + 4);
        }
        if (serieFoco && serieFoco.unidad) {
            ctx.fillStyle = "#888"; ctx.textAlign = "left";
            ctx.fillText(serieFoco.unidad, 6, 12);
        }
    }

    // Ejes
    ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margenIzquierdo, margenSuperior);
    ctx.lineTo(margenIzquierdo, alto - margenInferior);
    ctx.lineTo(ancho - margenDerecho, alto - margenInferior);
    ctx.stroke();

    // Etiquetas de día (solo cuando cambia)
    ctx.fillStyle = "#aaa"; ctx.font = "11px Arial"; ctx.textAlign = "center";
    dias.forEach((dia, i) => {
        if (i > 0 && dia === dias[i - 1]) return;
        const x = posicionX(i);
        ctx.fillText("D" + dia, x, alto - margenInferior + 18);
        if (i > 0) {
            ctx.strokeStyle = "#444";
            ctx.beginPath(); ctx.moveTo(x, margenSuperior); ctx.lineTo(x, alto - margenInferior); ctx.stroke();
        }
    });

    // Series: primero las no enfocadas (atenuadas), al final la enfocada
    const orden = series.filter(x => x !== serieFoco);
    if (serieFoco) orden.push(serieFoco);

    orden.forEach(serie => {
        const atenuada = serieFoco && serie !== serieFoco;
        ctx.globalAlpha = atenuada ? 0.28 : 1;
        ctx.strokeStyle = serie.color;
        ctx.lineWidth = serie === serieFoco ? 2.5 : 2;

        // Línea (se corta donde no hay dato)
        let previo = false;
        ctx.beginPath();
        serie.datos.forEach((valor, i) => {
            if (valor === null || !Number.isFinite(valor)) { previo = false; return; }
            const x = posicionX(i), y = yDe(serie, valor);
            if (!previo) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            previo = true;
        });
        ctx.stroke();

        // Puntos (con foco: color del semáforo)
        serie.datos.forEach((valor, i) => {
            if (valor === null || !Number.isFinite(valor)) return;
            const x = posicionX(i), y = yDe(serie, valor);
            let color = serie.color;
            if (serie === serieFoco && serie.indicador) {
                color = COLOR_ESTADO[evaluarIndicador(serie.indicador, valor).estado];
            }
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(x, y, serie === serieFoco ? 3.5 : 2.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;
    });

    // Valor actual junto al último punto de la serie enfocada
    if (serieFoco) {
        for (let i = serieFoco.datos.length - 1; i >= 0; i--) {
            const v = serieFoco.datos[i];
            if (v === null || !Number.isFinite(v)) continue;
            ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.textAlign = "left";
            ctx.fillText(v, Math.min(posicionX(i) + 7, ancho - margenDerecho + 6), yDe(serieFoco, v) + 4);
            break;
        }
    }
}

function pintarChips(idCanvas, series, foco) {
    const canvas = document.getElementById(idCanvas);
    let caja = document.getElementById("chips-" + idCanvas);
    if (!caja) {
        caja = document.createElement("div");
        caja.id = "chips-" + idCanvas;
        caja.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin:6px 0;";
        canvas.parentNode.insertBefore(caja, canvas);
    }
    caja.innerHTML = "";
    series.forEach(serie => {
        let ultimo = null;
        for (let i = serie.datos.length - 1; i >= 0; i--) {
            if (serie.datos[i] !== null && Number.isFinite(serie.datos[i])) { ultimo = serie.datos[i]; break; }
        }
        const activo = foco === serie.indicador;
        const b = document.createElement("button");
        b.type = "button";
        b.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;cursor:pointer;font-size:12px;color:#fff;background:" +
            (activo ? "#2c2c48" : "transparent") + ";border:1.5px solid " + serie.color + ";";
        b.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${serie.color}"></span>` +
            `${serie.clave}: <b>${ultimo === null ? "--" : ultimo}</b> ${serie.unidad || ""}`;
        b.title = activo ? "Quitar enfoque" : "Ver con su escala y rango normal";
        b.addEventListener("click", function () {
            grafFoco[idCanvas] = activo ? null : serie.indicador;
            dibujarGrafico(idCanvas, ...grafUltimo[idCanvas]);
        });
        caja.appendChild(b);
    });
}

function graficarHistorial() {
    const lecturas = HISTORIAL.slice(-30);
    if (lecturas.length < 1) return;
    const dias = lecturas.map(h => h.diaMision);
    const col = clave => lecturas.map(h => h.mediciones[clave]);

    // Grupo 1: corazón y glucosa (misma escala real, 30-260)
    dibujarGrafico("grafica-vitales", dias, [
        { clave: "FC", indicador: "frecuencia", unidad: "lpm", color: "#3498db", min: 30, max: 260, datos: col("frecuencia") },
        { clave: "Sistólica", indicador: "sistolica", unidad: "mmHg", color: "#2ecc71", min: 30, max: 260, datos: col("sistolica") },
        { clave: "Diastólica", indicador: "diastolica", unidad: "mmHg", color: "#9b59b6", min: 30, max: 260, datos: col("diastolica") },
        { clave: "Glucosa", indicador: "glucosa", unidad: "mg/dl", color: "#f39c12", min: 30, max: 260, datos: col("glucosa") },
    ], { compartido: true });

    // Grupo 2: temperatura, sueño y ánimo (unidades distintas: se ve una a la vez con su eje)
    dibujarGrafico("grafica-bienestar", dias, [
        { clave: "Temp", indicador: "temperatura", unidad: "°C", color: "#e74c3c", min: 34, max: 41, datos: col("temperatura") },
        { clave: "Sueño", indicador: "sueno", unidad: "h", color: "#1abc9c", min: 0, max: 12, datos: col("sueno") },
        { clave: "Ánimo", indicador: "animo", unidad: "/5", color: "#e67e22", min: 0, max: 5, datos: col("animo") },
    ], { compartido: false, focoInicial: "temperatura" });
}


function mostrarEntorno(entorno) {
    const panel = document.getElementById("panel-entorno");

    let oseaTexto = "N/A (gravedad parcial)";
    if (entorno.perdidaOsea !== null) {
        oseaTexto = entorno.perdidaOsea[0].toFixed(1) + "-" + entorno.perdidaOsea[1].toFixed(1) + "%";
    }
    panel.innerHTML = `
    <div class="tarjeta-entorno">
    <h3>Entorno - ${entorno.nombreHabitat} (dia ${entorno.diaMision})</h3>
    <p>Gravedad: ${entorno.gravedad}g</p>
    <p>Radiacion acumulada: ${entorno.radiacionMSv.toFixed(1)} mSv (${entorno.porcentajeLimite.toFixed(1)}% del limite de carrera)</p>
    <p>Perdida osea estimada: ${oseaTexto}</p>
    </div>`;
}

// ===== 3. PROCESAR =====

function evaluarIndicador(clave, valor) {
    if (valor === null) {
        return { estado: "sin-dato", direccion: null };
    }

    const umbral = INDICADORES[clave];

    let direccion = null;
    if (valor < umbral.amarillo.min) {
        direccion = "bajo";
    } else if (valor >= umbral.amarillo.max) {
        direccion = "alto";
    }

    if (valor < umbral.rojo.min || valor >= umbral.rojo.max) {
        return { estado: "rojo", direccion: direccion };
    }
    if (direccion !== null) {
        return { estado: "amarillo", direccion: direccion };
    }
    return { estado: "verde", direccion: null };
}

function evaluarTodo(mediciones) {
    const resultados = {};
    for (const clave in mediciones) {
        resultados[clave] = evaluarIndicador(clave, mediciones[clave]);
    }
    return resultados;
}

function peorEstado(resultados) {
    let peor = "sin-dato";
    for (const clave in resultados) {
        const estado = resultados[clave].estado;
        if (PRIORIDAD[estado] > PRIORIDAD[peor]) {
            peor = estado;
        }
    }
    return peor;
}

function mostrarResultados(mediciones, resultados, general) {
    const contenedor = document.getElementById("resultado");

    let html = `<div class="general estado-${general}">
    Estado general: ${TEXTO_ESTADO[general]}
</div>`;

    for (const clave in resultados) {
        const r = resultados[clave];
        const info = NOMBRES[clave];

        const valor = mediciones[clave] === null ? "—" : `${mediciones[clave]} ${info.unidad}`;

        let flecha = "";
        if (r.direccion === "alto") flecha = " ↑";
        if (r.direccion === "bajo") flecha = " ↓";

        let mensajeHtml = "";
        if (r.direccion !== null) {
            const m = MENSAJES[clave][`${r.estado}-${r.direccion}`];
            mensajeHtml = `<div class="mensaje">
        <p><strong>Qué está pasando:</strong> ${m.pasa}</p>
        <p><strong>Qué hacer:</strong> ${m.hacer}</p>
    </div>`;
        }

        html += `<div class="tarjeta estado-${r.estado}">
    <strong>${info.nombre}</strong>
    <span>${valor}</span>
    <span>${TEXTO_ESTADO[r.estado]}${flecha}</span>
    ${mensajeHtml}
    </div>`;
    }

    contenedor.innerHTML = html;
}

// ===== 3b. ALERTAS A TIERRA =====

let estadoAnterior = null;
let cuentaAtras = null;

function tiempoHablado(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    const txtMin = min === 1 ? "1 minuto" : `${min} minutos`;
    const txtSeg = seg === 1 ? "1 segundo" : `${seg} segundos`;
    if (min === 0) return txtSeg;
    if (seg === 0) return txtMin;
    return `${txtMin} y ${txtSeg}`;
}

// ===== 3e. RELOJ (wearable simulado, diseño de Figma) =====

let relojTierra = null;          // null | { restante } | { recibida: true }
let ultimoReloj = null;          // { mediciones, resultados }
let relojModoAnterior = null;

function actualizarReloj() {
    const cont = document.getElementById("reloj");
    if (!cont) return;
    if (!ultimoReloj) {
        cont.className = "reloj reloj-normal";
        cont.innerHTML = `<div class="reloj-pill">SIN DATOS</div>
            <div class="reloj-titulo">Esperando mediciones</div>
            <div class="reloj-texto">Pulsa "Iniciar datos simulados" o envía una medición.</div>`;
        return;
    }
    const { mediciones, resultados } = ultimoReloj;

    // Indicador más grave (si todo está normal, se muestra la frecuencia cardíaca)
    let clave = "frecuencia";
    for (const k in resultados) {
        if (PRIORIDAD[resultados[k].estado] > PRIORIDAD[resultados[clave].estado]) clave = k;
    }
    const r = resultados[clave];
    const habitat = HABITATS[document.getElementById("habitat").value];
    const dia = document.getElementById("dia-mision").value || 1;

    let modo = r.estado === "rojo" ? "alerta" : r.estado === "amarillo" ? "atencion" : "normal";
    if (relojTierra && relojTierra.recibida) modo = "tierra";

    const valor = mediciones[clave];
    const llave = r.estado + "-" + r.direccion;
    const m = (MENSAJES[clave] && MENSAJES[clave][llave]) || (MENSAJES_PRESION[llave]);
    const nombre = NOMBRES[clave].nombre;

    const pills = { normal: "NORMAL", atencion: "ATENCIÓN", alerta: "ALERTA", tierra: "TIERRA" };
    let titulo, texto, tarjeta = "";

    if (modo === "normal") {
        titulo = "Todos tus indicadores están en rango";
        texto = "Sigue con tu rutina.";
    } else if (modo === "tierra") {
        titulo = "Respuesta de Tierra recibida";
        texto = "Sigue el protocolo y vuelve a medir.";
        tarjeta = `<div class="reloj-aviso"><b>MODO AUTONOMÍA</b><span>${habitat.protocolo}</span></div>`;
    } else {
        const masc = clave === "sueno" || clave === "animo";
        const grado = modo === "alerta" ? "en nivel de alerta" : (masc ? "moderadamente alterado" : "moderadamente alterada");
        titulo = modo === "alerta" ? (m ? m.pasa : "Valor en alerta") : `Tu ${nombre.toLowerCase()} está ${grado}`;
        texto = m ? m.hacer : "Vuelve a medir.";
        if (modo === "alerta" && relojTierra && relojTierra.restante !== undefined) {
            tarjeta = `<div class="reloj-aviso"><b>AVISO ENVIADO A TIERRA</b><span>Respuesta estimada en ${formatearTiempo(relojTierra.restante)}</span></div>`;
        }
    }

    cont.className = "reloj reloj-" + modo;
    cont.innerHTML = `
        <div class="reloj-cab"><span>Día ${dia}</span><span>${habitat.nombre}</span></div>
        <div class="reloj-pill">${pills[modo]}</div>
        <div class="reloj-etq">${modo === "tierra" ? "Respuesta simulada" : nombre}</div>
        <div class="reloj-valor">${modo === "tierra" ? "OK" : (valor === null ? "--" : valor)}<small>${modo === "tierra" ? "" : NOMBRES[clave].unidad}</small></div>
        <div class="reloj-titulo">${titulo}</div>
        <div class="reloj-texto">${texto}</div>
        ${tarjeta}`;

    // Vibración del reloj solo al cambiar a atención/alerta
    if (modo !== relojModoAnterior && (modo === "atencion" || modo === "alerta") && navigator.vibrate) {
        navigator.vibrate(modo === "alerta" ? [300, 120, 300, 120, 300] : [200, 100, 200]);
    }
    relojModoAnterior = modo;
}

function iniciarAvisoTierra() {
    const habitat = HABITATS[document.getElementById("habitat").value];
    const caja = document.getElementById("aviso-tierra");
    let restante = Math.round(habitat.retrasoSeg * 2);

    hablar(`Aviso enviado a Tierra desde ${habitat.nombre}. Respuesta estimada en ${tiempoHablado(restante)}. ${habitat.protocolo}`, true);

    function pintar() {
        relojTierra = { restante: restante };
        actualizarReloj();
        caja.innerHTML = `<div class="aviso">
        <strong>AVISO ENVIADO A TIERRA</strong> (${habitat.nombre})
        <p>Respuesta estimada en <strong>${formatearTiempo(restante)}</strong></p>
        <p>${habitat.protocolo}</p>
        </div>`;
    }

    clearInterval(cuentaAtras);
    pintar();
    cuentaAtras = setInterval(function () {
        restante--;
        if (restante <= 0) {
            clearInterval(cuentaAtras);
            caja.innerHTML = `<div class="aviso">Respuesta de Tierra recibida (simulada).</div>`;
            relojTierra = { recibida: true };
            actualizarReloj();
            return;
        }
        pintar();
    }, 1000);
}

const AGUDOS = ["temperatura", "frecuencia", "sistolica", "diastolica", "glucosa"];

function avisarTierra(resultados) {
    let emergenciaAguda = false;
    for (let i = 0; i < AGUDOS.length; i++) {
        if (resultados[AGUDOS[i]].estado === "rojo") {
            emergenciaAguda = true;
            break;
        }
    }

    const tendencias = detectarTendencias();

    if ((emergenciaAguda || tendencias.length > 0) && estadoAnterior !== "alerta-enviada") {
        iniciarAvisoTierra();
        estadoAnterior = "alerta-enviada";
    } else if (!emergenciaAguda && tendencias.length === 0) {
        estadoAnterior = null;
        relojTierra = null;
    }
}

// ===== 3d. VOZ Y ALERTAS AUTOMÁTICAS =====

// Voz: se elige la mejor voz en español disponible (las "Natural", "Google" o "Online"
// suenan mucho mejor que las locales/robóticas) y el usuario puede cambiarla.
let vozElegida = null;

function puntajeVoz(v) {
    const n = v.name.toLowerCase();
    let p = 0;
    if (/natural|neural|online/.test(n)) p += 50;
    if (/google/.test(n)) p += 10;
    if (/microsoft/.test(n)) p += 20;
    if (/espeak|compact/.test(n)) p -= 50;
    if (/es-(mx|us|419|do)/i.test(v.lang)) p += 10;
    if (v.localService === false) p += 5;
    return p;
}

function vocesEspanol() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices()
        .filter(v => v.lang.toLowerCase().startsWith("es"))
        .sort((a, b) => puntajeVoz(b) - puntajeVoz(a));
}

function prepararSelectorVoz() {
    if (!("speechSynthesis" in window)) return;
    const interruptor = document.getElementById("voz-activa");
    if (!interruptor) return;
    const voces = vocesEspanol();
    if (voces.length === 0) return;               // aún no cargan: se reintenta en voiceschanged

    let sel = document.getElementById("voz-elegida");
    if (!sel) {
        sel = document.createElement("select");
        sel.id = "voz-elegida";
        sel.title = "Voz del asistente";
        sel.style.marginLeft = "8px";
        const ancla = interruptor.closest("label") || interruptor;
        ancla.parentNode.insertBefore(sel, ancla.nextSibling);
        sel.addEventListener("change", function () {
            vozElegida = vocesEspanol().find(v => v.name === sel.value) || null;
            hablar("Hola, esta es mi voz.");
        });
    }
    const actual = sel.value;
    sel.innerHTML = voces.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join("");
    sel.value = actual && voces.some(v => v.name === actual) ? actual : voces[0].name;
    vozElegida = voces.find(v => v.name === sel.value) || voces[0];
}

if ("speechSynthesis" in window) {
    speechSynthesis.addEventListener("voiceschanged", prepararSelectorVoz);
    prepararSelectorVoz();
}

function hablar(texto, encolar = false) {
    if (!("speechSynthesis" in window)) return;
    const interruptor = document.getElementById("voz-activa");
    if (interruptor && !interruptor.checked) return;

    if (!encolar) speechSynthesis.cancel();   // corta lo que suene, salvo que se encole

    if (!vozElegida) prepararSelectorVoz();
    const voz = vozElegida || vocesEspanol()[0] || null;

    // Frases cortas: se entienden mejor y evitan cortes en textos largos
    const limpio = texto.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
    const frases = limpio.match(/[^.!?;:]+[.!?;:]?/g) || [limpio];

    if (speechSynthesis.paused) speechSynthesis.resume();

    frases.forEach(frase => {
        const f = frase.trim();
        if (!f) return;
        decirFrase(f, voz, false);
    });
}

// Chrome puede descartar (por el recolector de basura) o fallar en silencio con ciertas voces:
// se guarda la referencia mientras suena y, si la voz elegida falla, se reintenta con la voz por defecto.
const enCurso = new Set();

function decirFrase(texto, voz, esReintento) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = voz ? voz.lang : "es-ES";
    if (voz) u.voice = voz;
    u.rate = 0.92;
    u.pitch = 1;
    u.volume = 1;

    enCurso.add(u);
    u.onend = function () { enCurso.delete(u); };
    u.onerror = function (e) {
        enCurso.delete(u);
        if (e && (e.error === "canceled" || e.error === "interrupted")) return;   // cortes normales
        console.warn("Error de voz:", e && e.error, voz && voz.name);
        if (!esReintento) decirFrase(texto, null, true);
    };
    speechSynthesis.speak(u);
}

const alertasAnunciadas = {};

function anunciarAnomalias(resultados) {
    const textos = [];

    for (const clave in resultados) {
        const r = resultados[clave];

        if (r.direccion === null) {
            delete alertasAnunciadas[clave];
            continue;
        }

        const llave = r.estado + "-" + r.direccion;
        if (alertasAnunciadas[clave] === llave) continue;
        alertasAnunciadas[clave] = llave;

        const m = MENSAJES[clave] && MENSAJES[clave][llave];
        if (!m) continue;

        const masculino = clave === "sueno" || clave === "animo";
        const grado = r.estado === "rojo"
            ? "en nivel de alerta"
            : (masculino ? "moderadamente alterado" : "moderadamente alterada");

        textos.push(`Tu ${NOMBRES[clave].nombre.toLowerCase()} está ${grado}. ${m.pasa} ${m.hacer}`);
    }

    if (textos.length === 0) return;

    const texto = textos.join(" ");
    const mensaje = document.createElement("p");
    mensaje.textContent = "run3rs IA (alerta automática): " + texto;
    document.getElementById("chat-ia").appendChild(mensaje);
    hablar(texto);
}

// ===== 3c. FLUJO PRINCIPAL =====

function procesar() {
    const mediciones = leerMediciones();
    const resultados = evaluarTodo(mediciones);
    const general = peorEstado(resultados);
    console.table(resultados);
    console.log("Estado general:", general);
    mostrarResultados(mediciones, resultados, general);

    const entorno = calcularEntorno();
    mostrarEntorno(entorno);

    registrarLectura(mediciones, resultados, entorno);
    graficarHistorial();
    anunciarAnomalias(resultados);
    avisarTierra(resultados);

    ultimoReloj = { mediciones: mediciones, resultados: resultados };
    actualizarReloj();
}

// ===== 4. CONEXIONES =====

const formulario = document.getElementById("form-salud");
formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    procesar();
});



// Botón "Ver simulación": muestra/oculta el reloj (funciona con o sin #reloj-panel)
const botonReloj = document.getElementById("btn-reloj");
if (botonReloj) {
    const relojEl = document.getElementById("reloj");
    const panelEl = document.getElementById("reloj-panel");
    let relojVisible = false;

    function aplicarVisibilidadReloj() {
        relojEl.style.display = relojVisible ? "" : "none";
        if (panelEl) panelEl.hidden = !relojVisible;
        botonReloj.textContent = relojVisible ? "Ocultar simulación" : "Ver simulación";
        if (relojVisible) actualizarReloj();
    }

    botonReloj.addEventListener("click", function () {
        relojVisible = !relojVisible;
        aplicarVisibilidadReloj();
    });
    aplicarVisibilidadReloj();   // arranca oculto
}

let temporizador = null;
const botonVivo = document.getElementById("btn-vivo");

let lecturasEnVivo = 0;

function cicloEnVivo() {
    if (lecturasEnVivo > 0 && lecturasEnVivo % 6 === 0) {   // 6 lecturas x 10 s = 1 día por minuto
        const campoDia = document.getElementById("dia-mision");
        campoDia.value = Number(campoDia.value) + 1;
    }
    lecturasEnVivo++;
    simularAstroskin();
    procesar();
}

botonVivo.addEventListener("click", function () {
    if (temporizador === null) {
        cicloEnVivo();
        temporizador = setInterval(cicloEnVivo, INTERVALO_MS);
        botonVivo.textContent = "Detener datos simulados";
    } else {
        clearInterval(temporizador);
        temporizador = null;
        botonVivo.textContent = "Iniciar datos simulados";
    }
});

document.getElementById("btn-graficar").addEventListener("click", function () {
    if (HISTORIAL.length < 1) {
        alert("No hay datos todavía. Registra al menos una lectura primero.");
        return;
    }
    graficarHistorial();
});


// ===== 5. ASISTENTE DE INTELIGENCIA ARTIFICIAL =====

async function consultarAsistente(pregunta) {

    const chat = document.getElementById("chat-ia");
    const boton = document.getElementById("btn-asistente");

    const mediciones = leerMediciones();
    const resultados = evaluarTodo(mediciones);
    const entorno = calcularEntorno();
    const general = peorEstado(resultados);

    const contexto = {
        proyecto: "run3rs",
        diaMision: entorno.diaMision,
        habitat: entorno.nombreHabitat,
        mediciones: mediciones,
        resultados: resultados,
        estadoGeneral: TEXTO_ESTADO[general],
        historial: HISTORIAL.slice(-10).map(h =>({
            dia: h.diaMision,
            mediciones: h.mediciones,
            estados: Object.fromEntries(
                Object.entries(h.resultados).map(([k,v]) => [k, v.estado])
            )
        })),
        entorno: {
            radiacionMSv: entorno.radiacionMSv,
            porcentajeLimite: entorno.porcentajeLimite,
            gravedad: entorno.gravedad,
            perdidaOsea: entorno.perdidaOsea
        }
    };

    const mensajeUsuario = document.createElement("p");
    mensajeUsuario.textContent = "Astronauta: " + pregunta;

    const mensajeIA = document.createElement("p");
    mensajeIA.textContent = "run3rs IA: Analizando mediciones...";

    chat.appendChild(mensajeUsuario);
    chat.appendChild(mensajeIA);

    boton.disabled = true;
    boton.textContent = "Consultando asistente...";

    try {

        const respuesta = await fetch(
            "/api/asistente",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    pregunta: pregunta,
                    contexto: contexto
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error || "No se pudo consultar el asistente."
            );
        }

        mensajeIA.textContent = "run3rs IA: " + datos.respuesta;

    } catch (error) {

        console.error("Error de consulta:", error);

        mensajeIA.textContent =
            "run3rs IA: No fue posible conectar con el asistente. " +
            error.message;

    } finally {

        boton.disabled = false;
        boton.textContent = "Consultar asistente de a bordo";

    }
}


// Conectar formulario del asistente

document.getElementById("formulario-asistente")
    .addEventListener("submit", async function(evento) {

        evento.preventDefault();

        const campo = document.getElementById("pregunta-asistente");

        const pregunta = campo.value.trim();

        if (!pregunta) return;

        campo.value = "";

        await consultarAsistente(pregunta);
    });