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

// En inglés, los textos de estas tablas se reemplazan por los de i18n.js
traducirDatos(NOMBRES, "NOMBRES");
traducirDatos(TEXTO_ESTADO, "TEXTO_ESTADO");
traducirDatos(MENSAJES_PRESION, "MENSAJES_PRESION");
traducirDatos(MENSAJES, "MENSAJES");
traducirDatos(HABITATS, "HABITATS");

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

// Lecturas que solo cambian una vez por día de misión (clave: indicador -> "día|wearable|escenario")
const simuladoDelDia = {};

// Simula una lectura SOLO con lo que mide el wearable elegido; lo que no mide queda vacío.
// El sueño se calcula una vez por noche, y la presión del WHOOP una vez al despertar.
function simularAstroskin() {
    const nombre = document.getElementById("escenario").value;
    const esc = ESCENARIOS[nombre];
    const w = wearableActual();
    const dia = Number(document.getElementById("dia-mision").value) || 1;
    const marca = dia + "|" + w.id + "|" + nombre;

    function poner(id, valor, unaVezAlDia) {
        const campo = document.getElementById(id);
        if (!wearableMide(id)) { campo.value = ""; return; }
        if (unaVezAlDia && campo.value !== "" && simuladoDelDia[id] === marca) return;
        campo.value = valor;
        if (unaVezAlDia) simuladoDelDia[id] = marca;
    }

    poner("temperatura", variar(esc.temperatura[0], esc.temperatura[1]).toFixed(1));
    poner("frecuencia", Math.round(variar(esc.frecuencia[0], esc.frecuencia[1])));
    poner("sistolica", Math.round(variar(esc.sistolica[0], esc.sistolica[1])), !!w.presionDiaria);
    poner("diastolica", Math.round(variar(esc.diastolica[0], esc.diastolica[1])), !!w.presionDiaria);
    poner("glucosa", Math.round(variar(esc.glucosa[0], esc.glucosa[1])));
    poner("sueno", Math.round(variar(esc.sueno[0], esc.sueno[1]) * 2) / 2, true);
    if (!animoManual) document.getElementById("animo").value = Math.round(variar(esc.animo[0], esc.animo[1]));
    sincronizarCaras();
}

// ===== Estado de ánimo con caritas =====
const CARAS = ["😞", "😕", "😐", "🙂", "😄"];
const ETIQUETAS_CARAS = ["Muy mal", "Mal", "Regular", "Bien", "Muy bien"];
traducirDatos(ETIQUETAS_CARAS, "ETIQUETAS_CARAS");
let animoManual = false;   // true cuando el usuario eligió una carita (la simulación no la pisa)

function caraDe(valor) {
    const n = Math.round(Number(valor));
    return n >= 1 && n <= 5 ? CARAS[n - 1] : "—";
}

function sincronizarCaras() {
    const caja = document.getElementById("animo-caras");
    const campo = document.getElementById("animo");
    if (!caja || !campo) return;
    const actual = Math.round(Number(campo.value));
    caja.querySelectorAll("button").forEach((b, i) => {
        const activo = actual === i + 1;
        b.classList.toggle("cara-activa", activo);
        b.setAttribute("aria-checked", activo ? "true" : "false");
    });
}

(function construirCaras() {
    const caja = document.getElementById("animo-caras");
    const campo = document.getElementById("animo");
    if (!caja || !campo) return;

    // Estilos propios con !important para que ningún CSS del proyecto los pise
    const estilo = document.createElement("style");
    estilo.textContent = `
        #animo-caras { display:flex !important; gap:8px; margin-top:4px; position:relative; z-index:2; }
        #animo-caras button { font-size:22px !important; line-height:1 !important; padding:7px 0 !important; flex:1 1 0; min-width:0; width:auto !important;
            border-radius:12px !important; border:2px solid #3a4160 !important; background:transparent !important;
            cursor:pointer !important; pointer-events:auto !important; transition:transform .1s; }
        #animo-caras button.cara-activa { background:#2c4a6e !important; border-color:#38bdf8 !important; transform:scale(1.15); }`;
    document.head.appendChild(estilo);

    CARAS.forEach((cara, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.dataset.valor = String(i + 1);
        b.title = ETIQUETAS_CARAS[i];
        b.textContent = cara;
        caja.appendChild(b);
    });

    // Un solo manejador en el contenedor (click y toque)
    caja.addEventListener("click", function (e) {
        const b = e.target.closest("button[data-valor]");
        if (!b) return;
        campo.value = b.dataset.valor;
        animoManual = true;
        sincronizarCaras();
    });

    // Al cambiar de escenario, la simulación vuelve a controlar el ánimo
    const esc = document.getElementById("escenario");
    if (esc) esc.addEventListener("change", function () { animoManual = false; });

    sincronizarCaras();
})();

// ===== Wearables disponibles para simular =====
// Cada uno mide indicadores distintos. Lo que el wearable no mide queda "sin dato".
// La glucosa siempre llega de un parche continuo aparte y el ánimo lo registra el astronauta.
const WEARABLES = [
    { id: "reloj", nombre: "Reloj inteligente (prototipo run3rs)", forma: "reloj",
      mide: ["temperatura", "frecuencia", "sistolica", "diastolica", "sueno"],
      extras: ["spo2", "actividad"],
      nota: "Tu prototipo de reloj (como un Apple Watch o Galaxy Watch): pulso óptico y electrocardiograma, oxígeno en sangre, temperatura de la piel, sueño y actividad. La presión es una estimación que hay que calibrar con un tensiómetro de brazo. Pantalla en la muñeca: muestra alertas y vibra." },
    { id: "whoop", nombre: "Banda WHOOP MG", forma: "whoop", presionDiaria: true,
      mide: ["temperatura", "frecuencia", "sistolica", "diastolica", "sueno"],
      extras: ["spo2", "resp", "vfc", "actividad"],
      nota: "Pulso óptico, variabilidad cardíaca, frecuencia respiratoria, oxígeno en sangre, temperatura de la piel, sueño y esfuerzo. La presión es una estimación diaria al despertar (función beta que se calibra con brazalete): se simula una vez por día de misión. Sin pantalla: vibra y los datos se ven en la app." },
    { id: "biomonitor", nombre: "Bio-Monitor (Agencia Espacial Canadiense)", forma: "biomonitor",
      mide: ["temperatura", "frecuencia", "sistolica", "diastolica"],
      extras: ["spo2", "resp", "volumen", "actividad"],
      nota: "Camiseta inteligente y diadema de la Estación Espacial. Mide pulso y electrocardiograma, presión arterial, frecuencia y volumen respiratorio, temperatura de la piel, oxígeno en sangre (diadema) y actividad física. No mide el sueño. Sin pantalla: los datos se ven en la tableta y bajan a la Tierra." },
];
traducirDatos(WEARABLES, "WEARABLES");
// La glucosa no la mide ningún wearable de muñeca o camiseta: llega de un parche aparte (CGM tipo Dexcom o Libre).
// El ánimo lo registra el astronauta.
const SIEMPRE = ["animo"];
function cgmConectado() {
    const c = document.getElementById("cgm");
    return !c || c.checked;
}
let indiceWearable = 0;
try { indiceWearable = Math.max(0, WEARABLES.findIndex(w => w.id === localStorage.getItem("run3rs-wearable"))); } catch (_) {}

function wearableActual() { return WEARABLES[indiceWearable]; }

function wearableMide(clave) {
    if (clave === "glucosa") return cgmConectado();
    return SIEMPRE.includes(clave) || wearableActual().mide.includes(clave);
}

function pintarWearable() {
    const w = wearableActual();
    const nombre = document.getElementById("wear-nombre");
    const sensores = document.getElementById("wear-sensores");
    if (nombre) nombre.textContent = `${w.nombre}  ·  ${tr("{n} de {total}", { n: indiceWearable + 1, total: WEARABLES.length })}`;
    if (sensores) {
        // Qué se simula con este wearable y qué no (la presión cuenta como un solo indicador)
        const NOMBRE_CORTO = { temperatura: tr("Temperatura de la piel"), frecuencia: tr("Frecuencia cardíaca"), presion: tr("Presión arterial"), sueno: tr("Sueño"), glucosa: tr("Glucosa (parche aparte)") };
        const claves = ["temperatura", "frecuencia", "presion", "sueno", "glucosa"];
        const mide = k => k === "presion" ? wearableMide("sistolica") : wearableMide(k);
        const si = claves.filter(mide).map(k => NOMBRE_CORTO[k] + (k === "presion" && w.presionDiaria ? " (" + tr("1 vez al día") + ")" : ""));
        const no = claves.filter(k => !mide(k)).map(k => NOMBRE_CORTO[k]);
        sensores.innerHTML = "";
        const lista = document.createElement("span");
        lista.className = "wear-simula";
        lista.textContent = tr("Simula:") + " " + si.join(", ") + (no.length ? "  ·  " + tr("No mide:") + " " + no.join(", ") : "");
        const nota = document.createElement("span");
        nota.textContent = w.nota;
        sensores.appendChild(lista);
        sensores.appendChild(nota);
    }
    // En el formulario se marcan los campos que este wearable no mide
    ["temperatura", "frecuencia", "sistolica", "diastolica", "sueno", "glucosa"].forEach(function (id) {
        const campo = document.getElementById(id);
        if (!campo) return;
        const mide = wearableMide(id);
        campo.disabled = !mide;
        campo.title = mide ? "" : tr("Este wearable no mide este indicador");
        const caja = campo.closest(".campo");
        if (caja) caja.classList.toggle("no-medido", !mide);
    });
}

(function () {
    const cgm = document.getElementById("cgm");
    if (cgm) cgm.addEventListener("change", function () {
        if (!cgm.checked) document.getElementById("glucosa").value = "";
        pintarWearable();
        if (ultimoReloj) procesar();
    });
})();

function cambiarWearable(paso) {
    indiceWearable = (indiceWearable + paso + WEARABLES.length) % WEARABLES.length;
    try { localStorage.setItem("run3rs-wearable", wearableActual().id); } catch (_) {}
    pintarWearable();
    relojModoAnterior = null;
    if (ultimoReloj) procesar(); else actualizarReloj();
}

