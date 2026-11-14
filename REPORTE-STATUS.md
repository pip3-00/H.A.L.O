# Traspaso de contexto — NASA Space Apps 2026 — Equipo run3rs

> Documento de contexto completo para otra IA que continúe este proyecto.
> Generado: sábado 14 de noviembre de 2026, 15:45 (hora de Santo Domingo, UTC-4).
> Hackathon en curso. Límite de entrega: **domingo 15 de noviembre, 23:59 hora local del evento.**

---

## 0. Resumen en 30 segundos

Se está construyendo una **aplicación web de monitoreo de salud para astronautas** en misiones de larga duración. La app recibe lecturas de un wearable simulado (Astroskin), las evalúa contra umbrales clínicos, muestra con un semáforo qué está pasando y qué hacer, y envía un aviso simulado a la Tierra con una cuenta atrás según el retraso de comunicación del hábitat.

- **Stack:** HTML + CSS + JavaScript puro (sin framework, sin build, sin dependencias).
- **Repositorio local:** `C:\R3NERS\REN3RS` (Windows). Ya tiene remoto en GitHub y 2 commits.
- **Trabajo:** una desarrolladora principal (escribe la lógica) más un compañero incorporado hoy.
- **Estado:** el MVP funciona parcialmente. Faltan validaciones, datos NASA en la lógica, despliegue y materiales de entrega.

---

## 1. El reto oficial

Texto del desafío NASA Space Apps:

> Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events, and behavioral health problems. On long missions, astronauts carry much of the responsibility for spotting these changes in themselves. Your challenge is to build a health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health.

### Requisitos derivados del reto y dónde se cubren

| Requisito | Estado |
|---|---|
| Indicar qué está pasando | HECHO (mensajes por indicador) |
| Indicar qué hacer / orientar en emergencias | HECHO (mensajes + protocolo + aviso a Tierra) |
| Los astronautas no son médicos: lenguaje simple | HECHO en los textos; falta el término técnico tras clic |
| Cómo tomar cada medida | **FALTA** (contenido escrito, no implementado) |
| Por qué es importante cada indicador | **FALTA** (contenido escrito, no implementado) |
| Qué hacer si un valor no parece normal | **FALTA** (validación de rango imposible) |
| Recordar tomar medidas | **FALTA** (opcional, primero en la lista de corte) |
| Diferencia nave / estación / base | HECHO (selector de hábitat con protocolo propio) |

### Contexto de la decisión de diseño

El equipo cambió de reto el 1 de noviembre (antes era un simulador de misión para astronautas juniors). **Nada construido antes del inicio del hackathon puede usarse.** Todo el código del repo actual se escribió hoy, después de las 9:00.

---

## 2. Estado actual del código

### Estructura del repositorio

```
C:\R3NERS\
├── .git\                    (repo padre, aparentemente de otro proyecto)
└── REN3RS\                  <-- ESTE es el proyecto
    ├── .git\
    ├── .gitignore
    ├── index.html           (2.8 KB)
    ├── style.css            (887 B)
    ├── app.js               (11.5 KB)
    ├── USO-DE-IA.MD         (1.3 KB)
    └── graphify-out\        (salida de una herramienta de análisis, no es del proyecto)
```

Historial git: 2 commits, el inicial a las 13:30 y uno a las 13:39. Ya empujados al remoto.

**Nota:** hay un `.git` anidado. `C:\R3NERS` es un repo y `C:\R3NERS\REN3RS` es otro repo dentro. Funciona, pero es confuso. No tocarlo durante el hackathon salvo que cause problemas.

### Lo que YA funciona

1. **Configuración de umbrales** (objeto `INDICADORES`): 7 indicadores con rangos rojo y amarillo.
2. **Evaluación** (`evaluarIndicador`): devuelve `{estado, direccion}` donde estado es `verde`/`amarillo`/`rojo`/`sin-dato` y dirección es `alto`/`bajo`/`null`.
3. **Estado general** (`peorEstado`): toma el peor de todos los indicadores por prioridad.
4. **Mensajes** (objeto `MENSAJES`): textos "qué está pasando" y "qué hacer" por indicador y combinación estado+dirección.
5. **Render** (`mostrarResultados`): tarjetas con color, valor, flecha de dirección y mensajes.
6. **Hábitats** (objeto `HABITATS`): ISS, tránsito a Marte, base lunar, base en Marte; cada uno con retraso de comunicación y línea de protocolo.
7. **Aviso a Tierra** (`iniciarAvisoTierra`): se dispara al pasar a rojo, muestra cuenta atrás en formato mm:ss y al terminar muestra "respuesta recibida".
8. **Astroskin simulado** (`simularAstroskin`): rellena temperatura, frecuencia, presión y sueño con variación aleatoria alrededor de valores sanos.
9. **Modo en vivo**: repite la lectura y el procesado cada 4 segundos.

