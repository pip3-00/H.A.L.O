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
const AGUDOS = ["temperatura", "frecuencia", "sistolica", "diastolica", "glucosa"];
const TENDENCIA = { sueno: 0, animo: 0};
const HISTORIAL = []
const UMBRAL_TENDENCIA = 3;
const INTERVALO_MS = 4000;

const NOMBRES = {
    temperatura: { nombre: "temperatura", unidad: "°C" },
    frecuencia: { nombre: "Frecuencia cardiaca", unidad: "lpm" },
    sistolica: { nombre: "Presion sistolica", unidad: "mmHg" },
    diastolica: { nombre: "Presion diastolica", unidad: "mmHg" },
    glucosa: { nombre: "Glucosa", unidad: "mg/dl" },
    sueno: { nombre: "Sueño", unidad: "h" },
    animo: { nombre: "Estado de Animo", unidad: "/5" },

}

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
        temperatura: [36.8, 0.4],   // verde: 36.4–37.2
        frecuencia:  [72, 8],       // verde: 64–80
        sistolica:   [115, 8],      // verde: 107–123
        diastolica:  [75, 6],       // verde: 69–81
        glucosa:     [95, 15],      // verde: 80–110
        sueno:       [7, 1],        // verde: 6–8
        animo:       [4, 0.5],      // verde: 3.5–4.5
    },
    fiebre: {
        temperatura: [39.5, 0.3],   // ROJO alto (≥39)
        frecuencia:  [110, 8],      // AMARILLO-ROJO alto (taquicardia por fiebre)
        sistolica:   [105, 8],      // verde-bajo (vasodilatación por fiebre)
        diastolica:  [65, 6],       // verde-bajo
        glucosa:     [105, 15],     // verde (estrés metabólico leve)
        sueno:       [5.5, 1],      // AMARILLO bajo (la fiebre interrumpe el sueño)
        animo:       [2, 0.5],      // AMARILLO bajo
    },
    hipotension: {
        temperatura: [36.5, 0.3],   // verde
        frecuencia:  [105, 10],     // AMARILLO alto (taquicardia compensatoria)
        sistolica:   [75, 5],       // ROJO bajo (<80)
        diastolica:  [45, 5],       // ROJO bajo (<50)
        glucosa:     [90, 15],      // verde
        sueno:       [7, 1],        // verde
        animo:       [3, 0.5],      // verde-bajo
    },
    hipoglucemia: {
        temperatura: [36.6, 0.3],   // verde
        frecuencia:  [95, 10],      // AMARILLO alto (respuesta adrenérgica)
        sistolica:   [110, 8],      // verde
        diastolica:  [72, 6],       // verde
        glucosa:     [48, 4],       // ROJO bajo (<54)
        sueno:       [6, 1],        // AMARILLO bajo
        animo:       [2, 0.5],      // AMARILLO bajo (síntomas neuroglucopénicos)
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

// ===== 2. LEER =====

function simularAstroskin(){
    const nombre = document.getElementById("escenario").value;
    const esc = ESCENARIOS[nombre];

    document.getElementById("temperatura").value = variar(esc.temperatura[0], esc.temperatura[1]).toFixed(1);
    document.getElementById("frecuencia").value  = Math.round(variar(esc.frecuencia[0], esc.frecuencia[1]));
    document.getElementById("sistolica").value   = Math.round(variar(esc.sistolica[0], esc.sistolica[1]));
    document.getElementById("diastolica").value  = Math.round(variar(esc.diastolica[0], esc.diastolica[1]));
    document.getElementById("glucosa").value     = Math.round(variar(esc.glucosa[0], esc.glucosa[1]));
    document.getElementById("sueno").value       = Math.round(variar(esc.sueno[0], esc.sueno[1]) * 2) / 2;
    document.getElementById("animo").value       = Math.round(variar(esc.animo[0], esc.animo[1]));
}

function calcularEntorno(){
    const claveHabitat = document.getElementById("habitat").value;
    const dia = Number (document.getElementById("dia-mision").value) || 1;

    let radiacionMSv = 0 ;

    if(claveHabitat === "iss"){
        radiacionMSv = 0.35 * dia;
    } else if (claveHabitat === "luna"){
        radiacionMSv = 0.35 * dia;
    } else if (claveHabitat === "transito"){
        radiacionMSv = 1.8 *dia;
    } else if (claveHabitat === "marte"){
        radiacionMSv = (1.8 * 180) + (0.64 * dia);
    }

    const porcentajeLimite = (radiacionMSv / 600) * 100;

    let perdidaOsea = null;
    if(claveHabitat === "iss" || claveHabitat === "transito"){
        const meses = dia / 30;
        perdidaOsea = [meses * 1, meses * 1.5];
    }

    const gravedad = {iss: 0, transito: 0, luna: 0.16, marte: 0.38};

    return{
        radiacionMSv:radiacionMSv,
        porcentajeLimite:porcentajeLimite,
        perdidaOsea:perdidaOsea,
        gravedad:gravedad[claveHabitat],
        nombreHabitat: HABITATS[claveHabitat].nombre,
        diaMision:dia,
    };
}

function registrarLectura(mediciones, resultados, entorno) {
    HISTORIAL.push({
        numero: HISTORIAL.length + 1,
        tiempo: new Date().toLocaleTimeString(),
        mediciones: Object.assign({}, mediciones),
        resultados: Object.assign({}, resultados),
        entorno: Object.assign({}, entorno),
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

function graficarHistorial() {
    const canvas = document.getElementById("grafica");
    const ctx = canvas.getContext("2d");
    const ancho = canvas.width;
    const alto = canvas.height;
    const margen = 50;

    ctx.clearRect(0, 0, ancho, alto);

    const series = [
        { clave: "temperatura", color: "#e74c3c", min: 34, max: 41 },
        { clave: "frecuencia",  color: "#3498db", min: 30, max: 140 },
        { clave: "glucosa",     color: "#f39c12", min: 40, max: 260 },
    ];

    const n = HISTORIAL.length;
    const pasoX = (ancho - margen * 2) / Math.max(n - 1, 1);

    // fondo
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, ancho, alto);

    // ejes
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(margen, margen);
    ctx.lineTo(margen, alto - margen);
    ctx.lineTo(ancho - margen, alto - margen);
    ctx.stroke();

    // números de lectura en eje X
    ctx.fillStyle = "#aaa";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < n; i++) {
        const x = margen + i * pasoX;
        ctx.fillText(HISTORIAL[i].numero, x, alto - margen + 15);
    }

    // dibujar cada serie
    for (let s = 0; s < series.length; s++) {
        const serie = series[s];
        ctx.strokeStyle = serie.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < n; i++) {
            const valor = HISTORIAL[i].mediciones[serie.clave];
            if (valor === null) continue;

            const x = margen + i * pasoX;
            const y = alto - margen - ((valor - serie.min) / (serie.max - serie.min)) * (alto - margen * 2);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // puntos
        for (let i = 0; i < n; i++) {
            const valor = HISTORIAL[i].mediciones[serie.clave];
            if (valor === null) continue;

            const x = margen + i * pasoX;
            const y = alto - margen - ((valor - serie.min) / (serie.max - serie.min)) * (alto - margen * 2);

            ctx.fillStyle = serie.color;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // leyenda
    ctx.font = "12px monospace";
    for (let s = 0; s < series.length; s++) {
        const lx = margen + s * 150;
        ctx.fillStyle = series[s].color;
        ctx.fillRect(lx, 8, 12, 12);
        ctx.fillText(series[s].clave, lx + 16, 18);
    }
}

function mostrarEntorno(entorno){
    const panel = document.getElementById("panel-entorno");

    let oseaTexto = "N/A (gravedad parcial)";
    if(entorno.perdidaOsea !== null){
        oseaTexto = entorno.perdidaOsea[0].toFixed(1) + "-" + entorno.perdidaOsea[1].toFixed(1) + "%";
    }
    panel.innerHTML = `
    <div class="tarjeta-entorno">
    <h3>Entorno - ${entorno.nombreHabitat} (dia ${entorno.diaMision})</h3>
    <p>Gravedad: ${entorno.gravedad}g </p>
    <p>Radiacion acumulada: ${entorno.radiacionMSv.toFixed(1)} mSv (${entorno.porcentajeLimite.toFixed(1)}% del limite de carrera)</p>
    <p>Perdida osea estimada:${oseaTexto}</p>
    </div>`;
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


let estadoAnterior = null;
let cuentaAtras = null;

function iniciarAvisoTierra(){
    const habitat = HABITATS[document.getElementById("habitat").value];
    const caja = document.getElementById("aviso-tierra");
    let restante = Math.round(habitat.retrasoSeg * 2);

    function pintar(){
        caja.innerHTML =`<div class="aviso">
        <strong>AVISO ENVIADO A TIERRA</strong> (${habitat.nombre})
        <p>Respuesta estimada en <strong>${formatearTiempo(restante)}</strong>
        <p>${habitat.protocolo}</p>
        </div>`;
    }

    clearInterval(cuentaAtras);
    pintar();
    cuentaAtras = setInterval(function(){
        restante--;
        if(restante <= 0){
            clearInterval(cuentaAtras);
            caja.innerHTML = `<div class="aviso">Respuesta de Tierra recibida (simulada).</div>`;
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
    }
}

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
    avisarTierra(resultados);

    if (HISTORIAL.length >= 2) {
        graficarHistorial();
    }
}


// ===== 4. CONEXIONES =====

const formulario = document.getElementById("form-salud");
formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    procesar();
});

const botonAstroskin = document.getElementById("btn-astroskin");
botonAstroskin.addEventListener("click", function () {
    simularAstroskin();
    procesar();
});

let temporizador = null;
const botonVivo = document.getElementById("btn-vivo");

function cicloEnVivo() {
    simularAstroskin();
    procesar();
}

botonVivo.addEventListener("click", function () {
    if (temporizador === null) {
        cicloEnVivo();
        temporizador = setInterval(cicloEnVivo, INTERVALO_MS);
        botonVivo.textContent = "Detener modo en vivo";
    } else {
        clearInterval(temporizador);
        temporizador = null;
        botonVivo.textContent = "Iniciar modo en vivo";
    }
});

document.getElementById("btn-asistente").addEventListener("click", function () {
    // llama a consultarAsistente() con los datos actuales
});