function leerMediciones() {
    const v = id => (wearableMide(id) ? leerValor(id) : null);
    return {
        temperatura: v("temperatura"),
        frecuencia: v("frecuencia"),
        sistolica: v("sistolica"),
        diastolica: v("diastolica"),
        glucosa: v("glucosa"),
        sueno: v("sueno"),
        animo: v("animo"),
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

// Indicadores que el wearable da UNA vez al día: repetir el mismo valor en cada lectura no es
// "otra lectura alterada", así que para ellos se cuentan días seguidos y no lecturas seguidas.
function indicadoresDiarios() {
    return ["sueno"].concat(wearableActual().presionDiaria ? ["sistolica", "diastolica"] : []);
}

// Aviso por tendencia: un indicador en amarillo (o peor) en las últimas 3 lecturas SEGUIDAS
// (o 3 días seguidos si se mide una vez al día). Devuelve [{ clave, diario }]
function detectarTendencias() {
    const diarios = indicadoresDiarios();
    const alertas = [];
    for (const clave in INDICADORES) {
        let serie;
        if (diarios.includes(clave)) {
            const porDia = new Map();      // día de misión -> último resultado de ese día
            HISTORIAL.forEach(function (h) {
                const r = h.resultados[clave];
                if (r && r.estado !== "sin-dato") porDia.set(h.diaMision, r);
            });
            serie = Array.from(porDia.values()).slice(-UMBRAL_TENDENCIA);
        } else {
            serie = HISTORIAL.slice(-UMBRAL_TENDENCIA).map(h => h.resultados[clave]);
        }
        const alterado = r => r && (r.estado === "amarillo" || r.estado === "rojo");
        if (serie.length === UMBRAL_TENDENCIA && serie.every(alterado)) {
            alertas.push({ clave: clave, diario: diarios.includes(clave) });
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
    ctx.fillStyle = "#111317";
    ctx.fillRect(0, 0, ancho, alto);

    // Chips (leyenda interactiva con el último valor)
    pintarChips(idCanvas, series, foco);

    if (dias.length === 0) {
        ctx.fillStyle = "#aaa"; ctx.font = "14px Arial"; ctx.textAlign = "center";
        ctx.fillText(tr("No hay datos para mostrar"), ancho / 2, alto / 2);
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
            ctx.fillText(tr("rango normal"), ancho - margenDerecho - 4, yEje(hi) + 11);
        }
    }

    // Línea base personal (solo con foco)
    if (serieFoco && Number.isFinite(serieFoco.base) && serieFoco.base >= ejeMin && serieFoco.base <= ejeMax) {
        const yb = yEje(serieFoco.base);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(margenIzquierdo, yb); ctx.lineTo(ancho - margenDerecho, yb); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "10px Arial"; ctx.textAlign = "left";
        ctx.fillText(tr("tu base"), margenIzquierdo + 4, yb - 4);
    }

    // Cuadrícula y números del eje Y
    ctx.font = "11px Arial"; ctx.textAlign = "right";
    if (modoEje === "relativo") {
        ctx.strokeStyle = "#1f2329"; ctx.lineWidth = 1;
        for (let k = 0; k <= 4; k++) {
            const y = margenSuperior + (k / 4) * areaAlto;
            ctx.beginPath(); ctx.moveTo(margenIzquierdo, y); ctx.lineTo(ancho - margenDerecho, y); ctx.stroke();
        }
        ctx.fillStyle = "#888";
        ctx.fillText(tr("alto"), margenIzquierdo - 6, margenSuperior + 4);
        ctx.fillText(tr("bajo"), margenIzquierdo - 6, alto - margenInferior + 4);
    } else {
        // Marcas "redondas" del eje (p. ej. 50, 100, 150...)
        if (serieFoco && serieFoco.indicador === "animo") {
            for (let v = 1; v <= 5; v++) {
                const y = yEje(v);
                ctx.strokeStyle = "#1f2329"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(margenIzquierdo, y); ctx.lineTo(ancho - margenDerecho, y); ctx.stroke();
                ctx.fillStyle = "#fff"; ctx.font = "16px Arial";
                ctx.fillText(CARAS[v - 1], margenIzquierdo - 6, y + 6);
            }
        } else {
        const bruto = (ejeMax - ejeMin) / 6;
        const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
        const norm = bruto / mag;
        const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
        for (let v = Math.ceil(ejeMin / paso) * paso; v <= ejeMax + 1e-9; v += paso) {
            const y = yEje(v);
            ctx.strokeStyle = "#1f2329"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(margenIzquierdo, y); ctx.lineTo(ancho - margenDerecho, y); ctx.stroke();
            ctx.fillStyle = "#aaa";
            const r = Math.round(v * 10) / 10;
            ctx.fillText(r, margenIzquierdo - 6, y + 4);
        }
        }
        if (serieFoco && serieFoco.unidad && serieFoco.indicador !== "animo") {
            ctx.fillStyle = "#888"; ctx.textAlign = "left";
            ctx.fillText(tr(serieFoco.unidad), 6, 12);
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
            ctx.fillText(serieFoco.indicador === "animo" ? caraDe(v) : v, Math.min(posicionX(i) + 7, ancho - margenDerecho + 6), yDe(serieFoco, v) + 4);
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
            (activo ? "#1d2a24" : "transparent") + ";border:1.5px solid " + serie.color + ";";
        b.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${serie.color}"></span>` +
            `${tr(serie.clave)}: <b>${ultimo === null ? "--" : (serie.indicador === "animo" ? caraDe(ultimo) : ultimo)}</b> ${serie.indicador === "animo" ? "" : tr(serie.unidad || "")}`;
        b.title = activo ? tr("Quitar enfoque") : tr("Ver con su escala y rango normal");
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
    const base = calcularBase().base;

    // Grupo 1: corazón y glucosa (misma escala real, 30-260)
    dibujarGrafico("grafica-vitales", dias, [
        { clave: "FC", indicador: "frecuencia", base: base.frecuencia, unidad: "lpm", color: "#3498db", min: 30, max: 260, datos: col("frecuencia") },
        { clave: "Sistólica", indicador: "sistolica", base: base.sistolica, unidad: "mmHg", color: "#2ecc71", min: 30, max: 260, datos: col("sistolica") },
        { clave: "Diastólica", indicador: "diastolica", base: base.diastolica, unidad: "mmHg", color: "#9b59b6", min: 30, max: 260, datos: col("diastolica") },
        { clave: "Glucosa", indicador: "glucosa", base: base.glucosa, unidad: "mg/dl", color: "#f39c12", min: 30, max: 260, datos: col("glucosa") },
    ], { compartido: true });

    // Grupo 2: temperatura, sueño y ánimo (unidades distintas: se ve una a la vez con su eje)
    dibujarGrafico("grafica-bienestar", dias, [
        { clave: "Temp", indicador: "temperatura", base: base.temperatura, unidad: "°C", color: "#e74c3c", min: 34, max: 41, datos: col("temperatura") },
        { clave: "Sueño", indicador: "sueno", unidad: "h", color: "#1abc9c", min: 0, max: 12, datos: col("sueno") },
        { clave: "Ánimo", indicador: "animo", unidad: "/5", color: "#e67e22", min: 0, max: 5, datos: col("animo") },
    ], { compartido: false, focoInicial: "temperatura" });
}


function mostrarEntorno(entorno) {
    const panel = document.getElementById("panel-entorno");

    let oseaTexto = tr("N/A (gravedad parcial)");
    if (entorno.perdidaOsea !== null) {
        oseaTexto = entorno.perdidaOsea[0].toFixed(1) + "-" + entorno.perdidaOsea[1].toFixed(1) + "%";
    }
    panel.innerHTML = `
    <div class="tarjeta-entorno">
    <h3>${tr("Entorno - {habitat} (día {dia})", { habitat: entorno.nombreHabitat, dia: entorno.diaMision })}</h3>
    <p>${tr("Gravedad: {g}g", { g: entorno.gravedad })}</p>
    <p>${tr("Radiación acumulada: {msv} mSv ({pct}% del límite de carrera)", { msv: entorno.radiacionMSv.toFixed(1), pct: entorno.porcentajeLimite.toFixed(1) })}</p>
    <p>${tr("Pérdida ósea estimada: {osea}", { osea: oseaTexto })}</p>
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

// ===== Guía: cómo medir, qué es normal y cómo afecta el espacio =====
const GUIA = {
    temperatura: {
        como: "La toma el sensor de temperatura del traje (Astroskin) de forma continua. Para que sea fiable, el traje debe ir ajustado al cuerpo.",
        normal: "36.0 a 37.9 °C. Fiebre desde 38 °C.",
        espacio: "En vuelo la temperatura en reposo sube cerca de 1 °C con las semanas y el sistema inmunitario se debilita, así que las infecciones son más probables.",
    },
    frecuencia: {
        como: "La calcula el electrocardiograma del traje (Astroskin) latido a latido. Se evalúa en reposo: el ejercicio la sube de forma normal.",
        normal: "50 a 99 latidos por minuto en reposo.",
        espacio: "En microgravedad los fluidos suben hacia la cabeza y el corazón se adapta; la fiebre, el estrés y la deshidratación lo aceleran.",
    },
    sistolica: {
        como: "La estima el traje (Astroskin) a partir del pulso y el electrocardiograma. Es el número alto de la presión. Si sale alterada, confírmala con un tensiómetro de brazo.",
        normal: "90 a 129 mmHg.",
        espacio: "El riesgo principal en el espacio es la presión BAJA al cambiar de gravedad: mareo y desmayo.",
    },
    diastolica: {
        como: "Se obtiene junto con la sistólica. Es el número bajo de la presión.",
        normal: "60 a 79 mmHg.",
        espacio: "Igual que la sistólica: vigila sobre todo las caídas, más aún al llegar a la Luna o Marte.",
    },
    glucosa: {
        como: "La envía un sensor de glucosa continuo, un parche en el brazo que mide cada pocos minutos. Si sale baja, confírmala con un glucómetro de dedo.",
        normal: "70 a 180 mg/dl.",
        espacio: "Las comidas irregulares y el esfuerzo de las actividades extravehiculares pueden bajarla. Por debajo de 70: 15 g de carbohidratos rápidos y vuelve a medir a los 15 minutos.",
    },
    sueno: {
        como: "El traje (Astroskin) detecta cuándo duermes por tu respiración, pulso y movimiento, y suma las horas de las últimas 24 horas.",
        normal: "7 horas o más.",
        espacio: "Sin día ni noche, con ruido y turnos, el ritmo del cuerpo se desajusta y bajan la atención y los reflejos.",
    },
    animo: {
        como: "Es lo único que no mide un sensor: elige la carita que mejor describe cómo te sientes hoy. Sé honesto, nadie te califica.",
        normal: "🙂 o mejor (3 de 5 o más).",
        espacio: "El aislamiento y el encierro afectan la salud mental. Detectarlo pronto permite pedir apoyo antes de que crezca.",
    },
};

traducirDatos(GUIA, "GUIA");

function guiaHtml(clave) {
    const g = GUIA[clave];
    if (!g) return "";
    return `<details class="guia"><summary>${tr("ⓘ Cómo se mide y por qué importa")}</summary>
        <p><strong>${tr("Cómo se mide:")}</strong> ${g.como}</p>
        <p><strong>${tr("Normal:")}</strong> ${g.normal}</p>
        <p><strong>${tr("En el espacio:")}</strong> ${g.espacio}</p>
    </details>`;
}

// Ayuda en el formulario: un ⓘ junto a cada campo
(function () {
    const campos = { temperatura: "temperatura", frecuencia: "frecuencia", sistolica: "sistolica", diastolica: "diastolica", glucosa: "glucosa", sueno: "sueno" };
    for (const id in campos) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label) continue;
        const b = document.createElement("button");
        b.type = "button"; b.className = "ayuda"; b.textContent = "ⓘ";
        b.setAttribute("aria-label", tr("Cómo se mide: {nombre}", { nombre: NOMBRES[campos[id]].nombre.toLowerCase() }));
        b.title = GUIA[campos[id]].como;
        const p = document.createElement("p");
        p.className = "ayuda-texto"; p.hidden = true;
        p.textContent = GUIA[campos[id]].como + " " + tr("Normal:") + " " + GUIA[campos[id]].normal;
        b.addEventListener("click", function () { p.hidden = !p.hidden; });
        label.appendChild(b);
        label.parentNode.insertBefore(p, label.nextSibling);
    }
    const caras = document.getElementById("animo-caras");
    if (caras) {
        const p = document.createElement("p");
        p.className = "ayuda-texto";
        p.textContent = GUIA.animo.como;
        caras.parentNode.insertBefore(p, caras.nextSibling);
    }
})();

function mostrarResultados(mediciones, resultados, general) {
    window.novaAlerta = general;       // el orbe de Hermes cambia de color según la advertencia
    const contenedor = document.getElementById("resultado");

    let html = `<div class="general estado-${general}">
    ${tr("Estado general:")} ${TEXTO_ESTADO[general]}
</div>`;

    for (const clave in resultados) {
        const r = resultados[clave];
        const info = NOMBRES[clave];

        const valor = mediciones[clave] === null ? "—" : (clave === "animo" ? caraDe(mediciones[clave]) : `${mediciones[clave]} ${info.unidad}`);

        let flecha = "";
        if (r.direccion === "alto") flecha = " ↑";
        if (r.direccion === "bajo") flecha = " ↓";

        let mensajeHtml = "";
        if (r.direccion !== null) {
            const m = MENSAJES[clave][`${r.estado}-${r.direccion}`];
            mensajeHtml = `<div class="mensaje">
        <p><strong>${tr("Qué está pasando:")}</strong> ${m.pasa}</p>
        <p><strong>${tr("Qué hacer:")}</strong> ${m.hacer}</p>
    </div>`;
        }

        html += `<div class="tarjeta estado-${r.estado}">
    <strong>${info.nombre}</strong>
    <span>${valor}</span>
    <span>${TEXTO_ESTADO[r.estado]}${flecha}</span>
    ${mensajeHtml}
    ${guiaHtml(clave)}
    </div>`;
    }

    contenedor.innerHTML = html;
}

// ===== 3b. ALERTAS A TIERRA =====

let estadoAnterior = null;
let cuentaAtras = null;

// Números en palabras: la voz sintética a veces lee mal las cifras ("24" -> "4")
function numeroEnPalabras(n) {
    if (IDIOMA === "en") return String(Math.round(n));   // las voces en inglés leen bien las cifras
    const u =["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
        "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
        "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis",
        "veintisiete", "veintiocho", "veintinueve"];
    const d = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    n = Math.round(n);
    if (n < 30) return u[n];
    if (n < 100) return d[Math.floor(n / 10)] + (n % 10 ? " y " + u[n % 10] : "");
    return String(n);   // 100 o más: se deja en cifras
}

function tiempoHablado(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    const en = IDIOMA === "en";
    const txtMin = min === 1 ? (en ? "one minute" : "un minuto") : `${numeroEnPalabras(min)} ${en ? "minutes" : "minutos"}`;
    const txtSeg = seg === 1 ? (en ? "one second" : "un segundo") : `${numeroEnPalabras(seg)} ${en ? "seconds" : "segundos"}`;
    if (min === 0) return txtSeg;
    if (seg === 0) return txtMin;
    return `${txtMin} ${en ? "and" : "y"} ${txtSeg}`;
}

// ===== 3f. LÍNEA BASE PERSONAL =====
// Se calcula con las primeras lecturas NORMALES (semáforo verde) de cada indicador y
// se compara cada nueva lectura contra esa base. No cambia el semáforo: solo agrega aviso.
// Los desvíos son heurísticas del prototipo, no criterio clínico.

const BASE_LECTURAS = 5;
const DESVIO_PERSONAL = { temperatura: 0.8, frecuencia: 15, sistolica: 15, diastolica: 10, glucosa: 30 };
const UNIDAD_HABLADA = {
    temperatura: "grados", frecuencia: "latidos por minuto",
    sistolica: "milímetros de mercurio", diastolica: "milímetros de mercurio",
    glucosa: "miligramos por decilitro",
};
traducirDatos(UNIDAD_HABLADA, "UNIDAD_HABLADA");
const baseAnunciada = {};

function medianaDe(valores) {
    const o = valores.slice().sort((a, b) => a - b);
    const m = Math.floor(o.length / 2);
    return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

function calcularBase() {
    const base = {};
    let minimo = Infinity;
    for (const clave in DESVIO_PERSONAL) {
        const valores = HISTORIAL
            .filter(h => h.resultados[clave] && h.resultados[clave].estado === "verde" && Number.isFinite(h.mediciones[clave]))
            .slice(0, BASE_LECTURAS)
            .map(h => h.mediciones[clave]);
        minimo = Math.min(minimo, valores.length);
        if (valores.length >= BASE_LECTURAS) base[clave] = medianaDe(valores);
    }
    return { base: base, progreso: minimo === Infinity ? 0 : minimo };
}

function textoNumeroHablado(x) {
    const r = Math.round(x * 10) / 10;
    if (IDIOMA === "en") return String(r);
    if (Number.isInteger(r)) return numeroEnPalabras(r);
    return numeroEnPalabras(Math.floor(r)) + " coma " + numeroEnPalabras(Math.round((r % 1) * 10));
}

function actualizarBase(mediciones, resultados) {
    const { base, progreso } = calcularBase();

    // Panel
    let panel = document.getElementById("panel-base");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "panel-base";
        const entorno = document.getElementById("panel-entorno");
        entorno.parentNode.insertBefore(panel, entorno);
    }

    const filas = [];
    const avisos = [];
    for (const clave in DESVIO_PERSONAL) {
        if (!(clave in base)) continue;
        const valor = mediciones[clave];
        if (!Number.isFinite(valor)) continue;
        const delta = valor - base[clave];
        const fuera = Math.abs(delta) >= DESVIO_PERSONAL[clave];
        const dir = !fuera ? null : (delta > 0 ? "alto" : "bajo");
        const signo = delta > 0 ? "+" : "";
        filas.push(`<p>${NOMBRES[clave].nombre}: ${valor} ${NOMBRES[clave].unidad} · ${tr("tu base")} ${Math.round(base[clave] * 10) / 10} (${signo}${Math.round(delta * 10) / 10})${dir ? (dir === "alto" ? " ↑" : " ↓") : ""}</p>`);

        // Aviso hablado solo si el semáforo estándar NO alerta (si alerta, ya hay mensaje)
        if (dir === null) { delete baseAnunciada[clave]; continue; }
        if (resultados[clave].estado !== "verde") continue;
        if (baseAnunciada[clave] === dir) continue;
        baseAnunciada[clave] = dir;
        avisos.push(tr("Tu {nombre} está {delta} {unidad} por {lado} de tu base personal, aunque sigue en rango normal. Vigila la tendencia.", {
            nombre: NOMBRES[clave].nombre.toLowerCase(), delta: textoNumeroHablado(Math.abs(delta)),
            unidad: UNIDAD_HABLADA[clave], lado: tr(dir === "alto" ? "encima" : "debajo"),
        }));
    }

    const calibrando = progreso < BASE_LECTURAS
        ? `<p style="color:#9aa3b2">${tr("Calibrando tu línea base: {n} de {total} lecturas normales.", { n: progreso, total: BASE_LECTURAS })}</p>` : "";
    panel.innerHTML = `<div class="tarjeta-entorno"><h3>${tr("Línea base personal")}</h3>${filas.join("")}${calibrando}</div>`;

    if (avisos.length) {
        const texto = avisos.join(" ");
        const mensaje = document.createElement("p");
        mensaje.textContent = tr("Hermes (línea base): ") + texto;
        document.getElementById("chat-ia").appendChild(mensaje);
        hablarAlerta(texto);
    }
    return base;
}

// ===== 3e. RELOJ (wearable simulado, diseño de Figma) =====

let relojTierra = null;          // null | { restante } | { recibida: true }
let ultimoReloj = null;          // { mediciones, resultados }
let relojModoAnterior = null;

// Señales extra de cada wearable (oxígeno, respiración, variabilidad cardíaca, actividad).
// En el prototipo se simulan a partir de las lecturas; son informativas y no cambian el semáforo.
function extrasWearable(m, lista) {
    if (!lista || !lista.length) return "";
    const fc = Number(m.frecuencia) || 72;
    const fiebre = Number(m.temperatura) >= 38;
    const datos = {
        spo2: [`${fiebre ? 96 : 98}%`, tr("Oxígeno")],
        resp: [Math.round(Math.min(28, 12 + Math.max(0, fc - 70) / 6 + (fiebre ? 3 : 0))), tr("Resp/min")],
        volumen: [`${(0.5 + Math.max(0, fc - 70) / 200).toFixed(1)} L`, tr("Vol. resp.")],
        vfc: [`${Math.max(18, Math.round(65 - Math.max(0, fc - 70) * 0.8 - (fiebre ? 10 : 0)))} ms`, tr("Var. cardíaca")],
        actividad: [tr(fc >= 110 ? "alta" : fc >= 90 ? "moderada" : "reposo"), tr("Actividad")],
    };
    return `<div class="bio-extras" title="${tr("Valores simulados")}">${lista.map(k => `<span><b>${datos[k][0]}</b>${datos[k][1]}</span>`).join("")}</div>`;
}

// ===== Ilustraciones de los wearables sin pantalla =====
const COLOR_SENSOR = { verde: "#34d399", amarillo: "#fbbf24", rojo: "#f87171", "sin-dato": "#475569" };

function peorDe(resultados, claves) {
    let peor = "sin-dato";
    claves.forEach(k => { const e = resultados[k] && resultados[k].estado; if (e && PRIORIDAD[e] > PRIORIDAD[peor]) peor = e; });
    return peor;
}

function svgWhoop(resultados, modo) {
    const led = COLOR_SENSOR[{ normal: "verde", atencion: "amarillo", alerta: "rojo", tierra: "verde" }[modo] || "sin-dato"];
    const pulso = modo === "alerta" ? '<animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite"/>' : "";
    return `<svg class="ilus ilus-whoop" viewBox="0 0 320 120" role="img" aria-label="${tr("Banda WHOOP, sin pantalla")}">
        <defs>
            <pattern id="tejido" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#171b24"/><path d="M0 3h6M3 0v6" stroke="#1f2430" stroke-width="1"/>
            </pattern>
            <linearGradient id="pod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a303d"/><stop offset="1" stop-color="#0f1218"/></linearGradient>
            <filter id="brillo"><feGaussianBlur stdDeviation="3"/></filter>
        </defs>
        <rect x="6" y="38" width="308" height="44" rx="22" fill="url(#tejido)" stroke="#2c3244" stroke-width="2"/>
        <rect x="18" y="56" width="20" height="8" rx="4" fill="#2c3244"/>
        <rect x="112" y="24" width="96" height="72" rx="20" fill="url(#pod)" stroke="#3a4152" stroke-width="2"/>
        <rect x="124" y="36" width="72" height="48" rx="13" fill="none" stroke="#252b38" stroke-width="1.5"/>
        <circle cx="160" cy="60" r="9" fill="${led}" filter="url(#brillo)" opacity=".8">${pulso}</circle>
        <circle cx="160" cy="60" r="4.5" fill="${led}">${pulso}</circle>
    </svg>`;
}

function svgBioMonitor(resultados) {
    const c = k => COLOR_SENSOR[peorDe(resultados, k)];
    const s = (x, y, color, r) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${color}" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
    return `<svg class="ilus ilus-bio" viewBox="0 0 240 280" role="img" aria-label="${tr("Bio-Monitor: camiseta y diadema con sensores")}">
        <defs>
            <linearGradient id="tela" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d3749"/><stop offset=".55" stop-color="#1c2331"/><stop offset="1" stop-color="#121722"/></linearGradient>
            <linearGradient id="banda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7dd3fc" stop-opacity=".2"/><stop offset=".5" stop-color="#7dd3fc" stop-opacity=".85"/><stop offset="1" stop-color="#7dd3fc" stop-opacity=".2"/></linearGradient>
        </defs>
        <!-- diadema (oxígeno en sangre) -->
        <ellipse cx="120" cy="20" rx="46" ry="11" fill="none" stroke="#11151d" stroke-width="9"/>
        <ellipse cx="120" cy="20" rx="46" ry="11" fill="none" stroke="#2c3446" stroke-width="1.5"/>
        ${s(120, 31, "#7dd3fc", 3.2)}
        <!-- camiseta sin mangas -->
        <path d="M70 52 L94 52 Q120 96 146 52 L170 52 Q173 104 196 124 L193 262 Q120 274 47 262 L44 124 Q67 104 70 52 Z" fill="url(#tela)" stroke="#3a4558" stroke-width="2" stroke-linejoin="round"/>
        <path d="M94 52 Q120 96 146 52" fill="none" stroke="#11151d" stroke-width="6"/>
        <path d="M58 118 Q66 112 70 100" fill="none" stroke="#11151d" stroke-width="5" stroke-linecap="round"/>
        <path d="M182 118 Q174 112 170 100" fill="none" stroke="#11151d" stroke-width="5" stroke-linecap="round"/>
        <!-- bandas de sensores: pecho (corazón, respiración) y abdomen (respiración) -->
        <path d="M46 146 Q120 156 194 146" fill="none" stroke="url(#banda)" stroke-width="4"/>
        <path d="M47 214 Q120 224 193 214" fill="none" stroke="url(#banda)" stroke-width="4"/>
        <!-- sensores -->
        ${s(100, 150, c(["frecuencia"]), 4.5)}
        ${s(144, 150, c(["sistolica", "diastolica"]), 4)}
        ${s(62, 182, c(["temperatura"]), 4)}
        ${s(120, 219, "#7dd3fc", 3.5)}
        ${s(170, 244, "#7dd3fc", 3.5)}
    </svg>`;
}

const ETIQUETA_APP = { whoop: "Vista en la app del teléfono", biomonitor: "Vista en la tableta de a bordo" };
const LEYENDA_ILUS = {
    whoop: "Sin pantalla: la luz cambia de color y vibra. Sensores ópticos bajo el módulo; el broche permite el electrocardiograma.",
    biomonitor: "Pecho: corazón · Bandas: presión y respiración · Costado: temperatura de la piel · Diadema: oxígeno · Cadera: actividad",
};
traducirDatos(ETIQUETA_APP, "ETIQUETA_APP");
traducirDatos(LEYENDA_ILUS, "LEYENDA_ILUS");

function envolverWearable(forma, pantalla, resultados, modo) {
    if (forma !== "whoop" && forma !== "biomonitor") return pantalla;
    const ilus = forma === "whoop" ? svgWhoop(resultados, modo) : svgBioMonitor(resultados);
    return `<div class="ilus-caja">${ilus}<p class="ilus-leyenda">${LEYENDA_ILUS[forma]}</p></div>
        <div class="app-vista"><div class="app-etq">${ETIQUETA_APP[forma]}</div>${pantalla}</div>`;
}

function actualizarReloj() {
    const cont = document.getElementById("reloj");
    if (!cont) return;
    if (!ultimoReloj) {
        const formaVacia = wearableActual().forma;
        cont.className = "reloj reloj-normal forma-" + formaVacia;
        cont.innerHTML = envolverWearable(formaVacia, `<div class="reloj-pill">${tr("SIN DATOS")}</div>
            <div class="reloj-titulo">${tr("Esperando mediciones")}</div>
            <div class="reloj-texto">${tr("Pulsa \"Conectar wearable (simulado)\".")}</div>`, {}, "apagado");
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

    const pills = { normal: tr("NORMAL"), atencion: tr("ATENCIÓN"), alerta: tr("ALERTA"), tierra: tr("TIERRA") };
    let titulo, texto, tarjeta = "";

    if (modo === "normal") {
        titulo = tr("Todo lo que mide tu wearable está en rango");
        texto = tr("Sigue con tu rutina.");
    } else if (modo === "tierra") {
        titulo = tr("Respuesta de Tierra recibida");
        texto = tr("Sigue el protocolo y vuelve a medir.");
        tarjeta = `<div class="reloj-aviso"><b>${tr("MODO AUTONOMÍA")}</b><span>${habitat.protocolo}</span></div>`;
    } else {
        const masc = clave === "sueno" || clave === "animo";
        const grado = tr(modo === "alerta" ? "en nivel de alerta" : (masc ? "moderadamente alterado" : "moderadamente alterada"));
        titulo = modo === "alerta" ? (m ? m.pasa : tr("Valor en alerta")) : tr("Tu {nombre} está {grado}", { nombre: nombre.toLowerCase(), grado: grado });
        texto = m ? m.hacer : tr("Vuelve a medir.");
        if (modo === "alerta" && relojTierra && relojTierra.restante !== undefined) {
            tarjeta = `<div class="reloj-aviso"><b>${tr("AVISO ENVIADO A TIERRA")}</b><span>${tr("Respuesta estimada en {tiempo}", { tiempo: formatearTiempo(relojTierra.restante) })}</span></div>`;
        }
    }

    const forma = wearableActual().forma;
    cont.className = "reloj reloj-" + modo + " forma-" + forma;
    cont.innerHTML = envolverWearable(forma, `
        <div class="reloj-cab"><span>${tr("Día {dia}", { dia: dia })}</span><span>${habitat.nombre}</span></div>
        <div class="reloj-pill">${pills[modo]}</div>
        <div class="reloj-etq">${modo === "tierra" ? tr("Respuesta simulada") : nombre}</div>
        <div class="reloj-valor">${modo === "tierra" ? "OK" : (valor === null ? "--" : (clave === "animo" ? caraDe(valor) : valor))}<small>${modo === "tierra" || clave === "animo" ? "" : NOMBRES[clave].unidad}</small></div>
        <div class="reloj-titulo">${titulo}</div>
        <div class="reloj-texto">${texto}</div>
        ${extrasWearable(mediciones, wearableActual().extras)}
        ${tarjeta}`, resultados, modo);

    // Vibración del reloj solo al cambiar a atención/alerta
    if (modo !== relojModoAnterior && (modo === "atencion" || modo === "alerta") && navigator.vibrate) {
        navigator.vibrate(modo === "alerta" ? [300, 120, 300, 120, 300] : [200, 100, 200]);
    }
    relojModoAnterior = modo;
}

function iniciarAvisoTierra(motivos) {
    motivos = motivos || [];
    const habitat = HABITATS[document.getElementById("habitat").value];
    const caja = document.getElementById("aviso-tierra");
    let restante = Math.round(habitat.retrasoSeg * 2);

    hablarAlerta(tr("Aviso enviado a Tierra. Respuesta estimada en {tiempo}.", { tiempo: tiempoHablado(restante) }));

    function pintar() {
        relojTierra = { restante: restante };
        actualizarReloj();
        caja.innerHTML = `<div class="aviso">
        <strong>${tr("AVISO ENVIADO A TIERRA")}</strong> (${habitat.nombre})
        <p>${tr("Motivo:")} ${motivos.join("; ") || tr("indicadores alterados")}</p>
        <p>${tr("Respuesta estimada en {tiempo}", { tiempo: "<strong>" + formatearTiempo(restante) + "</strong>" })}</p>
        <p>${habitat.protocolo}</p>
        </div>`;
    }

    clearInterval(cuentaAtras);
    pintar();
    cuentaAtras = setInterval(function () {
        restante--;
        if (restante <= 0) {
            clearInterval(cuentaAtras);
            caja.innerHTML = `<div class="aviso">${tr("Respuesta de Tierra recibida (simulada).")}</div>`;
            relojTierra = { recibida: true };
            actualizarReloj();
            return;
        }
        pintar();
    }, 1000);
}

// Reglas del aviso a Tierra:
//  - ROJO en cualquier indicador: aviso inmediato.
//  - AMARILLO: solo si se repite 3 lecturas seguidas (3 días seguidos si se mide una vez al día).
//    Un amarillo suelto NO se avisa: el astronauta lo atiende con la recomendación en pantalla.
function avisarTierra(resultados) {
    const rojos = Object.keys(INDICADORES).filter(k => resultados[k] && resultados[k].estado === "rojo");
    const tendencias = detectarTendencias().filter(t => !rojos.includes(t.clave));

    const motivos = rojos.map(k => tr("{nombre} en alerta", { nombre: NOMBRES[k].nombre.toLowerCase() }))
        .concat(tendencias.map(t => t.diario
            ? tr("{nombre} alterado/a {n} días seguidos", { nombre: NOMBRES[t.clave].nombre.toLowerCase(), n: UMBRAL_TENDENCIA })
            : tr("{nombre} alterado/a en {n} lecturas seguidas", { nombre: NOMBRES[t.clave].nombre.toLowerCase(), n: UMBRAL_TENDENCIA })));

    if (motivos.length > 0 && estadoAnterior !== "alerta-enviada") {
        iniciarAvisoTierra(motivos);
        estadoAnterior = "alerta-enviada";
    } else if (motivos.length === 0) {
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
    if (IDIOMA === "es" && /es-(mx|us|419|do)/i.test(v.lang)) p += 10;
    if (IDIOMA === "en" && /en-us/i.test(v.lang)) p += 10;
    if (v.localService === false) p += 5;
    // HERMES es masculino: se prefieren voces de hombre en el respaldo del navegador
    if (/jorge|pablo|diego|ra[uú]l|juan|carlos|enrique|alvaro|álvaro|gonzalo|tom[aá]s|andr[eé]s|guy|david|mark|daniel|james|ryan|male|hombre/.test(n)) p += 30;
    if (/helena|laura|sabina|paulina|monica|mónica|elvira|dalia|lucia|lucía|ximena|zira|aria|jenny|samantha|female|mujer/.test(n)) p -= 15;
    return p;
}

// Voces del navegador en el idioma de la página, de mejor a peor
function vocesIdioma() {
    if (!("speechSynthesis" in window)) return [];
    return speechSynthesis.getVoices()
        .filter(v => v.lang.toLowerCase().startsWith(IDIOMA))
        .sort((a, b) => puntajeVoz(b) - puntajeVoz(a));
}

// El selector de voz está en el panel de Ajustes; se rellena cuando el navegador carga sus voces
function prepararSelectorVoz() {
    if (!("speechSynthesis" in window)) return;
    const voces = vocesIdioma();
    if (voces.length === 0) return;               // aún no cargan: se reintenta en voiceschanged
    const preferida = voces.find(v => v.name === AJUSTES.voz) || voces[0];
    vozElegida = preferida;

    const sel = document.getElementById("voz-elegida");
    if (!sel) return;
    if (!sel.dataset.listo) {
        sel.dataset.listo = "1";
        sel.addEventListener("change", function () {
            vozElegida = vocesIdioma().find(v => v.name === sel.value) || null;
            AJUSTES.voz = sel.value;
            guardarAjustes();
        });
    }
    sel.innerHTML = voces.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join("");
    sel.value = preferida.name;
}

if ("speechSynthesis" in window) {
    speechSynthesis.addEventListener("voiceschanged", prepararSelectorVoz);
    prepararSelectorVoz();
}

// Las alertas automáticas NUNCA interrumpen una conversación: si Hermes está hablando,
// escuchando o pensando, esperan y se dicen después.
const alertasPendientes = [];

// Ocupada = Hermes está en una conversación. Si solo está diciendo otra alerta,
// la nueva se encola detrás (la cola de voz garantiza que no se corte).
function conversacionOcupada() {
    return typeof window.novaOcupada === "function" && window.novaOcupada();
}

function hablarAlerta(texto) {
    if (conversacionOcupada()) {
        alertasPendientes.push(texto);
        return;
    }
    hablar(texto, true);   // encolada: no corta nada
}

function vaciarAlertasPendientes() {
    if (alertasPendientes.length === 0) return false;
    const texto = alertasPendientes.splice(0).slice(-2).join(" ");   // solo lo más reciente
    hablar(texto, true);
    return true;
}

// Para la voz, las respuestas largas se resumen a las primeras frases (en pantalla va completa)
function resumenParaVoz(texto) {
    const frases = (texto || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [texto];
    let salida = "";
    for (const f of frases.slice(0, 5)) {
        if ((salida + f).length > 600) break;
        salida += f;
    }
    return (salida || frases[0] || "").trim();
}

// ===== Voz de Hermes =====
// Voz principal: Gemini TTS a través de api/voz.py (Python). Si no está disponible,
// se usa la voz del navegador. Todo pasa por una cola para que nada se corte.
const colaVoz = [];
let vozActiva = false;
let generacionVoz = 0;
let fuenteVozActual = null;
let fallosVozServidor = 0;
const cacheVoz = new Map();
let ctxAudio = null;
let analizadorVoz = null;
window.novaNivelVoz = 0;       // 0..1, lo usa el orbe para animarse

function asegurarAudio() {
    if (ctxAudio) { if (ctxAudio.state === "suspended") ctxAudio.resume(); return ctxAudio; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctxAudio = new Ctx();
    analizadorVoz = ctxAudio.createAnalyser();
    analizadorVoz.fftSize = 256;
    analizadorVoz.connect(ctxAudio.destination);
    return ctxAudio;
}
// Los navegadores exigen un gesto del usuario antes de reproducir audio
["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, asegurarAudio, { passive: true }));

function novaEstaHablando() {
    return vozActiva || colaVoz.length > 0 ||
        ("speechSynthesis" in window && (speechSynthesis.speaking || speechSynthesis.pending));
}

function hablar(texto, encolar = false) {
    const limpio = String(texto || "").replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim();
    if (!limpio) return;
    if (!encolar) detenerVoz();
    colaVoz.push({ texto: limpio, gen: generacionVoz });
    if (!vozActiva) siguienteVoz();
}

function detenerVoz() {
    generacionVoz++;
    colaVoz.length = 0;
    if (fuenteVozActual) { try { fuenteVozActual.stop(); } catch (_) {} }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
}

async function siguienteVoz() {
    const item = colaVoz.shift();
    if (!item) { vozActiva = false; window.novaNivelVoz = 0; return; }
    vozActiva = true;
    try {
        // Motor elegido en Ajustes: Gemini (con la del navegador de respaldo) o solo la del navegador
        if (AJUSTES.motorVoz === "navegador") throw new Error("motor: navegador");
        await reproducirVozServidor(item);
    } catch (_) {
        if (item.gen === generacionVoz) await hablarNavegadorYEsperar(item.texto);
    }
    siguienteVoz();
}

function servidorVozDisponible() {
    return typeof fetch === "function" && location.protocol.startsWith("http") && fallosVozServidor < 2 && asegurarAudio();
}

async function reproducirVozServidor(item) {
    if (!servidorVozDisponible()) throw new Error("sin servidor de voz");
    const llaveCache = IDIOMA + "|" + AJUSTES.velocidad + "|" + item.texto;
    let buffer = cacheVoz.get(llaveCache);
    if (!buffer) {
        const r = await fetch("/api/voz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: (typeof AbortSignal !== "undefined" && AbortSignal.timeout) ? AbortSignal.timeout(15000) : undefined,
            body: JSON.stringify({ texto: item.texto, idioma: IDIOMA, velocidad: AJUSTES.velocidad }),
        });
        let datos = null;
        try { datos = JSON.parse(await r.text()); } catch (_) {}
        if (!datos || !datos.audio) {
            fallosVozServidor++;
            if (fallosVozServidor >= 2) setTimeout(() => { fallosVozServidor = 0; }, 120000);
            throw new Error("voz no disponible: " + (datos && datos.fuente));
        }
        const bin = atob(datos.audio);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        buffer = await ctxAudio.decodeAudioData(bytes.buffer);
        cacheVoz.set(llaveCache, buffer);
        if (cacheVoz.size > 40) cacheVoz.delete(cacheVoz.keys().next().value);
        fallosVozServidor = 0;
    }
    if (item.gen !== generacionVoz) return;          // se canceló mientras llegaba

    await new Promise(function (resolver) {
        const fuente = ctxAudio.createBufferSource();
        fuente.buffer = buffer;
        fuente.connect(analizadorVoz);
        fuente.onended = function () { if (fuenteVozActual === fuente) fuenteVozActual = null; resolver(); };
        fuenteVozActual = fuente;
        fuente.start();
        const datos = new Uint8Array(analizadorVoz.frequencyBinCount);
        (function medir() {
            if (fuenteVozActual !== fuente) { window.novaNivelVoz = 0; return; }
            analizadorVoz.getByteFrequencyData(datos);
            let suma = 0;
            for (let i = 2; i < 40; i++) suma += datos[i];
            window.novaNivelVoz = Math.min(1, suma / (38 * 110));
            requestAnimationFrame(medir);
        })();
    });
}

function hablarNavegadorYEsperar(texto) {
    return new Promise(function (resolver) {
        if (!("speechSynthesis" in window)) { resolver(); return; }
        hablarNavegador(texto, true);
        const inicio = Date.now();
        (function revisar() {
            const sigue = speechSynthesis.speaking || speechSynthesis.pending;
            window.novaNivelVoz = sigue ? 0.35 + Math.random() * 0.4 : 0;   // sin analizador: nivel simulado
            if (sigue && Date.now() - inicio < 60000) { setTimeout(revisar, 120); return; }
            if (!sigue && Date.now() - inicio < 400) { setTimeout(revisar, 120); return; }   // aún no empieza
            window.novaNivelVoz = 0;
            resolver();
        })();
    });
}

function hablarNavegador(texto, encolar = false) {
    if (!("speechSynthesis" in window)) return;
    if (!encolar) speechSynthesis.cancel();   // corta lo que suene, salvo que se encole

    if (!vozElegida) prepararSelectorVoz();
    const voz = vozElegida || vocesIdioma()[0] || null;

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
    u.lang = voz ? voz.lang : (IDIOMA === "en" ? "en-US" : "es-ES");
    if (voz) u.voice = voz;
    u.rate = AJUSTES.velocidad;          // velocidad elegida en Ajustes (1.0 = normal)
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

function primeraFrase(t) {
    const m = (t || "").match(/^[^.!?]+[.!?]?/);
    return m ? m[0].trim() : "";
}

function anunciarAnomalias(resultados) {
    const textos = [];      // texto completo (pantalla)
    const voz = [];         // texto corto (voz): estado + una acción

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
        const grado = tr(r.estado === "rojo"
            ? "en nivel de alerta"
            : (masculino ? "moderadamente alterado" : "moderadamente alterada"));

        const cabecera = tr("Tu {nombre} está {grado}", { nombre: NOMBRES[clave].nombre.toLowerCase(), grado: grado }) + ".";
        textos.push(`${cabecera} ${m.pasa} ${m.hacer}`);
        voz.push({ grave: r.estado === "rojo" ? 0 : 1, texto: `${cabecera} ${primeraFrase(m.hacer)}` });
    }

    if (textos.length === 0) return;

    const mensaje = document.createElement("p");
    mensaje.textContent = tr("Hermes (alerta automática): ") + textos.join(" ");
    document.getElementById("chat-ia").appendChild(mensaje);

    // Por voz: lo más grave primero, máximo dos avisos; el resto se remite al panel
    voz.sort((a, b) => a.grave - b.grave);
    let habla = voz.slice(0, 2).map(v => v.texto).join(" ");
    if (voz.length > 2) habla += " " + tr("Hay más indicadores alterados, revisa el panel.");
    hablarAlerta(habla);
}

// ===== 3c. FLUJO PRINCIPAL =====

// La lógica de salud vive en Python (api/evaluar.py). Si el servidor no responde
// (sin red, o abriendo la página sin servidor), se usa el mismo cálculo en el navegador.
let fallosServidor = 0;
let secuenciaLectura = 0;

function servidorDisponible() {
    return typeof fetch === "function" && location.protocol.startsWith("http") && fallosServidor < 3;
}

async function evaluarEnPython(mediciones) {
    const r = await fetch("/api/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: (typeof AbortSignal !== "undefined" && AbortSignal.timeout) ? AbortSignal.timeout(2500) : undefined,
        body: JSON.stringify({
            mediciones: mediciones,
            habitat: document.getElementById("habitat").value,
            diaMision: Number(document.getElementById("dia-mision").value) || 1,
        }),
    });
    const datos = JSON.parse(await r.text());
    if (!r.ok || !datos.resultados || !datos.entorno || !datos.general) throw new Error("respuesta inválida");
    for (const clave in mediciones) {
        if (!datos.resultados[clave] || !(datos.resultados[clave].estado in PRIORIDAD)) throw new Error("respuesta incompleta");
    }
    return datos;
}

function marcarFuente(fuente) {
    const el = document.getElementById("fuente-logica");
    if (!el) return;
    el.textContent = tr(fuente === "python" ? "Lógica: Python (servidor)" : "Lógica: respaldo local");
    el.dataset.fuente = fuente;
}

function procesar() {
    const mediciones = leerMediciones();
    const turno = ++secuenciaLectura;

    const local = function () {
        const resultados = evaluarTodo(mediciones);
        aplicarLectura(mediciones, resultados, peorEstado(resultados), calcularEntorno(), "local");
    };

    if (!servidorDisponible()) { local(); return; }

    evaluarEnPython(mediciones).then(function (d) {
        fallosServidor = 0;
        if (turno !== secuenciaLectura) return;          // llegó tarde: ya hay una lectura más nueva
        aplicarLectura(mediciones, d.resultados, d.general, d.entorno, "python");
    }).catch(function () {
        fallosServidor++;
        if (fallosServidor >= 3) setTimeout(function () { fallosServidor = 0; }, 60000);   // reintenta en 1 min
        if (turno !== secuenciaLectura) return;
        local();
    });
}

// ===== KPIs de la cabecera del panel =====
function pintarKPIs(mediciones, resultados, general, entorno) {
    const previa = HISTORIAL.length ? HISTORIAL[HISTORIAL.length - 1] : null;
    const pon = function (id, valor, estado, pie) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = "col kpi" + (estado ? " estado-" + estado : "");
        el.querySelector(".kpi-valor").textContent = valor;
        el.querySelector(".kpi-pie").innerHTML = pie;
    };
    const cambio = function (clave, unidad, decimales) {
        if (!previa || previa.mediciones[clave] === null || mediciones[clave] === null) return tr("vs. lectura anterior: —");
        const d = mediciones[clave] - previa.mediciones[clave];
        const clase = Math.abs(d) < 0.05 ? "igual" : d > 0 ? "sube" : "baja";
        const signo = d > 0 ? "+" : "";
        return `<span class="${clase}">${signo}${d.toFixed(decimales)} ${unidad}</span> · ${tr("vs. lectura anterior")}`;
    };
    const alterados = Object.values(resultados).filter(r => r.estado === "amarillo" || r.estado === "rojo").length;
    const pieGeneral = alterados === 0 ? tr("Todo en rango")
        : alterados === 1 ? tr("1 indicador alterado") : tr("{n} indicadores alterados", { n: alterados });
    const lpm = NOMBRES.frecuencia.unidad;
    pon("kpi-general", TEXTO_ESTADO[general], general, pieGeneral);
    pon("kpi-frecuencia", mediciones.frecuencia === null ? tr("sin dato") : `${mediciones.frecuencia} ${lpm}`, resultados.frecuencia.estado, cambio("frecuencia", lpm, 0));
    pon("kpi-temperatura", mediciones.temperatura === null ? tr("sin dato") : `${mediciones.temperatura} °C`, resultados.temperatura.estado, cambio("temperatura", "°C", 1));
    const pct = entorno.porcentajeLimite;
    pon("kpi-radiacion", `${entorno.radiacionMSv.toFixed(1)} mSv`, pct >= 90 ? "rojo" : pct >= 50 ? "amarillo" : "verde", tr("{pct}% del límite NASA (600 mSv)", { pct: pct.toFixed(1) }));
    const sub = document.getElementById("saludo-sub");
    if (sub) sub.textContent = `${tr("Día {dia} de misión", { dia: entorno.diaMision })} · ${entorno.nombreHabitat} · ${wearableActual().nombre}`;
}

function aplicarLectura(mediciones, resultados, general, entorno, fuente) {
    // El servidor Python devuelve el nombre del hábitat en español: se usa el del idioma de la página
    const hab = HABITATS[document.getElementById("habitat").value];
    if (hab) entorno.nombreHabitat = hab.nombre;
    marcarFuente(fuente);
    mostrarResultados(mediciones, resultados, general);
    mostrarEntorno(entorno);
    pintarKPIs(mediciones, resultados, general, entorno);

    registrarLectura(mediciones, resultados, entorno);
    registrarEnJuego(mediciones, resultados);
    graficarHistorial();
    anunciarAnomalias(resultados);
    actualizarBase(mediciones, resultados);
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
    let relojVisible = true;   // visible al cargar, encima de los gráficos

    function aplicarVisibilidadReloj() {
        relojEl.style.display = relojVisible ? "" : "none";
        if (panelEl) panelEl.hidden = !relojVisible;
        botonReloj.textContent = tr(relojVisible ? "Ocultar simulación" : "Ver simulación");
        if (relojVisible) actualizarReloj();
    }

    botonReloj.addEventListener("click", function () {
        relojVisible = !relojVisible;
        aplicarVisibilidadReloj();
    });
    aplicarVisibilidadReloj();
}

let temporizador = null;
const botonVivo = document.getElementById("btn-vivo");

let lecturasEnVivo = 0;

// ===== Incidencias automáticas =====
// Con el wearable conectado, la 2.ª lectura trae una alteración y después llega una nueva cada minuto
// (6 lecturas de 10 s). Cada incidencia dura 3 lecturas (30 s), así alcanza a generar el aviso a Tierra,
// y luego los datos vuelven a la normalidad hasta la siguiente.
const INCIDENCIAS = ["fiebre", "hipotension", "hipoglucemia"];
const LECTURAS_POR_MINUTO = Math.round(60000 / INTERVALO_MS);
const DURACION_INCIDENCIA = 3;

function incidenciasAutomaticas() {
    const c = document.getElementById("incidencias-auto");
    return !c || c.checked;
}

function escenarioDeLectura(n) {
    if (n < 2) return "normal";
    const k = n - 2;
    if (k % LECTURAS_POR_MINUTO >= DURACION_INCIDENCIA) return "normal";
    // Solo incidencias que el wearable elegido puede detectar (la hipoglucemia necesita el parche de glucosa)
    const posibles = INCIDENCIAS.filter(e => e !== "hipoglucemia" || wearableMide("glucosa"));
    return posibles[Math.floor(k / LECTURAS_POR_MINUTO) % posibles.length];
}

function cicloEnVivo() {
    if (lecturasEnVivo > 0 && lecturasEnVivo % 6 === 0) {   // 6 lecturas x 10 s = 1 día por minuto
        const campoDia = document.getElementById("dia-mision");
        campoDia.value = Number(campoDia.value) + 1;
    }
    lecturasEnVivo++;
    if (incidenciasAutomaticas()) {
        const selector = document.getElementById("escenario");
        const escenario = escenarioDeLectura(lecturasEnVivo);
        if (selector.value !== escenario) {
            selector.value = escenario;
            animoManual = false;      // el ánimo acompaña a la incidencia
        }
    }
    simularAstroskin();
    procesar();
}

botonVivo.addEventListener("click", function () {
    if (temporizador === null) {
        lecturasEnVivo = 0;           // la cuenta de incidencias empieza de nuevo al conectar
        cicloEnVivo();
        temporizador = setInterval(cicloEnVivo, INTERVALO_MS);
        botonVivo.textContent = tr("Desconectar wearable");
    } else {
        clearInterval(temporizador);
        temporizador = null;
        botonVivo.textContent = tr("Conectar wearable (simulado)");
    }
});

document.getElementById("btn-graficar").addEventListener("click", function () {
    if (HISTORIAL.length < 1) {
        alert(tr("No hay datos todavía. Registra al menos una lectura primero."));
        return;
    }
    graficarHistorial();
});


// ===== 5. ASISTENTE DE INTELIGENCIA ARTIFICIAL =====

// Respuesta con reglas locales, sin servidor (usa los mismos mensajes de la app)
// ¿Hay alguna lectura real? (procesada o al menos un valor en el formulario)
const SIN_LECTURAS = tr("Todavía no tengo lecturas tuyas, así que no puedo decirte cómo estás. Conecta el wearable o procesa una lectura y te respondo.");
function hayLecturas() {
    if (HISTORIAL.length > 0) return true;
    const m = leerMediciones();
    return ["temperatura", "frecuencia", "sistolica", "diastolica", "glucosa", "sueno"].some(k => m[k] !== null);
}

// Charla básica: Hermes contesta como una asistente aunque no haya lecturas ni internet
function respuestaCharla(texto) {
    const t = String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return null;
    // Se entienden frases en español y en inglés; la respuesta sale en el idioma de la página
    // Solo cuenta como charla si la frase ENTERA es charla: "¿qué tal está mi presión?" va a Gemini
    const t2 = t.replace(/^(?:oye |hola |hey |ok |okey )?(?:hermes |ermes |hermez )?/, "").replace(/(?: hermes| ermes| hermez)$/, "").trim();
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi|hello|good morning|good afternoon|good evening)$/.test(t) ||
        /^(hola|buenas|hey|hi|hello)( hermes| ermes| hermez)$/.test(t)) return tr("¡Hola! Aquí estoy. ¿En qué te ayudo?");
    if (/^(y )?(tu )?(hola )?(como estas|como esta|como estas tu|como te encuentras|que tal|que tal estas|como te va|como andas|como te sientes|como amaneciste|como has estado|how are you|how are you doing|how s it going)( tu| hoy)?$/.test(t2)) return tr("Estoy bien, gracias por preguntar, y listo para ayudarte. ¿Quieres que revise cómo estás tú?");
    if (/^(quien eres|que eres|como te llamas|cual es tu nombre|que significa hermes|que significa tu nombre|que quiere decir hermes|who are you|what are you|what s your name|what is your name)( tu)?$/.test(t2)) return tr("Soy Hermes, siglas de Health Evaluation and Remote Medical Expert System: tu sistema de evaluación de salud a bordo. Reviso tus lecturas, te aviso si algo se altera y te digo qué hacer.");
    if (/^(que puedes hacer|en que me ayudas|en que me puedes ayudar|que sabes hacer|ayuda|ayudame|what can you do|help me|help)$/.test(t2)) return tr("Puedo decirte cómo están tus indicadores, explicarte una alerta, decirte cuánta radiación llevas o cuánto falta para la respuesta de Tierra, y cambiar de wearable o iniciar la simulación.");
    return null;
}

// ¿La pregunta es sobre su propio estado de salud? (entonces sí hacen falta lecturas)
function preguntaSobreSalud(texto) {
    const t = String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return /\b(como estoy|estoy bien|mi |mis |me siento|tengo|parametros|indicadores|signos|temperatura|frecuencia|presion|glucosa|sueno|animo|fiebre|pulso|how am i|my |i feel|vitals|temperature|heart rate|pressure|glucose|sleep|mood|fever|pulse)\b/.test(t);
}

// Chistes de respaldo cuando no hay conexión con Gemini (con conexión, Gemini inventa otros)
const CHISTES = IDIOMA === "en" ? [
    "Why don't astronauts use hourglasses? In microgravity the sand just can't make up its mind.",
    "I tried to tell you a joke about gravity, but it didn't land.",
    "How do astronauts throw a party? They planet.",
] : [
    "¿Por qué los astronautas no usan reloj de arena? Porque en microgravedad la arena no se decide a bajar.",
    "Intenté contarte un chiste sobre la gravedad, pero no lograba que te cayera bien.",
    "En la Estación Espacial la comida no tiene mucho sabor, pero nadie se queja: todos dicen que está fuera de este mundo.",
    "¿Qué le dijo la Luna al Sol? Tanto brillar y no te dejan salir de noche.",
];

function respuestaLocalCliente(pregunta) {
    const charla = respuestaCharla(pregunta);
    if (charla) return charla;
    if (/chiste|gracioso|hazme re[ií]r|joke|funny|make me laugh/i.test(String(pregunta || ""))) {
        return CHISTES[Math.floor(Math.random() * CHISTES.length)];
    }
    if (!hayLecturas()) {
        return preguntaSobreSalud(pregunta) || !pregunta
            ? SIN_LECTURAS
            : tr("Ahora mismo no tengo conexión con mi asistente en línea, así que solo puedo responder sobre tus lecturas y comandos básicos.") + " " + SIN_LECTURAS;
    }
    const mediciones = leerMediciones();
    const resultados = evaluarTodo(mediciones);
    const partes = [];
    for (const clave in resultados) {
        const r = resultados[clave];
        if (r.estado === "verde" || r.direccion === null) continue;
        const llave = r.estado + "-" + r.direccion;
        const m = (MENSAJES[clave] && MENSAJES[clave][llave]) || MENSAJES_PRESION[llave];
        const texto = m ? m.pasa + " " + m.hacer : tr("{nombre} fuera de rango.", { nombre: NOMBRES[clave].nombre });
        if (!partes.includes(texto)) partes.push(texto);   // sistólica y diastólica comparten mensaje
    }
    if (partes.length === 0) return tr("Según tus mediciones, todos los indicadores están dentro de los rangos normales.");
    return tr("Según tus mediciones:") + " " + partes.join(" ");
}

// Las alternativas del reconocedor solo valen para la frase que se acaba de oír
function porVozReciente() { return Array.isArray(window.novaAlternativas) && window.novaAlternativas.length > 0; }

// Memoria corta de la conversación (como Alexa: entiende "¿y ayer?", "¿por qué?")
window.novaConversacion = [];
function recordarTurno(pregunta, respuesta) {
    window.novaConversacion.push({ astronauta: pregunta, nova: respuesta });
    if (window.novaConversacion.length > 6) window.novaConversacion.shift();
}

async function consultarAsistente(pregunta, porVoz = false) {
    if (typeof alertaAtendida === "function") alertaAtendida();
    const charlaRapida = respuestaCharla(pregunta);
    if (charlaRapida) {
        const chat = document.getElementById("chat-ia");
        [[tr("Astronauta: "), pregunta], ["Hermes: ", charlaRapida]].forEach(function (p) {
            const el = document.createElement("p"); el.textContent = p[0] + p[1]; chat.appendChild(el);
        });
        if (porVoz) hablar(charlaRapida);
        recordarTurno(pregunta, charlaRapida);
        return charlaRapida;
    }

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
        conversacion: (window.novaConversacion || []).slice(-6),
        transcripcionesAlternativas: porVozReciente() ? (window.novaAlternativas || []) : [],
        sinLecturas: !hayLecturas(),
        lecturasProcesadas: HISTORIAL.length,
        entorno: {
            radiacionMSv: entorno.radiacionMSv,
            porcentajeLimite: entorno.porcentajeLimite,
            gravedad: entorno.gravedad,
            perdidaOsea: entorno.perdidaOsea
        }
    };
    window.novaAlternativas = [];      // ya se usaron para esta pregunta

    const mensajeUsuario = document.createElement("p");
    mensajeUsuario.textContent = tr("Astronauta: ") + pregunta;

    const mensajeIA = document.createElement("p");
    mensajeIA.textContent = "Hermes: " + tr("Analizando mediciones...");

    chat.appendChild(mensajeUsuario);
    chat.appendChild(mensajeIA);

    boton.disabled = true;
    boton.textContent = tr("Consultando a Hermes...");

    try {

        // Se lee como texto primero: si el servidor responde vacío o con HTML, el error dice qué pasó.
        // Un solo reintento automático ante respuestas vacías o errores 5xx (arranques en frío).
        let respuesta, textoRespuesta, datos;
        const RUTAS = ["/api/nova", "/api/asistente"];      // Python primero; la versión anterior queda de respaldo
        for (let intento = 0; intento < RUTAS.length; intento++) {
            try {
                respuesta = await fetch(RUTAS[intento], {
                    signal: (typeof AbortSignal !== "undefined" && AbortSignal.timeout) ? AbortSignal.timeout(20000) : undefined,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pregunta: pregunta, contexto: contexto, idioma: IDIOMA }),
                });
                textoRespuesta = await respuesta.text();
            } catch (errorRed) {
                if (intento === RUTAS.length - 1) throw errorRed;
                continue;
            }
            const valida = respuesta.ok && textoRespuesta.trim().startsWith("{");
            if (valida || intento === RUTAS.length - 1) break;
        }

        try {
            datos = JSON.parse(textoRespuesta);
        } catch (_) {
            throw new Error(
                "El servidor respondió sin datos válidos (HTTP " + respuesta.status + ")" +
                (textoRespuesta.trim() ? ": " + textoRespuesta.trim().slice(0, 100) : " con el cuerpo vacío.")
            );
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.error || "No se pudo consultar el asistente."
            );
        }

        mensajeIA.textContent = "Hermes: " + datos.respuesta;
        if (porVoz) hablar(resumenParaVoz(datos.respuesta));   // si preguntaste hablando, responde hablando
        recordarTurno(pregunta, datos.respuesta);
        return datos.respuesta;

    } catch (error) {

        console.error("Error de consulta:", error);

        // Respaldo: si el asistente en línea falla, se responde con las reglas locales
        // (así la conversación de voz sigue funcionando aunque el servidor falle).
        const local = respuestaLocalCliente(pregunta);
        mensajeIA.textContent = tr("Hermes (sin conexión con el asistente en línea): ") + local;
        if (porVoz) hablar(local);
        recordarTurno(pregunta, local);
        return local;

    } finally {

        boton.disabled = false;
        boton.textContent = tr("Consultar a Hermes");

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

// ===== Hermes: asistente por voz al estilo Alexa =====
// - Se activa como Siri o Google: "Oye Hermes", "Ok Hermes", "Hey Hermes" o solo "Hermes".
// - No hay botón: empieza a escuchar sola al abrir la página (o con el primer toque si el navegador lo exige).
// - Suena un tono al oírte, igual que Alexa, y escucha tu pregunta.
// - Tras responder sigue escuchando unos segundos para que sigas la conversación sin repetir su nombre.
// - "Hermes, para" / "Hermes, silencio" la interrumpe aunque esté hablando.
// - "Hermes, deja de escuchar" apaga el micrófono; tocar la página la vuelve a encender.
// - Comandos rápidos que se resuelven al instante (hora, día, wearable, simulación, Tierra...).

const NOMBRE_ASISTENTE = "Hermes";

(function () {
    const boton = document.getElementById("btn-microfono");
    const estadoEl = document.getElementById("estado-microfono");
    const botonEscribir = document.getElementById("btn-escribir");
    const formulario = document.getElementById("formulario-asistente");

    // Respaldo: escribir (se muestra solo si el usuario lo pide)
    if (botonEscribir && formulario) {
        botonEscribir.addEventListener("click", function () {
            formulario.hidden = !formulario.hidden;
            botonEscribir.textContent = tr(formulario.hidden ? "⌨ Escribir en vez de hablar" : "⌨ Ocultar teclado");
        });
    }
    if (!boton) return;

    const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reconocimiento) {
        boton.disabled = true;
        estadoEl.textContent = tr("Tu navegador no permite reconocimiento de voz (usa Chrome o Edge).");
        return;
    }

    const normalizar = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
    // "Hermes ..." al inicio de la frase. "nueva" solo cuenta si va después de "oye/hey/ok"
    // "Hermes" en cualquier parte de la frase (el reconocedor a veces escribe ermes, hermez, Hermès...)
    const ACTIVACION = /(?:^|\s)(?:hermes|ermes|hermez|ermez|hermess|irmes)\b\s*(.*)$/;
    const ACTIVACION_NUEVA = /(?:^|\s)(?:oye|hey|hola|ok|okey)\s+(?:her mes|er mes|ernes|hernes|germes|hermel)\b\s*(.*)$/;
    // Órdenes en español y en inglés (funcionan en cualquier idioma de la página)
    const PARAR = /^(?:para|parar|silencio|callate|calla|detente|cancela|cancelar|basta|stop|ya|quiet|silence|cancel|enough|shut up|be quiet)\b/;
    const APAGAR = /^(?:deja de escuchar(?:me)?|no escuches|apagate|apaga el microfono|desactivate|duermete|a dormir|stop listening|turn off|go to sleep|deactivate|mute the microphone)\b/;
    // "Adiós" / "hasta luego": Hermes se despide y se queda en silencio hasta que vuelvan a decir «Hermes»
    const DESPEDIDA = /\b(adios|hasta luego|hasta pronto|hasta manana|hasta la proxima|nos vemos|chao|chau|bye|bye bye|goodbye|good bye|see you|see you later)\b/;
    let dormida = false;
    const SEGUIMIENTO_MS = 7000;   // tiempo para seguir hablando sin decir "Hermes"
    const ESCUCHA_MS = 8000;       // tiempo para hacer la pregunta tras decir "Hermes"

    let reco = null;
    let activo = false;
    let estado = "apagado";        // apagado | esperando | escuchando | pensando | hablando
    let temporizador = null;
    let ultimaRespuesta = "";
    let microListo = false;
    // Modo conversación: responde a todo lo que oiga, sin tener que decir "Hermes".
    // Modo nombre: solo responde cuando dices "Hermes" (útil en lugares con mucha gente o ruido).
    // Por defecto funciona como Siri o Google: espera a oír «Hermes» / «Oye Hermes» antes de responder.
    let modoLibre = true;      // por defecto responde sin decir «Hermes»
    try { modoLibre = localStorage.getItem("run3rs-nova-modo") !== "nombre"; } catch (_) {}
    const botonModo = document.createElement("button");
    botonModo.type = "button";
    botonModo.id = "btn-modo-nova";
    function pintarModo() {
        botonModo.textContent = tr(modoLibre ? "💬 Modo conversación (sin decir «Hermes»)" : "🏷 Modo nombre (di «Hermes» primero)");
        botonModo.title = tr(modoLibre ? "Responde a todo lo que oye. Cámbialo si hay mucho ruido o gente hablando." : "Solo responde cuando dices «Hermes».");
    }
    botonModo.addEventListener("click", function () {
        modoLibre = !modoLibre;
        try { localStorage.setItem("run3rs-nova-modo", modoLibre ? "libre" : "nombre"); } catch (_) {}
        pintarModo();
        if (activo) aEspera();
    });
    pintarModo();
    const secundarios = document.querySelector(".nova-secundarios");
    if (secundarios) secundarios.insertAdjacentElement("afterbegin", botonModo);
    // Línea que muestra lo que el micrófono está oyendo (para saber si de verdad te escucha)
    const oido = document.createElement("p");
    oido.id = "nova-oido";
    oido.setAttribute("aria-live", "polite");
    estadoEl.parentNode.insertAdjacentElement("afterend", oido);

    function ponerEstado(nuevo, mensaje) {
        estado = nuevo;
        window.novaEstado = nuevo === "hablando" ? "esperando" : nuevo;
        const textos = {
            apagado: "🎙 Activar a Hermes",
            esperando: "🔴 Hermes está atenta · pulsa para apagar",
            escuchando: "🟢 Te escucho...",
            pensando: "⏳ Pensando...",
            hablando: "🔊 Hermes habla · di «Hermes, para» para cortarla",
        };
        boton.textContent = tr(textos[nuevo]);
        estadoEl.textContent = mensaje || "";
    }

    // Tono corto al activarse (como Alexa). Usa el mismo audio que la voz de Hermes.
    function tono(subida) {
        const ctx = asegurarAudio();
        if (!ctx) return;
        const t0 = ctx.currentTime;
        [subida ? 660 : 880, subida ? 990 : 590].forEach(function (f, i) {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = "sine"; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t0 + i * 0.09);
            g.gain.exponentialRampToValueAtTime(0.18, t0 + i * 0.09 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.16);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0 + i * 0.09); o.stop(t0 + i * 0.09 + 0.18);
        });
    }

    function arrancar() {
        if (!activo || !reco) return;
        try { reco.start(); } catch (_) { /* ya estaba escuchando */ }
    }

    let topeVozMs = 15000;
    function esperarFinVoz(fn) {
        const inicio = Date.now();
        setTimeout(function revisar() {
            if (novaEstaHablando() && Date.now() - inicio < topeVozMs) { setTimeout(revisar, 250); return; }
            if (novaEstaHablando()) detenerVoz();    // el navegador se quedó "hablando": se libera
            setTimeout(fn, 250);
        }, 300);
    }

    function aEspera() {
        clearTimeout(temporizador);
        if (!activo) return;
        ponerEstado("esperando", tr(dormida ? "En silencio. Di «Hermes» para volver a hablar" : modoLibre ? "Háblame cuando quieras" : "Di «Oye Hermes» y tu pregunta"));
        vaciarAlertasPendientes();
    }

    function abrirEscucha(ms, mensaje) {
        clearTimeout(temporizador);
        ponerEstado("escuchando", mensaje);
        temporizador = setTimeout(function () { if (estado === "escuchando") aEspera(); }, ms);
    }

    // Tras hablar: modo seguimiento (puedes seguir sin decir "Hermes")
    function trasHablar(seguimiento) {
        esperarFinVoz(function () {
            if (!activo) return;
            if (vaciarAlertasPendientes()) { esperarFinVoz(() => trasHablar(seguimiento)); return; }
            if (!seguimiento) { aEspera(); return; }
            abrirEscucha(SEGUIMIENTO_MS, tr("Puedes seguir hablando, o di «Hermes» más tarde"));
        });
    }

    function decir(texto, seguimiento = true) {
        if (seguimiento) ultimaRespuesta = texto;
        topeVozMs = Math.min(40000, 6000 + texto.length * 90);
        // Si Hermes se encendió sola al abrir la página, el navegador no deja sonar audio hasta que
        // el usuario toque la página una vez: la respuesta se ve en el subtítulo y se avisa.
        const sinGesto = navigator.userActivation && !navigator.userActivation.hasBeenActive;
        ponerEstado("hablando", sinGesto ? tr("Toca la página una vez para poder oír mi voz.") : "");
        hablar(texto);
        trasHablar(seguimiento);
    }

    function apagar(mensaje) {
        activo = false;
        clearTimeout(temporizador);
        try { reco.stop(); } catch (_) {}
        ponerEstado("apagado", mensaje);
    }

    // ----- Comandos rápidos (sin internet, respuesta inmediata) -----
    function comandoRapido(t) {
        const charla = respuestaCharla(t);
        if (charla) return charla;
        // Las frases se reconocen en español y en inglés; la respuesta sale en el idioma de la página
        // Todo lo que no sea una orden corta y clara lo interpreta Gemini (entiende la intención, no palabras sueltas)
        const n = t.split(" ").filter(Boolean).length;
        if (n > 8) return null;
        if (/^(gracias|muchas gracias|mil gracias|ok gracias|thanks|thank you)( hermes| ermes)?$/.test(t)) return tr("De nada. Aquí estoy.");
        if (/^(repite|repitelo|repitemelo|repite eso|otra vez|que dijiste|como dijiste|puedes repetir|no te entendi|repeat|say that again|what did you say)( por favor| please)?$/.test(t)) return ultimaRespuesta || tr("Aún no he dicho nada.");
        if (/^(dime )?(que hora es|la hora|que hora tenemos|what time is it|tell me the time)( por favor| please)?$/.test(t)) {
            const d = new Date();
            return IDIOMA === "en"
                ? `It's ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}.`
                : `Son las ${numeroEnPalabras(d.getHours())} y ${numeroEnPalabras(d.getMinutes())}.`;
        }
        if (/^(que dia (es|es hoy|de (la )?mision es)|en que dia (de (la )?mision )?(estoy|estamos|vamos)|dia de (la )?mision|what day is it|what mission day is it)$/.test(t)) return tr("Estás en el día {dia} de la misión.", { dia: numeroEnPalabras(diaActual()) });
        if (/\b(tierra|earth)\b/.test(t) && /\b(cuanto falta|cuando|tarda|llega|respuesta|responde|how long|when)\b/.test(t)) {
            if (relojTierra && relojTierra.restante !== undefined) return tr("La respuesta de Tierra llega en {tiempo}.", { tiempo: tiempoHablado(relojTierra.restante) });
            if (relojTierra && relojTierra.recibida) return tr("La respuesta de Tierra ya llegó. Sigue el protocolo.");
            if (/\b(aviso|alerta|mi |respuesta de|response)\b/.test(t)) return tr("No hay ningún aviso a Tierra en curso.");
        }
        // Órdenes: el verbo va al principio ("inicia la simulación", "desconecta el wearable")
        const sim = n <= 6 && !/^(para|por) que\b/.test(t) && /\b(simulacion|wearable|monitoreo|lecturas|simulation|monitoring|readings)\b/.test(t);
        if (sim && /^(por favor )?(inicia|iniciar|empieza|empezar|comienza|conecta|conectar|activa|activar|enciende|arranca|pon|start|begin|connect|activate|turn on)\b/.test(t)) {
            if (!temporizador_vivo_activo()) document.getElementById("btn-vivo").click();
            return tr("Listo, wearable conectado. Recibirás una lectura cada {n} segundos.", { n: numeroEnPalabras(INTERVALO_MS / 1000) });
        }
        if (sim && /^(por favor )?(deten|detener|para|parar|desconecta|desconectar|apaga|apagar|termina|terminar|stop|disconnect|turn off|end)\b/.test(t)) {
            if (temporizador_vivo_activo()) document.getElementById("btn-vivo").click();
            return tr("Listo, wearable desconectado.");
        }
        const cambio = n <= 6 && /^(por favor )?(usa|usar|cambia|cambiar|pon|poner|elige|selecciona|simula|use|switch|change|pick|select)\b/.test(t);
        if (cambio && /\b(bio ?monitor|camiseta|shirt)\b/.test(t)) return elegirWearable("biomonitor");
        if (cambio && /\b(whoop|banda|band)\b/.test(t)) return elegirWearable("whoop");
        if (cambio && /\b(reloj|watch|smartwatch)\b/.test(t)) return elegirWearable("reloj");
        if (cambio && /\b(wearable|dispositivo|device|otro|siguiente|next|another)\b/.test(t)) {
            cambiarWearable(1);
            return tr("Cambié a {nombre}.", { nombre: wearableActual().nombre });
        }
        return null;
    }

    function temporizador_vivo_activo() {
        const b = document.getElementById("btn-vivo");
        return b && b.textContent.trim() === tr("Desconectar wearable");
    }

    function elegirWearable(id) {
        const i = WEARABLES.findIndex(w => w.id === id);
        if (i < 0) return null;
        cambiarWearable(i - indiceWearable);
        return tr("Ahora simulo con {nombre}.", { nombre: wearableActual().nombre });
    }

    async function atender(pregunta) {
        clearTimeout(temporizador);
        const rapido = comandoRapido(pregunta);
        if (rapido) {
            tono(true);
            const chat = document.getElementById("chat-ia");
            [[tr("Astronauta: "), pregunta], ["Hermes: ", rapido]].forEach(function (p) {
                const el = document.createElement("p");
                el.textContent = p[0] + p[1];
                chat.appendChild(el);
            });
            recordarTurno(pregunta, rapido);
            decir(rapido);
            return;
        }
        ponerEstado("pensando", "");
        const respuesta = await consultarAsistente(pregunta, false);
        if (!activo) return;
        decir(resumenParaVoz(respuesta || tr("No pude responder ahora. Inténtalo de nuevo.")));
    }

    // Las alertas automáticas esperan mientras Hermes conversa
    window.novaOcupada = function () {
        return activo && (estado === "escuchando" || estado === "pensando" || estado === "hablando");
    };

    function procesar(texto) {
        const t = normalizar(texto);
        if (!t) return;

        const conNombre = t.match(ACTIVACION);

        // Despedida: corta lo que esté diciendo, se despide y queda en silencio (funciona aunque esté hablando)
        if (!dormida && DESPEDIDA.test(t) && t.split(" ").length <= 5) {
            detenerVoz();
            clearTimeout(temporizador);
            dormida = true;
            tono(false);
            decir(tr("Hasta luego. Di «Hermes» cuando me necesites."), false);
            return;
        }
        // En silencio: solo despierta si la llaman por su nombre ("Hermes, ¿cómo estoy?")
        if (dormida) {
            if (!conNombre || estado === "hablando") return;
            dormida = false;
            if (!conNombre[1].trim()) { tono(true); abrirEscucha(ESCUCHA_MS, tr("Te escucho")); return; }
            atender(conNombre[1].trim());
            return;
        }

        // "Hermes, deja de escuchar" / "Hermes, stop listening": apaga el micrófono; tocar la página la vuelve a encender.
        // Con su nombre funciona siempre; sin nombre, solo si ya la estabas llamando (o en modo conversación).
        // Va antes que "para/stop" porque "stop listening" también empieza con "stop".
        const ordenApagar = conNombre ? conNombre[1]
            : (estado === "escuchando" || (modoLibre && estado === "esperando")) ? t : "";
        if (ordenApagar && APAGAR.test(ordenApagar)) {
            detenerVoz();
            tono(false);
            apagar(tr("Hermes no está escuchando. Toca la página para volver a activarla."));
            hablar(tr("De acuerdo, dejo de escuchar. Toca la pantalla cuando me necesites."));
            esperarPrimerToque();
            return;
        }

        // Interrumpir: "Hermes, para" (funciona aunque esté hablando o pensando)
        if (conNombre && PARAR.test(conNombre[1]) && conNombre[1].split(" ").length <= 3) {
            detenerVoz();
            tono(false);
            aEspera();
            return;
        }

        if (modoLibre && (estado === "hablando" || estado === "pensando") && PARAR.test(t) && t.split(" ").length <= 2) {
            detenerVoz();
            tono(false);
            aEspera();
            return;
        }

        // Mientras habla o piensa, ignora lo que oye (es su propia voz)
        if (estado === "hablando" || estado === "pensando" || novaEstaHablando()) return;

        if (estado === "escuchando") {
            if (PARAR.test(t) && t.split(" ").length <= 2) { tono(false); aEspera(); return; }
            const m = t.match(ACTIVACION) || t.match(ACTIVACION_NUEVA);
            const pregunta = m ? m[1].trim() : t;
            if (pregunta) atender(pregunta);
            return;
        }

        if (estado !== "esperando") return;

        // Modo conversación: cualquier frase es una pregunta (con o sin "Hermes" delante)
        if (modoLibre) {
            if (PARAR.test(t) && t.split(" ").length <= 2) return;          // "para", "silencio" sueltos
            const conN = t.match(ACTIVACION) || t.match(ACTIVACION_NUEVA);
            const pregunta = (conN ? conN[1] : t).trim();
            if (!pregunta) { tono(true); abrirEscucha(ESCUCHA_MS, tr("Te escucho")); return; }
            if (pregunta.split(" ").length < 2 && !comandoRapido(pregunta) && !respuestaCharla(pregunta)) return; // ruido suelto
            atender(pregunta);
            return;
        }

        const m = t.match(ACTIVACION) || t.match(ACTIVACION_NUEVA);
        if (!m) return;
        const resto = m[1].trim();
        if (resto.split(" ").filter(Boolean).length >= 2 || comandoRapido(resto)) {
            atender(resto);                                   // "Hermes, ¿cómo estoy?" en una sola frase
        } else {
            tono(true);                                       // solo dijo "Hermes": tono y escucha
            abrirEscucha(ESCUCHA_MS, tr("Te escucho"));
        }
    }

    function crear() {
        reco = new Reconocimiento();
        reco.lang = idiomaReconocimiento();
        reco.continuous = true;
        reco.interimResults = true;
        reco.maxAlternatives = 3;       // otras transcripciones posibles: Gemini elige la que tiene sentido
        reco.onresult = function (e) {
            let parcial = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const r = e.results[i];
                const t = r[0].transcript;
                if (r.isFinal) {
                    // Mientras Hermes habla o piensa se procesa al instante (para poder decirle "para")
                    if (estado === "hablando" || estado === "pensando") { procesar(t); continue; }
                    const alts = [];
                    for (let k = 1; k < r.length; k++) if (r[k] && r[k].transcript) alts.push(r[k].transcript.trim());
                    acumular(t, alts);
                } else {
                    parcial += t;
                }
            }
            if (parcial && estado !== "hablando") {
                oido.textContent = tr("Oyendo: «{texto}…»", { texto: (frase + " " + parcial).trim() });
                if (pausa) { clearTimeout(pausa); pausa = setTimeout(cerrarFrase, PAUSA_MS); }   // sigue hablando: espera
            }
        };
        reco.onaudiostart = function () { microListo = true; };
        reco.onerror = function (e) {
            if (e.error === "not-allowed" || e.error === "service-not-allowed") {
                apagar(tr("Permite el micrófono en el navegador (candado junto a la dirección) y toca la página."));
                esperarPrimerToque();
            } else if (e.error === "audio-capture") {
                apagar(tr("No se encontró un micrófono."));
            } else if (e.error === "network") {
                estadoEl.textContent = tr("Sin conexión con el servicio de voz. Reintentando...");
            }
        };
        // Chrome corta el reconocimiento tras un rato: se reinicia solo para seguir atenta.
        // Si nunca llegó audio y se corta varias veces seguidas, el navegador la está bloqueando
        // hasta que el usuario interactúe: se deja de reintentar y se espera el primer toque.
        reco.onend = function () {
            if (!activo) return;
            if (!microListo && ++reintentosSinAudio > 3) {
                apagar(tr("Toca la página para que Hermes empiece a escuchar."));
                esperarPrimerToque();
                return;
            }
            setTimeout(arrancar, 250);
        };
    }

    let reintentosSinAudio = 0;

    // Chrome corta la frase en cada pausa ("¿qué hago si..." / "...me duele la cabeza?").
    // Se juntan los trozos y se responde cuando el astronauta deja de hablar un momento.
    const PAUSA_MS = 1100;
    let frase = "";
    let alternativasFrase = [];
    let pausa = null;
    function acumular(t, alts) {
        frase = (frase + " " + t).trim();
        if (alts.length) alternativasFrase = alts.map(a => (frase.slice(0, frase.length - t.trim().length) + " " + a).trim());
        oido.textContent = tr("Oí: «{texto}»", { texto: frase });
        clearTimeout(pausa);
        pausa = setTimeout(cerrarFrase, PAUSA_MS);
    }
    function cerrarFrase() {
        clearTimeout(pausa);
        pausa = null;
        const t = frase;
        window.novaAlternativas = alternativasFrase.slice(0, 3);
        frase = "";
        alternativasFrase = [];
        if (t) procesar(t);
    }

    // Español latino: es-US (o el español del dispositivo, p. ej. es-DO) reconoce mejor que es-ES el acento caribeño
    function idiomaReconocimiento() {
        if (IDIOMA === "en") return "en-US";
        const del = (navigator.languages || [navigator.language || ""]).find(l => /^es-/i.test(l) && !/^es-es$/i.test(l));
        return del || "es-US";
    }

    function encender(saludar) {
        activo = true;
        dormida = false;
        reintentosSinAudio = 0;
        asegurarAudio();
        crear();
        arrancar();
        if (saludar) {
            tono(true);
            decir(tr(modoLibre ? "Hola, soy Hermes. Te escucho, pregúntame lo que quieras." : "Hola, soy Hermes. Cuando me necesites, di «Oye Hermes»."), false);
        } else {
            aEspera();
        }
        setTimeout(function () {
            if (activo && !microListo) estadoEl.textContent = tr("No recibo audio del micrófono. Revisa el permiso (candado junto a la dirección) y que el micrófono correcto esté seleccionado.");
        }, 5000);
    }

    // Sin botón, como Siri o Google: Hermes siempre está atenta a «Oye Hermes».
    boton.hidden = true;

    // Si el navegador no deja usar el micrófono hasta que el usuario interactúe,
    // Hermes se enciende con el primer toque o tecla en cualquier parte de la página.
    function esperarPrimerToque() {
        const alTocar = function () {
            ["pointerdown", "keydown"].forEach(ev => window.removeEventListener(ev, alTocar));
            if (!activo) encender(false);
        };
        ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, alTocar));
    }

    // Al abrir la página empieza a escuchar sola (la primera vez el navegador pide permiso del micrófono)
    encender(false);
})();