### Bugs y carencias conocidas (en orden de gravedad)

| # | Problema | Dónde | Gravedad |
|---|---|---|---|
| 1 | El Astroskin simulado solo genera valores sanos (temperatura 36.4–37.2). **No se puede demostrar una alerta con el botón.** Hace falta un selector o botón de escenario (fiebre, hipotensión, hipoglucemia). | `app.js` `simularAstroskin()` | **Crítica para la demo** |
| 2 | El Astroskin no rellena glucosa ni ánimo: quedan en `sin-dato`, pero `sin-dato` tiene prioridad 0, así que el estado general sale "Normal" con dos indicadores sin medir. Contradice la regla de diseño de que "sin dato" nunca debe leerse como sano. | `app.js` const `PRIORIDAD` | **Alta** |
| 3 | No hay validación de valores imposibles. Una temperatura de 80 °C se evalúa como rojo y dispara una falsa alarma a Tierra. | falta en `evaluarIndicador` o antes | **Alta** |
| 4 | Falta el panel "por qué importa / cómo medir". Es un requisito explícito del reto. El contenido ya está escrito (sección 4 de este documento), solo falta implementarlo. | — | **Alta** |
| 5 | Los datos de la NASA (radiación acumulada, pérdida ósea) no entran en la lógica. Solo se usan los retrasos de comunicación. Afecta al criterio "Relevance" de la evaluación. | — | **Media-alta** |
| 6 | Carácter `1` suelto tras un punto y coma. No rompe nada pero es ruido. | `app.js` línea 211 | Baja |
| 7 | `margin:0.4 0` sin unidad: el navegador ignora la declaración. | `style.css` línea 7 | Baja |
| 8 | `<html lang="en">` con todo el contenido en español. | `index.html` línea 2 | Baja |
| 9 | La presión no valida que la sistólica sea mayor que la diastólica. | — | Baja |

### Código fuente completo

#### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <title>monitoreo</title>
</head>
<body>
    <header>
        <h1>Monitor de Salud</h1>
    </header>

    <main>
        <section id="seccion-formulario">
            <h2>Registro de Mediciones</h2>
            <div class="campo">
                <label for="habitat">Ubicacion de la mision</label>
                <select id="habitat">
                    <option value="iss">Estacion Espacial</option>
                    <option value="transito">Nave en Transito a Marte</option>
                    <option value="luna">Base Lunar</option>
                    <option value="marte" selected>Base en Marte</option>
                </select>
            </div>
            <button type="button" id="btn-astroskin">Leer Astroskin (simulado)</button>
            <button type="button" id="btn-vivo">Iniciar modo en vivo</button>
            <form id="form-salud">
                <div class="campo">
                    <label for="temperatura">Temperatura (°C)</label>
                    <input type="number" id="temperatura" step="0.1">
                </div>
                <div class="campo">
                    <label for="frecuencia"> Frecuencia cardíaca (lpm)</label>
                    <input  type="number" id="frecuencia" step="1">
                </div>
                <div class="campo">
                    <label for="sistolica">Presión sistólica (mmHg)</label>
                    <input  type="number" id="sistolica" step="1">
                </div>
                <div class="campo">
                    <label for="diastolica">Presión diastólica (mmHg)</label>
                    <input  type="number" id="diastolica" step="1">
                </div>
                <div class="campo">
                    <label for="glucosa">Glucosa (mg/dl)</label>
                    <input  type="number" id="glucosa" step="1">
                </div>
                <div class="campo">
                    <label for="sueno">Horas de sueño(ultimas 24 horas)</label>
                    <input  type="number" id="sueno" step="0.5">
                </div>
                <div class="campo">
                    <label for="animo">Estado de Animo (1 a 5)</label>
                    <input  type="number" id="animo" step="1">
                </div>
            </form>
        </section>

        <section id="seccion-resultados">
            <h2>Estado de Salud</h2>
            <div id="aviso-tierra"></div>
            <div id="resultado"></div>
        </section>
    </main>
    <script src="app.js"></script>
</body>
</html>
```

#### `app.js`

```javascript
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