// ===== Orbe de Hermes (animación de partículas en canvas) =====
(function () {
    const lienzo = document.getElementById("nova-orbe");
    if (!lienzo || !lienzo.getContext) return;
    const ctx = lienzo.getContext("2d");
    if (!ctx || typeof ctx.createRadialGradient !== "function") return;

    const N = 4200;
    const puntos = [];
    const aureo = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = aureo * i;
        puntos.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }

    const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let nivel = 0, ancho = 0, alto = 0, dpr = 1;

    function ajustar() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        ancho = lienzo.clientWidth || 260;
        alto = lienzo.clientHeight || 260;
        lienzo.width = Math.round(ancho * dpr);
        lienzo.height = Math.round(alto * dpr);
    }
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(lienzo);
    ajustar();

    const COLORES = {
        apagado:    [90, 140, 220],
        esperando:  [70, 150, 255],
        escuchando: [80, 220, 255],
        pensando:   [150, 130, 255],
    };
    // Con advertencias, el color de la alerta manda sobre el de actividad
    const COLORES_ALERTA = {
        amarillo: [255, 190, 60],
        rojo:     [255, 70, 70],
    };
    const color = COLORES.apagado.slice();     // color actual, se mezcla suave hacia el objetivo

    function cuadro(t) {
        t = quieto ? 0 : t / 1000;
        const estado = window.novaEstado || "apagado";
        const hablando = (window.novaNivelVoz || 0) > 0.02;
        const alerta = window.novaAlerta;
        let objetivo = hablando ? window.novaNivelVoz : (estado === "escuchando" ? 0.25 : estado === "pensando" ? 0.15 : 0.05);
        if (alerta === "rojo" && !hablando) objetivo += 0.08 * (1 + Math.sin(t * 3));   // latido lento en rojo
        nivel += (objetivo - nivel) * 0.18;

        const meta = COLORES_ALERTA[alerta] || (hablando ? [90, 170, 255] : (COLORES[estado] || COLORES.apagado));
        for (let k = 0; k < 3; k++) color[k] += (meta[k] - color[k]) * 0.06;
        const base = color.map(Math.round);
        const cx = ancho / 2, cy = alto / 2;
        const radio = Math.min(ancho, alto) * 0.27 * (1 + nivel * 0.12);
        const giro = t * (estado === "pensando" ? 0.9 : 0.25);
        const amp = 0.06 + nivel * 0.28;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);

        const halo = ctx.createRadialGradient(cx, cy, radio * 0.2, cx, cy, radio * 1.6);
        halo.addColorStop(0, `rgba(${base[0]},${base[1]},${base[2]},${0.10 + nivel * 0.25})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, ancho, alto);

        ctx.globalCompositeOperation = "lighter";
        const cg = Math.cos(giro), sg = Math.sin(giro);
        const inc = 0.35, ci = Math.cos(inc), si = Math.sin(inc);
        for (let i = 0; i < N; i++) {
            const p = puntos[i];
            // superficie ondulada (suma de senos = ruido barato)
            const d = 1 + amp * (
                Math.sin(p[0] * 4.1 + t * 1.3) * Math.cos(p[1] * 3.7 - t * 0.9) +
                0.5 * Math.sin(p[2] * 6.3 + p[0] * 2.1 + t * 1.7));
            let x = p[0] * d, y = p[1] * d, z = p[2] * d;
            const x2 = x * cg + z * sg, z2 = -x * sg + z * cg;
            const y2 = y * ci - z2 * si, z3 = y * si + z2 * ci;
            const prof = (z3 + 1.4) / 2.8;               // 0 atrás, 1 delante
            const persp = 1 / (1.9 - z3 * 0.5);
            const sx = cx + x2 * radio * persp * 1.5, sy = cy + y2 * radio * persp * 1.5;
            const brillo = (0.08 + prof * 0.42 + nivel * 0.25) * (0.75 + 0.5 * Math.abs(d - 1) / Math.max(amp, 0.01));
            ctx.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${Math.min(1, brillo)})`;
            const tam = 0.8 + prof * 1.4;
            ctx.fillRect(sx, sy, tam, tam);
        }
        ctx.globalCompositeOperation = "source-over";
        requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
})();

// Subtítulo: muestra lo último que dijo Hermes (la transcripción completa queda oculta)
(function () {
    const chat = document.getElementById("chat-ia");
    const sub = document.getElementById("nova-subtitulo");
    const boton = document.getElementById("btn-transcripcion");
    if (!chat || !sub) return;
    new MutationObserver(function () {
        const ultimo = chat.lastElementChild;
        if (!ultimo) return;
        const t = ultimo.textContent.replace(/^Hermes( \([^)]*\))?:\s*/, "").replace(/^(Astronauta|Astronaut):\s*/, tr("Tú: "));
        const frases = t.match(/[^.!?]+[.!?]?/g) || [t];
        let corto = frases.slice(0, 2).join("").trim();
        if (corto.length > 150) corto = corto.slice(0, 147).trim() + "…";
        sub.textContent = corto;
    }).observe(chat, { childList: true, subtree: true, characterData: true });
    if (boton) boton.addEventListener("click", function () {
        chat.hidden = !chat.hidden;
        boton.textContent = tr(chat.hidden ? "Ver transcripción" : "Ocultar transcripción");
    });
})();

// ===== Misión salud: gamificación =====
// Premia HÁBITOS (medirse, hidratarse, entrenar, dormir, registrar el ánimo, responder a alertas),
// nunca que los valores salgan normales: así nadie tiene motivo para ocultar un síntoma.
const TAREAS = [
    { id: "medir",     texto: "Llevar puesto el wearable y sincronizar", puntos: 20, auto: true },
    { id: "animo",     texto: "Registrar tu estado de ánimo",    puntos: 10, auto: true },
    { id: "agua",      texto: "Beber al menos 2 litros de agua", puntos: 10 },
    { id: "ejercicio", texto: "Ejercicio de resistencia (huesos y músculo)", puntos: 25 },
    { id: "dormir",    texto: "Dormir 7 horas o más",            puntos: 15, auto: true },
    { id: "alerta",    texto: "Responder a una alerta (consultar a Hermes)", puntos: 20, auto: true },
];
const LOGROS = [
    { id: "primera",   texto: "Primera sincronización",               cumple: j => j.mediciones >= 1 },
    { id: "racha3",    texto: "3 días seguidos con el wearable",      cumple: j => j.racha >= 3 },
    { id: "racha7",    texto: "7 días seguidos con el wearable",      cumple: j => j.racha >= 7 },
    { id: "dia",       texto: "Día completo (todas las tareas)", cumple: j => j.diasCompletos >= 1 },
    { id: "alerta",    texto: "Respondiste a una alerta",        cumple: j => j.alertasAtendidas >= 1 },
    { id: "reflejos",  texto: "Reflejos de astronauta (menos de 300 ms)", cumple: j => !!(j.records && j.records.reaccion && j.records.reaccion < 300) },
    { id: "trivia",    texto: "Experto en salud espacial (trivia 5 de 5)", cumple: j => !!(j.records && j.records.trivia >= 5) },
];
traducirDatos(TAREAS, "TAREAS");
traducirDatos(LOGROS, "LOGROS");