function simularAstroskin() {
    document.getElementById("temperatura").value = variar(36.8, 0.4).toFixed(1);
    document.getElementById("frecuencia").value = Math.round(variar(72, 8));
    document.getElementById("sistolica").value = Math.round(variar(115, 8));
    document.getElementById("diastolica").value = Math.round(variar(75, 6));
    document.getElementById("sueno").value = Math.round(variar(7, 1) * 2) / 2;
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
    let restante = Math.round (habitat.retrasoSeg * 2);1

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

function avisarTierra(general){
    if(general ==="rojo" && estadoAnterior !== "rojo"){
        iniciarAvisoTierra();
    }
    estadoAnterior = general;
}

function procesar() {
    const mediciones = leerMediciones();
    const resultados = evaluarTodo(mediciones);
    const general = peorEstado(resultados);
    console.table(resultados);
    console.log("Estado general:", general);
    mostrarResultados(mediciones, resultados, general);
    avisarTierra(general);
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
```

#### `style.css`

```css
.general,
.tarjeta{
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 0.9rem;
    margin:0.4 0;
    border-radius: 6px;
    border-left: 6px solid;
}

.general{ font-size:1.2rem;
font-weight: bold;
}

.estado-verde    { background: #d1fae5; border-color: #047857; }
.estado-amarillo { background: #fef3c7; border-color: #b45309; }
.estado-rojo     { background: #fee2e2; border-color: #b91c1c; }
.estado-sin-dato { background: #f3f4f6; border-color: #6b7280; }

.tarjeta{
    flex-wrap: wrap;
}

.mensaje{
    flex-basis:100%;
    font-size: 0.95rem;
    margin-top: 0.3rem;
}

.mensaje p{margin:0.2rem 0;}

.aviso{
    background-color: #1e293b;
    color: #ffff;
    padding:0.8rem 1rem;
    margin:0.5rem 0;
    border-left: 6px solid #b91c1c;
    border-radius:6px;
}

.aviso p {margin:0.3rem 0;}
```

---

## 3. Tabla de indicadores: umbrales y fuentes

**Decisión de diseño:** umbrales FIJOS ajustados al entorno espacial (más simples de programar en 48 h). La evaluación contra la línea base personal del astronauta se presenta en el pitch como mejora futura.

**Regla de evaluación (igual para todos):** valor < rojo.min o ≥ rojo.max → ROJO; si no, valor < amarillo.min o ≥ amarillo.max → AMARILLO; si no → VERDE. Sin dato = gris, nunca verde. Estado general = el peor de todos.

### 3.1 Temperatura corporal (°C, medición oral)

| Estado | Rango | Fuente |
|---|---|---|
| Rojo bajo | < 35.0 | Hipotermia — MedlinePlus / Mayo Clinic |
| Amarillo bajo | 35.0 – 35.9 | ILUSTRATIVO |
| Verde | 36.0 – 37.9 | MedlinePlus (normal 36.1–37.2) + ajuste espacial (Stahn 2017: +~1 °C) |
| Amarillo alto | 38.0 – 38.9 | NIOSH: temperatura central ≤ 38.0 °C en trabajo pesado (citado en Stahn 2017); MedlinePlus: fiebre > 38 °C |
| Rojo alto | ≥ 39.0 | ILUSTRATIVO (margen estrecho: sin hospital, inmunidad alterada) |

**Config:** rojo `{min: 35.0, max: 39.0}` · amarillo `{min: 36.0, max: 38.0}`

**Efecto del espacio:** la temperatura central en reposo sube ~1 °C de forma gradual y se estabiliza hacia el día 75 de misión ("fiebre espacial"). En ejercicio el máximo sube ~1.4 °C y superó 40 °C en algunos astronautas. Desviaciones < 33 °C o > 40 °C pueden ser mortales. — Stahn et al., *Scientific Reports* 7:16180 (2017), doi:10.1038/s41598-017-15560-w

El sistema inmunitario se altera (radiación, microgravedad, falta de sueño): reactivación de virus latentes y más infecciones. En la ISS se han reportado herpes, erupciones e infecciones. — NASA HRP, "Riesgo de respuestas alteradas del sistema inmunitario"

**Limitaciones conocidas:** (1) al inicio de la misión, antes de la subida de ~1 °C, una fiebre leve real (37.6–37.9) saldría en verde; (2) Stahn midió temperatura CENTRAL con sensor en la frente, no directamente comparable con termómetro oral.

### 3.2 Frecuencia cardíaca (lpm, en reposo)

| Estado | Rango | Fuente |
|---|---|---|
| Rojo bajo | < 40 | ILUSTRATIVO (atletas pueden llegar a ~40 — AHA) |
| Amarillo bajo | 40 – 49 | ILUSTRATIVO |
| Verde | 50 – 99 | AHA: normal 60–100; atletas más bajo |
| Amarillo alto | 100 – 129 | AHA: > 100 = taquicardia |
| Rojo alto | ≥ 130 | ILUSTRATIVO |

**Config:** rojo `{min: 40, max: 130}` · amarillo `{min: 50, max: 100}`

**Efecto del espacio:** en microgravedad los fluidos se desplazan hacia la cabeza; al cambiar de campo gravitatorio puede haber mareos y desmayos. — NASA HRP, "Peligro: campos gravitatorios". La fiebre es causa de taquicardia (relación con el indicador 1).

**Pendiente:** conseguir fuente primaria (heart.org) en vez de AARP.

### 3.3 Presión arterial (mmHg) — DOS valores; manda el peor

Tabla AHA / MedlinePlus (NIH): Normal < 120 y < 80 · Elevada 120–129 y < 80 · Grado 1: 130–139 o 80–89 · Grado 2: ≥ 140 o ≥ 90 · Crisis: > 180 y/o > 120.
Presión baja (hipotensión): inferior a 90/60 mmHg — NHLBI (NIH); MedlinePlus.

| Estado | Sistólica | Diastólica | Fuente |
|---|---|---|---|
| Rojo bajo | < 80 | < 50 | ILUSTRATIVO (hipotensión marcada) |
| Amarillo bajo | 80 – 89 | 50 – 59 | NHLBI / MedlinePlus: hipotensión < 90/60 |
| Verde | 90 – 129 | 60 – 79 | AHA (normal + elevada) |
| Amarillo alto | 130 – 180 | 80 – 120 | AHA (hipertensión grado 1–2) |
| Rojo alto | > 180 | > 120 | AHA (crisis hipertensiva) |

**Config:** sistólica rojo `{min: 80, max: 181}` · amarillo `{min: 90, max: 130}`; diastólica rojo `{min: 50, max: 121}` · amarillo `{min: 60, max: 80}`. Evaluar cada una y quedarse con el peor estado.

**Efecto del espacio:** la hipotensión ortostática (caída de presión al ponerse de pie) es frecuente al volver de la microgravedad y puede reducir el riego cerebral. — CORDIS (UE), proyecto ARTHEROSPACE, coordinado por el DLR. **Por eso la presión BAJA es el riesgo espacial principal, no solo la alta.**

### 3.4 Glucosa en sangre (mg/dL, capilar)

| Estado | Rango | Fuente |
|---|---|---|
| Rojo bajo | < 54 | ADA: hipoglucemia nivel 2 (síntomas neuroglucopénicos; acción inmediata) |
| Amarillo bajo | 54 – 69 | ADA: hipoglucemia nivel 1 (70 mg/dL = umbral de respuesta neuroendocrina en personas SIN diabetes) |
| Verde | 70 – 180 | ADA: rango objetivo 70–180 |
| Amarillo alto | 181 – 250 | ADA: hiperglucemia nivel 1 (adaptación ILUSTRATIVA para personas sanas) |
| Rojo alto | > 250 | ADA: hiperglucemia nivel 2 (misma salvedad) |

**Config:** rojo `{min: 54, max: 251}` · amarillo `{min: 70, max: 181}`

Fuente: American Diabetes Association, "6. Glycemic Goals and Hypoglycemia: Standards of Care in Diabetes—2024", *Diabetes Care* 47(Supl. 1):S111–S125, doi:10.2337/dc24-S006

**Acción con fuente:** glucosa < 70 → tomar 15 g de carbohidratos de acción rápida y volver a medir a los 15 min; repetir si persiste (ADA, recomendación 6.12).

**Limitación:** la guía es para personas con diabetes; los umbrales altos son menos aplicables a astronautas sanos.
**Pendiente:** fuente sobre el efecto del espacio en la glucosa.

### 3.5 Sueño (horas en las últimas 24 h)

| Estado | Rango | Fuente |
|---|---|---|
| Rojo | < 5 | ILUSTRATIVO |
| Amarillo | 5 – 6.9 | ILUSTRATIVO |
| Verde | ≥ 7 | CDC: adultos 18–60 años, 7 o más horas |

Solo importa el límite inferior. **Config:** rojo `{min: 5, max: Infinity}` · amarillo `{min: 7, max: Infinity}`

**Efecto del espacio:** falta de sueño, desincronización circadiana y sobrecarga de trabajo reducen el rendimiento; la NASA investiga fototerapia para la alineación circadiana. — NASA HRP, "Peligro: aislamiento y confinamiento"

**Nota:** una noche mala ≠ problema; la tendencia es lo relevante.

### 3.6 Estado de ánimo (escala 1–5, autoevaluación)

| Estado | Valor | Fuente |
|---|---|---|
| Rojo | 1 | ILUSTRATIVO |
| Amarillo | 2 | ILUSTRATIVO |
| Verde | 3 – 5 | ILUSTRATIVO |

No existen umbrales clínicos para esta escala: es diseño propio. **Config:** rojo `{min: 2, max: Infinity}` · amarillo `{min: 3, max: Infinity}`

**Efecto del espacio:** la NASA desarrolla métodos para monitorear la salud conductual y detectar factores de riesgo precoces en tripulaciones aisladas y confinadas. — NASA HRP, "Peligro: aislamiento y confinamiento" (argumento clave para el pitch)

---

## 4. Contenido de la app: textos para astronautas que no son médicos

**Reglas de redacción:** frases cortas, segunda persona, verbo primero. Nunca diagnosticar ("tienes una infección"); orientar ("puede ser fiebre"). Término técnico solo detrás de un clic.

Marcas: **[Fuente]** = viene de una fuente del proyecto · **[Verificar]** = práctica estándar, confirmar antes del pitch · **[Ilustrativo]** = decisión de diseño.

> Los **mensajes** de cada indicador ya están implementados en el objeto `MENSAJES` de `app.js` (ver sección 2). Lo que sigue es el contenido que **aún NO está implementado**: "por qué importa", "cómo medir" y "rango posible".

### 4.1 Temperatura

**Por qué importa:** la fiebre es la señal más común de infección, y en el espacio el sistema inmunitario funciona peor. [Fuente: NASA HRP inmunidad]

**Cómo medir:** [Verificar: MedlinePlus "Temperatura corporal"]
1. No comas ni bebas nada caliente o frío en los 30 minutos previos.
2. Coloca el termómetro debajo de la lengua y cierra los labios.
3. Espera la señal del termómetro.
4. Anota el valor con un decimal (ejemplo: 37.4).

**Rango posible (validación):** 30 – 43 °C [Ilustrativo]. Fuera de él: "Este valor parece poco probable. Revisa el termómetro y vuelve a medir."

**Mensaje verde:** "Tu temperatura está normal. En misiones largas es normal que suba hasta 1 °C."

### 4.2 Frecuencia cardíaca

**Por qué importa:** muestra cuánto trabaja tu corazón. En microgravedad la sangre se reparte distinto y el corazón se adapta; al cambiar de gravedad puedes marearte. [Fuente: NASA HRP gravedad]

**Cómo medir:** [Fuente: AHA]
1. Siéntate y descansa 5 minutos. No tomes café antes.
2. Pon los dedos índice y medio en la muñeca, bajo el pulgar.
3. Cuenta los latidos durante 30 segundos.
4. Multiplica por 2. Ese es tu valor.

Mejor momento: al despertar, antes de levantarte. [Fuente: AHA]

**Rango posible:** 25 – 220 lpm [Ilustrativo].

**Término técnico (detrás de clic):** rápido = taquicardia; lento = bradicardia.

### 4.3 Presión arterial

**Por qué importa:** si baja demasiado, al cerebro llega menos sangre y puedes desmayarte. Pasa sobre todo al volver a la gravedad (aterrizaje en la Luna, Marte o la Tierra). [Fuente: CORDIS ARTHEROSPACE; MedlinePlus presión baja]

**Cómo medir:** [Verificar: AHA "cómo medir la presión arterial en casa"]
1. No hagas ejercicio ni tomes cafeína en los 30 minutos previos.
2. Siéntate con la espalda apoyada y los pies planos. Descansa 5 minutos.
3. Pon el brazalete en el brazo desnudo, a la altura del corazón.
4. No hables durante la medición.
5. Toma 2 lecturas con 1 minuto de diferencia y anota la segunda.

**Rango posible:** sistólica 50 – 250, diastólica 30 – 150 mmHg [Ilustrativo]. Además: si la diastólica ≥ sistólica → "Revisa: el número de arriba debe ser mayor que el de abajo."

**Casilla opcional:** "¿Te mareas o sientes que te vas a desmayar?" → si sí y presión amarilla baja → subir a rojo. [Ilustrativo, basado en MedlinePlus: la hipotensión es un problema cuando causa mareos o desmayos]

### 4.4 Glucosa

**Por qué importa:** es la energía de tu cuerpo y tu cerebro. Si baja mucho, puedes confundirte o desmayarte. [Fuente: ADA 2024]

**Cómo medir:** [Verificar: instrucciones del glucómetro / ADA]
1. Lávate y sécate las manos.
2. Pincha el lateral de la yema de un dedo con la lanceta.
3. Pon la gota de sangre en la tira del glucómetro.
4. Anota el valor en mg/dL y si comiste en las 2 horas anteriores.

**Rango posible:** 20 – 600 mg/dL [Ilustrativo].

### 4.5 Sueño

**Por qué importa:** dormir poco reduce tu atención y tus defensas. En el espacio el ciclo de día y noche se altera. [Fuente: CDC; NASA HRP aislamiento]

**Cómo medir:** al despertar, anota cuántas horas dormiste en total (puedes usar medias horas: 6.5).

**Rango posible:** 0 – 24 h.

### 4.6 Estado de ánimo

**Por qué importa:** el aislamiento y el encierro afectan al ánimo y al trabajo en equipo. Detectarlo pronto ayuda. [Fuente: NASA HRP aislamiento]

**Cómo medir:** elige la cara que mejor describe cómo te sientes hoy (1 = muy mal, 5 = muy bien). No hay respuestas buenas o malas.

**Rango posible:** 1 – 5 (lo controla el selector).

### 4.7 Hábitats

| Clave | Nombre | Gravedad | Retraso ida | Línea extra del protocolo rojo |
|---|---|---|---|---|
| iss | Estación espacial | Microgravedad | ~0.5 s | "Los médicos responden casi al instante. Prepárate por si se decide una evacuación." |
| transito | Nave en tránsito a Marte | Microgravedad | ~3–22 min (prototipo: 12) | "No hay regreso posible durante el viaje. Todo se trata a bordo: sigue el protocolo." |
| luna | Base lunar | ~1/6 terrestre | ~1.3 s | "Los médicos responden casi al instante. Un regreso a la Tierra tomaría días." |
| marte | Base en Marte | ~1/3 terrestre | 3–22 min (prototipo: 12) | "Estás en máxima autonomía. Sigue el protocolo mientras llega la respuesta." |

**Aviso de adaptación a la gravedad** (al seleccionar luna o marte, o al cambiar de hábitat): "Al cambiar de gravedad puedes marearte. Levántate despacio y mide tu presión." [Fuente: NASA HRP gravedad; CORDIS]

### 4.8 Recordatorios de rutina (NO implementado, opcional)

Cada medición guarda fecha y hora en localStorage. Al abrir la app:

| Indicador | Frecuencia | Mensaje si toca |
|---|---|---|
| Temperatura | Cada 24 h | "Hace más de un día que no registras tu temperatura." |
| Frecuencia cardíaca | Cada 24 h, al despertar | "Mide tu pulso al despertar, antes de levantarte." |
| Presión arterial | Cada 24 h | "Toca medir tu presión." |
| Glucosa | Cada 24 h | "Toca medir tu glucosa." |
| Sueño | Cada mañana | "¿Cuántas horas dormiste anoche?" |
| Ánimo | Cada 24 h | "¿Cómo te sientes hoy?" |

Frecuencias [Ilustrativo]. Si un valor salió amarillo, el recordatorio pasa a "Vuelve a medir en X minutos".

### 4.9 Mensajes generales

- Sin datos: "Introduce al menos un indicador."
- Valor imposible: "Este valor parece poco probable. Revisa cómo mediste y vuelve a intentarlo."
- Descargo (pie de página): "Esta herramienta orienta; no sustituye el criterio de los médicos de vuelo."
- Aviso a Tierra: "Aviso enviado a Tierra. Respuesta estimada en {tiempo}. Sigue el protocolo mientras tanto."

---

## 5. Datos de la NASA en la lógica (criterio "Relevance")

**Objetivo:** que los datos de la NASA cambien lo que calcula la app, no que sean solo una cita. Entradas nuevas: hábitat + día de misión. Salidas nuevas: radiación acumulada vs. límite NASA, pérdida ósea estimada, retraso de comunicación.

**Estado: NO IMPLEMENTADO.** Solo los retrasos de comunicación están en el código.

Marcas: [Seguro] fuente encontrada · [Elección] valor elegido dentro de un rango de la fuente · [Verificar] sin fuente NASA limpia todavía.

| Dato | Valor | Fuente | Confianza |
|---|---|---|---|
| Límite de radiación de carrera | 600 mSv (todas las edades y sexos) | NASA-STD-3001 Vol. 1 [V1 4030] — https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf | [Seguro] |
| Dosis en la ISS | 0.2–0.5 mSv/día → usar **0.35** | Simonsen et al., NASA — https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf | [Seguro] rango / [Elección] 0.35 |
| Dosis en tránsito a Marte | **1.8 mSv/día** | Curiosity RAD, Zeitlin et al. 2013 — https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-radiation-exposure-associated-trip-mars | [Seguro] |
| Duración del tránsito a Marte | ~180 días (6 meses) | NASA HRP Hazard: Gravity Fields — https://www.nasa.gov/hrp/hazard-gravity-fields | [Seguro] |
| Dosis en superficie de Marte | **0.64 mSv/día** | Curiosity RAD, Hassler et al. 2014 (Science 343) — https://ntrs.nasa.gov/citations/20180007641 | [Seguro] |
| Dosis en superficie lunar | — | No hay cifra NASA limpia en mSv/día (CRaTER mide en Gy) | [Verificar]; si no se encuentra: mostrar "sin dato" |
| Pérdida ósea en microgravedad | 1–1.5 % por mes | https://www.nasa.gov/hrp/hazard-gravity-fields y https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/ | [Seguro] |
| Pérdida ósea en gravedad parcial (Luna/Marte) | Desconocida | NASA: no se sabe si la gravedad parcial mitiga la pérdida — https://ntrs.nasa.gov/citations/20170004598 | Mostrar "desconocido", no inventar |
| Gravedad Marte / Luna | ~1/3 / ~1/6 | NASA HRP | [Seguro] |
| Retraso comunicación Marte | 3–22 min ida | NASA | [Seguro] |

### Fórmulas a implementar

- **Dosis acumulada (mSv)** = dosisPrevia + tasa × días
  - ISS: `0.35 × días`
  - Tránsito: `1.8 × días`
  - Base Marte: `324 (180 d × 1.8 del viaje) + 0.64 × días en superficie`
- **% del límite** = `dosis / 600 × 100`
  - Verde < 50 % · Amarillo 50–89 % · Rojo ≥ 90 % [Ilustrativo]
- **Pérdida ósea (solo microgravedad)** = `días / 30 × [1, 1.5]` → mostrar rango
  - Base Marte: "6–9 % perdido durante el viaje; ritmo en Marte desconocido"

### Escenario de demo

Marte, día 80. Dosis = 324 + 0.64 × 80 = **375.2 mSv** → 62.5 % del límite → amarillo. Más fiebre → rojo general → protocolo → aviso con 12 min de espera.

### Texto para el campo "NASA Data" del formulario de entrega (borrador en inglés)

> Radiation exposure is estimated from NASA's Curiosity RAD measurements (1.8 mSv/day in transit, 0.64 mSv/day on the Martian surface) and NASA ISS dose rates, and compared against NASA's 600 mSv career limit (NASA-STD-3001). Bone-loss estimates use NASA Human Research Program data (1–1.5% bone mineral density per month in microgravity). Habitat-specific protocols are based on NASA HRP's five hazards of human spaceflight (RIDGE).

---

## 6. Requisitos de entrega (NASA Space Apps 2026)

Extraídos de la guía oficial de envío de proyectos, publicada el 13 de noviembre de 2026.

### Plazos
- Apertura: sábado 14 de noviembre, 9:00 hora local del evento.
- **Cierre: domingo 15 de noviembre, 23:59 hora local del evento.**
- Hay que pulsar **"Enviar para evaluación"** (Submit for judging). Los proyectos solo guardados no se evalúan.
- Se puede editar y reenviar cuantas veces se quiera; solo se revisa la última versión guardada.

### Requisitos obligatorios
1. **Todo el contenido del formulario debe estar en INGLÉS.** Única excepción: en un vídeo se puede hablar otro idioma, pero con subtítulos en inglés. Las diapositivas deben ir en inglés.
2. **Demo obligatoria:** vídeo de **30 segundos o menos**, O presentación de **hasta 7 diapositivas** (incluidas portada e introducción). Superar estos límites descalifica del juicio global.
3. La demo debe alojarse en un sitio externo (YouTube, Google Drive, GitHub, OneDrive, Dropbox) con **enlace público sin inicio de sesión**. El sitio de Space Apps no admite subir vídeos ni documentos.
4. Todos los miembros del equipo deben estar inscritos en el **mismo evento local**.
5. No pueden aparecer personas menores de 18 años en imágenes, vídeo o audio.
6. Marcar las casillas de "Términos y condiciones" y "Confirmar que todo el trabajo es original".

### Campos del formulario del proyecto
- Nombre del proyecto
- Resumen de alto nivel
- Enlace a la demostración
- Enlace al proyecto final
- Descripción detallada
- **Uso de la superinteligencia (SI)** ← hay que redactarlo; existe `USO-DE-IA.MD` pero necesita corrección (ver sección 7)
- Datos de la NASA
- Datos de socios de la Agencia Espacial y otras referencias

### Criterios de evaluación
Impacto · Creatividad · Validez · **Relevancia** · Presentación

### Estructura recomendada del vídeo de 30 s (de la guía oficial)
- [0:00] Nombre propio y del equipo
- [0:02] Qué reto aborda y qué inspiró elegirlo
- [0:05] Título y eslogan del proyecto
- [0:10] Cómo funciona: imágenes o prototipo, experiencia de usuario, cómo los datos abiertos de la NASA lo hicieron posible
- [0:20–0:30] Visión de futuro

### Recomendación adicional
Si el proyecto se aloja en un sitio nuevo, conviene solicitar una clasificación de filtro web en FortiGuard para que los jueces puedan acceder (categoría: educación o aplicación web; nombre de empresa: "N/A"). No es obligatorio.

---

## 7. Pendientes, en orden de prioridad

### Bloqueantes para la entrega
1. **Corregir `USO-DE-IA.MD`.** Contiene una contradicción interna: afirma "yo escribí todo el código a mano" mientras su propia tabla registra que `app.js` completo fue "código generado por IA". Hay que declarar con precisión qué escribió cada parte. También menciona un README que no existe en el repo.
2. **Desplegar en GitHub Pages** aunque esté incompleto, para tener un enlace funcional pase lo que pase.
3. **Redactar todos los textos de entrega en inglés**, incluido el campo de uso de SI.
4. **Producir la demo** (vídeo de 30 s o 7 diapositivas) y alojarla con enlace público.
5. **Confirmar la inscripción en el evento local** (el equipo figuraba en lista de espera en el evento de INTEC, Santo Domingo).

### Mejoras funcionales, por valor para la evaluación
6. **Botón o selector de escenario** (fiebre, hipotensión, hipoglucemia) para que la demo pueda mostrar una alerta. Sin esto no se puede demostrar el aviso a Tierra con el Astroskin.
7. **Regla de datos faltantes:** que el estado general no diga "Normal" cuando hay indicadores sin medir.
8. **Validación de valores imposibles** con el mensaje de "vuelve a medir" (rangos en la sección 4).
9. **Panel "por qué importa / cómo medir"** por indicador. Es un requisito explícito del reto.
10. **Panel de datos NASA:** radiación acumulada contra el límite de 600 mSv y pérdida ósea estimada (fórmulas en la sección 5). Es lo que sostiene el criterio de Relevancia.
11. Alerta en reloj de muñeca simulado.
12. Figura corporal SVG con zonas coloreadas.
13. Diseño: contraste WCAG AA, versión móvil.

### Opcionales (orden de corte si falta tiempo: de arriba a abajo se sacrifica primero)
14. Gráfico de tendencia
15. Casilla de síntomas (mareo)
16. Pulido visual avanzado
17. Recordatorios e historial en localStorage

### Verificaciones pendientes de contenido
- Confirmar las instrucciones marcadas [Verificar]: cómo medir temperatura, presión y glucosa.
- Conseguir fuente primaria de frecuencia cardíaca (heart.org en vez de AARP).
- Buscar fuente sobre el efecto del espacio en la glucosa.
- Buscar el 5.º peligro NASA HRP: "Distancia de la Tierra" (base del argumento de autonomía).
- Añadir URLs a todas las fuentes.

---

## 8. Argumentos preparados para el pitch

- **Problema:** hacia Marte la respuesta de los médicos tarda 6–44 min (ida y vuelta); el astronauta debe evaluarse y actuar solo.
- **Diseñado para no médicos:** lenguaje simple, cómo medir, qué hacer, y detección de errores de medición.
- **Cada umbral tiene fuente** (MedlinePlus, AHA, ADA, CDC, NHLBI) o está marcado como ilustrativo.
- **Ajuste espacial con evidencia:** "fiebre espacial" de +1 °C (Stahn et al., 2017).
- **El protocolo cambia según el hábitat:** en tránsito no hay evacuación posible.
- **La NASA busca métodos para monitorear la salud conductual** (HRP, aislamiento y confinamiento).
- **Seguridad de diseño:** "sin dato" nunca se muestra como sano; manda el peor indicador; valores imposibles no disparan falsas alarmas.
- **Limitaciones conocidas y mejora futura:** línea base personal por astronauta.

---

## 9. Cómo continuar: preferencias de trabajo de la desarrolladora

Contexto para la IA que tome el relevo:

- Quiere que **le enseñen línea por línea**, no recibir bloques de código terminados. Prefiere escribir ella el código y que se le expliquen los conceptos.
- No quiere avanzar al siguiente paso hasta que el actual funcione perfectamente.
- Prefiere explicaciones directas y técnicamente fundamentadas, con registro de profesional de TI.
- Trabaja en español.
- Pide franqueza: que se le señalen los fallos y supuestos arriesgados en la primera frase, sin elogios de relleno, y que se califique el nivel de confianza de las afirmaciones.