const PUNTOS_POR_NIVEL = 200;

const juego = (function cargar() {
    const base = { puntos: 0, racha: 0, ultimoDia: null, dia: null, hechas: {}, mediciones: 0, diasCompletos: 0, alertasAtendidas: 0, logros: {}, alertaPendiente: false };
    try { return Object.assign(base, JSON.parse(localStorage.getItem("run3rs-juego") || "{}")); } catch (_) { return base; }
})();

function guardarJuego() {
    try { localStorage.setItem("run3rs-juego", JSON.stringify(juego)); } catch (_) {}
}

function diaActual() {
    return Number(document.getElementById("dia-mision").value) || 1;
}

function prepararDia() {
    const dia = diaActual();
    if (juego.dia === dia) return;
    juego.dia = dia;
    juego.hechas = {};
}

function completarTarea(id) {
    prepararDia();
    if (juego.hechas[id]) return;
    const t = TAREAS.find(x => x.id === id);
    if (!t) return;
    juego.hechas[id] = true;
    juego.puntos += t.puntos;
    if (TAREAS.every(x => juego.hechas[x.id])) juego.diasCompletos++;
    revisarLogros();
    guardarJuego();
    pintarJuego();
}

let ultimoLogro = null;      // se muestra unos segundos en la tarjeta aunque se vuelva a pintar

function revisarLogros() {
    LOGROS.forEach(function (l) {
        if (!juego.logros[l.id] && l.cumple(juego)) {
            juego.logros[l.id] = true;
            ultimoLogro = { texto: l.texto, hasta: Date.now() + 6000 };
        }
    });
}

function registrarEnJuego(mediciones, resultados) {
    prepararDia();
    actualizarDiaNova();
    const dia = diaActual();
    juego.mediciones++;
    if (juego.ultimoDia !== dia) {
        juego.racha = (juego.ultimoDia !== null && dia === juego.ultimoDia + 1) ? juego.racha + 1 : 1;
        juego.ultimoDia = dia;
    }
    completarTarea("medir");
    if (mediciones.animo !== null && mediciones.animo !== undefined) completarTarea("animo");
    if (Number(mediciones.sueno) >= 7) completarTarea("dormir");
    const hayAlerta = Object.values(resultados).some(r => r.estado === "amarillo" || r.estado === "rojo");
    if (hayAlerta) juego.alertaPendiente = true;
    revisarLogros();
    guardarJuego();
    pintarJuego();
}

function alertaAtendida() {
    if (!juego.alertaPendiente) return;
    juego.alertaPendiente = false;
    juego.alertasAtendidas++;
    completarTarea("alerta");
}

function pintarJuego() {
    const caja = document.getElementById("panel-juego");
    if (!caja) return;
    prepararDia();
    const hechas = TAREAS.filter(t => juego.hechas[t.id]);
    const puntosHoy = hechas.reduce((suma, t) => suma + t.puntos, 0);
    const puntosPosibles = TAREAS.reduce((suma, t) => suma + t.puntos, 0);
    const avance = Math.round(puntosHoy / puntosPosibles * 100);
    const nivel = Math.floor(juego.puntos / PUNTOS_POR_NIVEL) + 1;
    const ganados = LOGROS.filter(l => juego.logros[l.id]).length;
    const insignia = document.getElementById("nav-nivel");
    if (insignia) {
        insignia.textContent = tr("Nv. {n}", { n: nivel });
        insignia.title = tr("{p} puntos · {n} de {total} tareas de hoy", { p: juego.puntos, n: hechas.length, total: TAREAS.length });
    }
    caja.innerHTML = `<div class="tarjeta-entorno juego h-100">
        <div class="juego-cabecera">
            <h3>${tr("Misión salud")}</h3>
            <span class="juego-nivel" title="${tr("Cada {n} puntos subes de nivel", { n: PUNTOS_POR_NIVEL })}">${tr("Nivel {n}", { n: nivel })}</span>
        </div>
        <div class="juego-resumen juego-resumen-2">
            <div><b>${juego.puntos}</b><span>${tr("Puntos totales")}</span></div>
            <div><b>🔥 ${juego.racha}</b><span>${tr("Días seguidos")}</span></div>
        </div>
        <p class="juego-progreso">${tr("Hoy: {p} de {max} puntos · {n} de {total} tareas", { p: puntosHoy, max: puntosPosibles, n: hechas.length, total: TAREAS.length })}</p>
        <div class="juego-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${avance}"><i style="width:${avance}%"></i></div>
        <ul class="juego-tareas">
            ${TAREAS.map(t => `<li class="${juego.hechas[t.id] ? "hecha" : ""}">
                ${t.auto
                    ? `<span class="marca" title="${tr("Se marca sola")}">${juego.hechas[t.id] ? "✔" : "○"}</span>`
                    : `<button type="button" class="btn btn-contorno btn-sm" data-tarea="${t.id}" ${juego.hechas[t.id] ? "disabled" : ""}>${juego.hechas[t.id] ? "✔" : tr("Hecho")}</button>`}
                <span>${t.texto}</span><em>+${t.puntos}</em></li>`).join("")}
        </ul>
        <p class="juego-subtitulo">${tr("Logros ({n} de {total})", { n: ganados, total: LOGROS.length })}</p>
        <div class="juego-logros">
            ${LOGROS.map(l => `<span class="${juego.logros[l.id] ? "ganado" : ""}" title="${l.texto}">🏅 ${l.texto}</span>`).join("")}
        </div>
        <p id="juego-aviso" hidden></p>
    </div>`;
    caja.querySelectorAll("button[data-tarea]").forEach(b => b.addEventListener("click", () => completarTarea(b.dataset.tarea)));
    if (ultimoLogro && Date.now() < ultimoLogro.hasta) {
        const aviso = document.getElementById("juego-aviso");
        aviso.textContent = tr("🏅 Logro desbloqueado: ") + ultimoLogro.texto;
        aviso.hidden = false;
        clearTimeout(pintarJuego.t);
        pintarJuego.t = setTimeout(() => { aviso.hidden = true; }, ultimoLogro.hasta - Date.now());
    }
}

pintarJuego();

// Día de misión visible en el panel de Hermes
function actualizarDiaNova() {
    const el = document.getElementById("nova-dia");
    if (el) el.textContent = diaActual();
}
(function () {
    const campo = document.getElementById("dia-mision");
    if (campo) ["input", "change"].forEach(ev => campo.addEventListener(ev, actualizarDiaNova));
    actualizarDiaNova();
})();

// Flechas para cambiar de wearable
(function () {
    const prev = document.getElementById("wear-prev");
    const next = document.getElementById("wear-next");
    if (prev) prev.addEventListener("click", () => cambiarWearable(-1));
    if (next) next.addEventListener("click", () => cambiarWearable(1));
    document.addEventListener("keydown", function (e) {
        const panel = document.getElementById("reloj-panel");
        if (!panel || panel.hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
        if (e.key === "ArrowLeft") cambiarWearable(-1);
        if (e.key === "ArrowRight") cambiarWearable(1);
    });
    pintarWearable();
})();

// ===== Ajustes: idioma, motor de voz, voz del navegador y velocidad =====
// Se guardan en el navegador (localStorage, ver i18n.js). Cambiar el idioma recarga la página.
(function () {
    const dialogo = document.getElementById("ajustes");
    if (!dialogo) return;
    const selIdioma = document.getElementById("ajuste-idioma");
    const notaIdioma = document.getElementById("ajuste-idioma-nota");
    const selMotor = document.getElementById("ajuste-motor");
    const campoVoz = document.getElementById("campo-voz-navegador");
    const rango = document.getElementById("ajuste-velocidad");
    const valorVel = document.getElementById("ajuste-velocidad-valor");
    const probar = document.getElementById("ajuste-probar");

    const textoVelocidad = v => Number(v).toFixed(2).replace(/0$/, "") + "x";

    function pintar() {
        selIdioma.value = AJUSTES.idioma;
        notaIdioma.textContent = tr("Idioma detectado en este dispositivo: {idioma}", {
            idioma: idiomaDispositivo() === "en" ? "English" : "Español",
        });
        selMotor.value = AJUSTES.motorVoz;
        rango.value = AJUSTES.velocidad;
        valorVel.textContent = textoVelocidad(AJUSTES.velocidad);
        prepararSelectorVoz();
        if (campoVoz) campoVoz.classList.toggle("ajuste-secundario", AJUSTES.motorVoz !== "navegador");
    }

    function abrir() {
        pintar();
        if (typeof dialogo.showModal === "function") dialogo.showModal();
        else dialogo.setAttribute("open", "");
    }
    document.querySelectorAll("[data-abrir-ajustes]").forEach(b => b.addEventListener("click", abrir));

    // Clic fuera del panel lo cierra
    dialogo.addEventListener("click", function (e) { if (e.target === dialogo) dialogo.close(); });

    selIdioma.addEventListener("change", function () {
        AJUSTES.idioma = selIdioma.value;
        guardarAjustes();
        const nuevo = AJUSTES.idioma === "auto" ? idiomaDispositivo() : AJUSTES.idioma;
        if (nuevo !== IDIOMA) location.reload();      // la página se vuelve a pintar en el nuevo idioma
        else pintar();
    });

    selMotor.addEventListener("change", function () {
        AJUSTES.motorVoz = selMotor.value;
        guardarAjustes();
        pintar();
    });

    rango.addEventListener("input", function () {
        AJUSTES.velocidad = Number(rango.value);
        valorVel.textContent = textoVelocidad(AJUSTES.velocidad);
        guardarAjustes();
    });

    probar.addEventListener("click", function () {
        asegurarAudio();
        hablar(tr("Hola, soy Hermes. Así sueno con estos ajustes."));
    });
})();

// ===== Navegación por pantallas =====
// Cada opción del menú (barra lateral o barra superior en el celular) muestra solo su pantalla.
// La dirección cambia a #vista-... para que «Atrás» del navegador y recargar la página funcionen.
(function () {
    const VISTAS = ["panel", "graficos", "mision"];
    // Direcciones de la versión anterior (una pantalla por sección)
    const ANTIGUAS = { hermes: "panel", wearables: "panel", lecturas: "graficos", indicadores: "graficos" };
    const migas = document.getElementById("migas-titulo");

    function vistaDeLaDireccion() {
        let v = (location.hash || "").replace("#vista-", "");
        v = ANTIGUAS[v] || v;
        return VISTAS.includes(v) ? v : "panel";
    }

    function mostrarVista(v, cambiarDireccion) {
        if (!VISTAS.includes(v)) v = "panel";
        document.querySelectorAll(".vista").forEach(function (s) { s.hidden = s.dataset.vista !== v; });
        document.querySelectorAll(".nav-link[data-ir], .nav-pill[data-ir]").forEach(function (a) {
            const activo = a.dataset.ir === v;
            a.classList.toggle("activo", activo);
            if (activo) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
        });
        const enlace = document.querySelector('.lateral [data-ir="' + v + '"]');
        if (migas && enlace) migas.textContent = enlace.dataset.titulo ? tr(enlace.dataset.titulo) : enlace.textContent.trim();
        if (cambiarDireccion && location.hash !== "#vista-" + v) history.pushState(null, "", "#vista-" + v);
        window.scrollTo(0, 0);
        // Los gráficos se dibujan con el ancho de su contenedor: al aparecer se vuelven a dibujar
        requestAnimationFrame(function () {
            for (const id in grafUltimo) dibujarGrafico.apply(null, [id].concat(grafUltimo[id]));
        });
        if (v !== "graficos") {
            const aviso = document.getElementById("aviso-procesada");
            if (aviso) aviso.hidden = true;
        }
    }

    // Cualquier elemento con data-ir="vista" lleva a esa pantalla (menú, botones de avisos...)
    // y data-bajar="id" baja hasta esa tarjeta dentro de la misma pantalla
    document.addEventListener("click", function (e) {
        const bajar = e.target.closest && e.target.closest("[data-bajar]");
        if (bajar) {
            const destino = document.getElementById(bajar.dataset.bajar);
            if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        const el = e.target.closest && e.target.closest("[data-ir]");
        if (!el) return;
        e.preventDefault();
        mostrarVista(el.dataset.ir, true);
    });
    window.addEventListener("popstate", function () { mostrarVista(vistaDeLaDireccion(), false); });

    // Al procesar una lectura a mano, se ofrece ir a ver el resultado
    const formSalud = document.getElementById("form-salud");
    if (formSalud) formSalud.addEventListener("submit", function () {
        setTimeout(function () {
            const aviso = document.getElementById("aviso-procesada");
            if (aviso && HISTORIAL.length) aviso.hidden = false;
        }, 300);
    });

    window.irAVista = function (v) { mostrarVista(v, true); };
    mostrarVista(vistaDeLaDireccion(), false);
})();

// ===== Minijuegos de Misión salud =====
// Tres actividades cortas que suman puntos extra una vez por día de misión:
//  1. Reflejos: prueba de tiempo de reacción, parecida a la que usan los astronautas en la Estación
//     para detectar fatiga antes de tareas críticas.
//  2. Trivia: preguntas sobre salud en el espacio (enseña a interpretar los indicadores).
//  3. Respiración en caja: 1 minuto guiado para bajar el estrés del aislamiento.
(function () {
    const caja = document.getElementById("panel-minijuegos");
    if (!caja) return;
    const L = (es, en) => (IDIOMA === "en" ? en : es);

    juego.bonus = juego.bonus || {};
    juego.records = juego.records || {};

    // Puntos extra: una vez por actividad y por día de misión
    function sumarBonus(id, puntos) {
        const dia = diaActual();
        if (juego.bonus[id] === dia) return 0;
        juego.bonus[id] = dia;
        juego.puntos += puntos;
        revisarLogros();
        guardarJuego();
        pintarJuego();
        return puntos;
    }
    function textoPuntos(ganados) {
        return ganados ? L(`+${ganados} puntos extra`, `+${ganados} bonus points`)
                       : L("Hoy ya sumaste los puntos de esta actividad.", "You already earned today's points for this activity.");
    }
    function hechoHoy(id) { return juego.bonus[id] === diaActual(); }

    caja.innerHTML = `
    <div class="tarjeta-entorno juego mt-3">
        <div class="juego-cabecera"><h3>${L("Minijuegos de entrenamiento", "Training mini-games")}</h3>
            <span class="juego-subtitulo m-0">${L("Puntos extra 1 vez por día", "Bonus points once a day")}</span></div>
        <div class="mini-pestanas" role="tablist">
            <button type="button" class="mini-tab activo" data-mini="reflejos" role="tab">⚡ ${L("Reflejos", "Reflexes")}</button>
            <button type="button" class="mini-tab" data-mini="trivia" role="tab">🧠 ${L("Trivia", "Trivia")}</button>
            <button type="button" class="mini-tab" data-mini="respira" role="tab">🌬️ ${L("Respiración", "Breathing")}</button>
        </div>
        <div class="mini-cuerpo" data-cuerpo="reflejos"></div>
        <div class="mini-cuerpo" data-cuerpo="trivia" hidden></div>
        <div class="mini-cuerpo" data-cuerpo="respira" hidden></div>
    </div>`;

    caja.querySelectorAll(".mini-tab").forEach(function (b) {
        b.addEventListener("click", function () {
            caja.querySelectorAll(".mini-tab").forEach(x => x.classList.toggle("activo", x === b));
            caja.querySelectorAll(".mini-cuerpo").forEach(c => { c.hidden = c.dataset.cuerpo !== b.dataset.mini; });
        });
    });

    // ---------- 1. Reflejos ----------
    const cReflejos = caja.querySelector('[data-cuerpo="reflejos"]');
    const INTENTOS = 5;
    let tiempos = [], estadoR = "inicio", t0 = 0, espera = null;
    cReflejos.innerHTML = `
        <p class="mini-ayuda">${L("Pulsa el círculo (o la barra espaciadora) en cuanto se ponga verde. Son 5 intentos. Si reaccionas más lento de lo normal, puede ser fatiga: descansa antes de una tarea crítica.",
            "Tap the circle (or press the space bar) as soon as it turns green. 5 tries. If you react slower than usual it may be fatigue: rest before a critical task.")}</p>
        <button type="button" class="reflejo-blanco" aria-live="polite">${L("Empezar", "Start")}</button>
        <p class="mini-resultado" aria-live="polite"></p>`;
    const blanco = cReflejos.querySelector(".reflejo-blanco");
    const resR = cReflejos.querySelector(".mini-resultado");
    if (juego.records.reaccion) resR.textContent = L(`Tu mejor promedio: ${juego.records.reaccion} ms`, `Your best average: ${juego.records.reaccion} ms`);

    function ponerBlanco(clase, texto) { blanco.className = "reflejo-blanco " + clase; blanco.textContent = texto; }
    function siguiente() {
        estadoR = "esperando";
        ponerBlanco("espera", L("Espera…", "Wait…"));
        espera = setTimeout(function () { estadoR = "ya"; t0 = performance.now(); ponerBlanco("ya", L("¡Ahora!", "Now!")); }, 1200 + Math.random() * 2800);
    }
    function pulsar() {
        if (estadoR === "inicio" || estadoR === "fin") { tiempos = []; resR.textContent = ""; siguiente(); return; }
        if (estadoR === "esperando") {
            clearTimeout(espera);
            estadoR = "pronto";
            ponerBlanco("pronto", L("¡Muy pronto! Toca para repetir", "Too soon! Tap to retry"));
            return;
        }
        if (estadoR === "pronto") { siguiente(); return; }
        if (estadoR === "ya") {
            const ms = Math.round(performance.now() - t0);
            tiempos.push(ms);
            if (tiempos.length < INTENTOS) {
                resR.textContent = L(`Intento ${tiempos.length} de ${INTENTOS}: ${ms} ms`, `Try ${tiempos.length} of ${INTENTOS}: ${ms} ms`);
                siguiente();
                return;
            }
            estadoR = "fin";
            const media = Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
            const mejor = Math.min.apply(null, tiempos);
            if (!juego.records.reaccion || media < juego.records.reaccion) juego.records.reaccion = media;
            const lectura = media < 300 ? L("Muy alerta 🟢", "Very alert 🟢")
                : media < 400 ? L("Normal 🟢", "Normal 🟢")
                : media < 500 ? L("Algo lento 🟡: podría ser cansancio", "A bit slow 🟡: could be tiredness")
                : L("Lento 🔴: descansa antes de tareas críticas y avisa si se repite", "Slow 🔴: rest before critical tasks and report it if it repeats");
            const ganados = sumarBonus("reflejos", 15);
            ponerBlanco("fin", L("Otra vez", "Again"));
            resR.innerHTML = `<b>${L("Promedio", "Average")}: ${media} ms</b> · ${L("mejor", "best")} ${mejor} ms — ${lectura}<br><small>${textoPuntos(ganados)} · ${L("Récord", "Record")}: ${juego.records.reaccion} ms</small>`;
            guardarJuego();
        }
    }
    blanco.addEventListener("click", pulsar);
    document.addEventListener("keydown", function (e) {
        if (e.code !== "Space" || cReflejos.hidden || cReflejos.closest(".vista").hidden) return;
        if (/input|textarea|select|button/i.test(document.activeElement && document.activeElement.tagName) && document.activeElement !== blanco) return;
        e.preventDefault();
        pulsar();
    });

    // ---------- 2. Trivia ----------
    const PREGUNTAS = [
        { p: ["¿Por qué los astronautas pierden masa ósea en el espacio?", "Why do astronauts lose bone mass in space?"],
          o: [["Sin el peso de la gravedad, el cuerpo reabsorbe hueso", "Without gravity's load, the body reabsorbs bone"], ["Por la comida deshidratada", "Because of dehydrated food"], ["Por respirar aire reciclado", "Because of recycled air"]], c: 0,
          e: ["Sin carga, el hueso se pierde: alrededor de un 1 % al mes en cadera y columna si no se hace ejercicio.", "Without load, bone is lost: about 1% per month in hips and spine without exercise."] },
        { p: ["¿Qué ejercicio protege más huesos y músculos a bordo?", "Which exercise best protects bones and muscles on board?"],
          o: [["Estiramientos", "Stretching"], ["Ejercicio de resistencia (pesas)", "Resistance exercise (weights)"], ["Ninguno, basta con dormir", "None, sleep is enough"]], c: 1,
          e: ["La resistencia carga el hueso y el músculo; por eso en la Estación entrenan unas 2 horas al día.", "Resistance loads bone and muscle; that's why ISS crews train about 2 hours a day."] },
        { p: ["¿Cuál es el límite de radiación de toda la carrera de un astronauta de la NASA?", "What is NASA's career radiation limit for an astronaut?"],
          o: [["60 mSv", "60 mSv"], ["600 mSv", "600 mSv"], ["6 000 mSv", "6,000 mSv"]], c: 1,
          e: ["La NASA fija 600 mSv para toda la carrera; el panel de radiación te muestra cuánto llevas.", "NASA sets 600 mSv for a whole career; the radiation panel shows how much you have."] },
        { p: ["¿Por qué se hincha la cara en microgravedad?", "Why does the face get puffy in microgravity?"],
          o: [["Por alergia a la nave", "Allergy to the ship"], ["Los líquidos del cuerpo suben hacia la cabeza", "Body fluids shift toward the head"], ["Por falta de sueño", "Lack of sleep"]], c: 1,
          e: ["Sin gravedad, los líquidos ya no bajan a las piernas; también causa congestión y dolor de cabeza.", "Without gravity fluids no longer pool in the legs; it also causes congestion and headaches."] },
        { p: ["¿Qué frecuencia cardíaca en reposo se considera normal en un adulto?", "What resting heart rate is normal for an adult?"],
          o: [["40 a 50 latidos por minuto", "40 to 50 beats per minute"], ["60 a 100 latidos por minuto", "60 to 100 beats per minute"], ["110 a 140 latidos por minuto", "110 to 140 beats per minute"]], c: 1,
          e: ["Entre 60 y 100 lpm es lo normal en reposo; si pasa de 100 sin esfuerzo, el semáforo se pone en amarillo.", "60–100 bpm is normal at rest; above 100 without effort turns the light yellow."] },
        { p: ["¿Cuántas horas de sueño se recomiendan a un adulto?", "How many hours of sleep are recommended for an adult?"],
          o: [["5 horas", "5 hours"], ["7 horas o más", "7 hours or more"], ["Da igual si tomas café", "It doesn't matter if you drink coffee"]], c: 1,
          e: ["Dormir menos de 7 horas reduce la atención y aumenta los errores en tareas críticas.", "Under 7 hours reduces attention and increases errors in critical tasks."] },
        { p: ["¿Qué glucosa en ayunas es normal?", "What fasting glucose is normal?"],
          o: [["Menos de 50 mg/dl", "Below 50 mg/dl"], ["De 70 a 99 mg/dl", "70 to 99 mg/dl"], ["Más de 200 mg/dl", "Above 200 mg/dl"]], c: 1,
          e: ["Por debajo de 70 es hipoglucemia: come algo con azúcar y vuelve a medir en 15 minutos.", "Below 70 is hypoglycemia: eat something sugary and measure again in 15 minutes."] },
        { p: ["Un indicador se pone en ROJO. ¿Qué haces?", "An indicator turns RED. What do you do?"],
          o: [["Esperar a la próxima lectura", "Wait for the next reading"], ["Avisar a un compañero y a Tierra", "Tell a crewmate and Earth"], ["Quitarte el wearable", "Take off the wearable"]], c: 1,
          e: ["El rojo se avisa de inmediato; un amarillo se avisa a Tierra solo si se repite 3 veces seguidas.", "Red is reported immediately; yellow is reported to Earth only if it repeats 3 times in a row."] },
        { p: ["¿Cuánto tarda un mensaje en llegar de Marte a la Tierra?", "How long does a message take from Mars to Earth?"],
          o: [["Menos de 1 segundo", "Under 1 second"], ["Entre 3 y 22 minutos, según la posición", "3 to 22 minutes, depending on position"], ["Un día entero", "A whole day"]], c: 1,
          e: ["Por eso en Marte debes saber actuar solo mientras llega la respuesta de los médicos.", "That's why on Mars you must act on your own while the doctors' answer arrives."] },
        { p: ["Durante una tormenta solar, ¿dónde te proteges?", "During a solar storm, where do you shelter?"],
          o: [["Junto a una ventana", "Next to a window"], ["En el refugio más blindado de la nave", "In the most shielded part of the ship"], ["Afuera, en una caminata espacial", "Outside, on a spacewalk"]], c: 1,
          e: ["Las zonas rodeadas de agua, comida y equipo frenan las partículas solares.", "Areas surrounded by water, food and equipment block solar particles."] },
    ];
    const cTrivia = caja.querySelector('[data-cuerpo="trivia"]');
    let ronda = [], nPregunta = 0, aciertos = 0;
    function empezarTrivia() {
        ronda = PREGUNTAS.slice().sort(() => Math.random() - 0.5).slice(0, 5);
        nPregunta = 0; aciertos = 0;
        mostrarPregunta();
    }
    function mostrarPregunta() {
        const q = ronda[nPregunta];
        const i = IDIOMA === "en" ? 1 : 0;
        cTrivia.innerHTML = `<p class="mini-ayuda">${L("Pregunta", "Question")} ${nPregunta + 1} / ${ronda.length} · ${L("aciertos", "correct")}: ${aciertos}</p>
            <p class="trivia-pregunta">${q.p[i]}</p>
            <div class="trivia-opciones">${q.o.map((o, k) => `<button type="button" class="btn btn-contorno" data-op="${k}">${o[i]}</button>`).join("")}</div>
            <p class="mini-resultado" aria-live="polite"></p>`;
        cTrivia.querySelectorAll("[data-op]").forEach(function (b) {
            b.addEventListener("click", function () {
                const bien = Number(b.dataset.op) === q.c;
                if (bien) aciertos++;
                cTrivia.querySelectorAll("[data-op]").forEach(x => {
                    x.disabled = true;
                    if (Number(x.dataset.op) === q.c) x.classList.add("op-bien");
                    else if (x === b) x.classList.add("op-mal");
                });
                const res = cTrivia.querySelector(".mini-resultado");
                res.innerHTML = `<b>${bien ? L("¡Correcto!", "Correct!") : L("No exactamente.", "Not quite.")}</b> ${q.e[i]}`;
                const seguir = document.createElement("button");
                seguir.type = "button";
                seguir.className = "btn btn-verde btn-sm mt-2";
                seguir.textContent = nPregunta < ronda.length - 1 ? L("Siguiente →", "Next →") : L("Ver resultado", "See result");
                seguir.addEventListener("click", function () { nPregunta++; nPregunta < ronda.length ? mostrarPregunta() : terminarTrivia(); });
                res.appendChild(document.createElement("br"));
                res.appendChild(seguir);
            });
        });
    }
    function terminarTrivia() {
        if (!juego.records.trivia || aciertos > juego.records.trivia) juego.records.trivia = aciertos;
        const ganados = aciertos >= 3 ? sumarBonus("trivia", 15) : 0;
        guardarJuego();
        const nota = aciertos === 5 ? L("¡Experto en salud espacial! 🏅", "Space health expert! 🏅")
            : aciertos >= 3 ? L("¡Bien hecho!", "Well done!") : L("Sigue practicando: necesitas 3 aciertos para sumar puntos.", "Keep practicing: you need 3 correct to earn points.");
        cTrivia.innerHTML = `<p class="trivia-pregunta">${aciertos} / ${ronda.length} — ${nota}</p>
            <p class="mini-resultado">${aciertos >= 3 ? textoPuntos(ganados) : ""}</p>
            <button type="button" class="btn btn-verde">${L("Jugar otra ronda", "Play another round")}</button>`;
        cTrivia.querySelector("button").addEventListener("click", empezarTrivia);
    }
    cTrivia.innerHTML = `<p class="mini-ayuda">${L("5 preguntas sobre tu salud en el espacio. Con 3 aciertos o más sumas puntos.", "5 questions about your health in space. 3 or more correct earns points.")}</p>
        <button type="button" class="btn btn-verde">${L("Empezar trivia", "Start trivia")}</button>`;
    cTrivia.querySelector("button").addEventListener("click", empezarTrivia);

    // ---------- 3. Respiración en caja (4-4-4-4) ----------
    const cRespira = caja.querySelector('[data-cuerpo="respira"]');
    const FASES = [L("Inhala", "Breathe in"), L("Mantén", "Hold"), L("Exhala", "Breathe out"), L("Mantén", "Hold")];
    const CICLOS = 4;      // 4 ciclos x 16 s ≈ 1 minuto
    let reloj = null;
    cRespira.innerHTML = `<p class="mini-ayuda">${L("Respiración en caja: 4 segundos para inhalar, sostener, exhalar y sostener. Un minuto ayuda a bajar el estrés y el pulso, útil en el aislamiento.",
            "Box breathing: 4 seconds to breathe in, hold, breathe out and hold. One minute helps lower stress and heart rate, useful during isolation.")}</p>
        <div class="respira-circulo"><span>${L("Listo", "Ready")}</span></div>
        <button type="button" class="btn btn-verde">${L("Empezar 1 minuto", "Start 1 minute")}</button>
        <p class="mini-resultado" aria-live="polite"></p>`;
    const circulo = cRespira.querySelector(".respira-circulo");
    const etiqueta = circulo.querySelector("span");
    const botonR = cRespira.querySelector("button");
    const resResp = cRespira.querySelector(".mini-resultado");
    botonR.addEventListener("click", function () {
        if (reloj) {             // detener
            clearInterval(reloj); reloj = null;
            circulo.className = "respira-circulo"; etiqueta.textContent = L("Listo", "Ready");
            botonR.textContent = L("Empezar 1 minuto", "Start 1 minute");
            return;
        }
        let segundo = 0;
        const total = CICLOS * 16;
        botonR.textContent = L("Detener", "Stop");
        resResp.textContent = "";
        function paso() {
            if (segundo >= total) {
                clearInterval(reloj); reloj = null;
                circulo.className = "respira-circulo";
                etiqueta.textContent = "✔";
                botonR.textContent = L("Repetir", "Repeat");
                resResp.textContent = L("¡Bien! ", "Nice! ") + textoPuntos(sumarBonus("respira", 10));
                return;
            }
            const fase = Math.floor(segundo / 4) % 4;
            circulo.className = "respira-circulo fase-" + fase;
            etiqueta.textContent = FASES[fase] + " · " + (4 - (segundo % 4));
            segundo++;
        }
        paso();
        reloj = setInterval(paso, 1000);
    });
})();
