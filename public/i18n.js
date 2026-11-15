// i18n.js · run3rs — ajustes de la página e idioma (español / inglés).
// Se carga ANTES de app.js. Define:
//   AJUSTES        ajustes guardados en el navegador (idioma, motor de voz, voz, velocidad)
//   IDIOMA         "es" o "en": el elegido en Ajustes, o el del dispositivo si está en "Automático"
//   tr(texto, v)   traduce un texto en español (con {variables}) al idioma de la página
//   traducirDatos  reemplaza en inglés los textos de las tablas de app.js (MENSAJES, GUIA...)
// Para traducir un texto nuevo: escríbelo en español con tr("...") en app.js y agrega aquí su
// versión en inglés en EN_TEXTOS, con la misma clave exacta.

// ===== Ajustes guardados =====
const AJUSTES = (function () {
    const base = { idioma: "auto", motorVoz: "gemini", velocidad: 1, voz: "" };
    try { return Object.assign(base, JSON.parse(localStorage.getItem("run3rs-ajustes") || "{}")); }
    catch (_) { return base; }
})();

function guardarAjustes() {
    try { localStorage.setItem("run3rs-ajustes", JSON.stringify(AJUSTES)); } catch (_) {}
}

// Idioma del dispositivo o navegador: español si está en español; cualquier otro, inglés
function idiomaDispositivo() {
    const lista = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || "es"];
    return /^es\b/i.test(lista[0]) ? "es" : "en";
}

const IDIOMA = AJUSTES.idioma === "es" || AJUSTES.idioma === "en" ? AJUSTES.idioma : idiomaDispositivo();

// ===== Traducción =====
function tr(texto, vars) {
    let t = String(texto);
    if (IDIOMA === "en" && Object.prototype.hasOwnProperty.call(EN_TEXTOS, t)) t = EN_TEXTOS[t];
    if (vars) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return t;
}

function mezclarDatos(destino, fuente) {
    for (const k in fuente) {
        const f = fuente[k];
        if (f && typeof f === "object" && destino[k] && typeof destino[k] === "object") mezclarDatos(destino[k], f);
        else destino[k] = f;
    }
}

function traducirDatos(tabla, nombre) {
    if (IDIOMA !== "en" || !DATOS_EN[nombre]) return;
    mezclarDatos(tabla, DATOS_EN[nombre]);
}

// ===== Textos en inglés (clave = texto exacto en español) =====
const EN_TEXTOS = {
    // --- Página (index.html) ---
    "run3rs · Monitor de salud": "run3rs · Health monitor",
    "Secciones": "Sections",
    "Panel": "Dashboard",
    "Gráficos": "Charts",
    "Lecturas": "Readings",
    "Indicadores": "Indicators",
    "⚙ Ajustes": "⚙ Settings",
    "Prototipo": "Prototype",
    "Datos simulados. No es un dispositivo médico.": "Simulated data. Not a medical device.",
    "Panel de salud": "Health dashboard",
    "Lógica: en espera": "Logic: waiting",
    "Prototipo · datos simulados": "Prototype · simulated data",
    "Conectar wearable (simulado)": "Connect wearable (simulated)",
    "Desconectar wearable": "Disconnect wearable",
    "Hola, astronauta": "Hello, astronaut",
    "Resumen de tu salud en la misión": "Your health summary for the mission",
    "Estado general": "Overall status",
    "Sin lecturas": "No readings",
    "Frecuencia cardíaca": "Heart rate",
    "Temperatura": "Temperature",
    "Radiación acumulada": "Accumulated radiation",
    "Elige el dispositivo que simula las lecturas": "Choose the device that simulates the readings",
    "Ver simulación": "Show simulation",
    "Ocultar simulación": "Hide simulation",
    "Wearable anterior": "Previous wearable",
    "Wearable siguiente": "Next wearable",
    "Corazón, presión y glucosa": "Heart, blood pressure and glucose",
    "Últimas 30 lecturas · toca un indicador para ver su escala y rango normal": "Last 30 readings · tap an indicator to see its scale and normal range",
    "Temperatura y bienestar": "Temperature and wellbeing",
    "Graficar datos recolectados": "Plot collected data",
    "Nova · asistente de a bordo": "Nova · onboard assistant",
    "Día de misión": "Mission day",
    "Di «Oye Nova» y háblale.": "Say “Hey Nova” and talk to her.",
    "🎙 Activar a Nova": "🎙 Activate Nova",
    "⌨ Escribir en vez de hablar": "⌨ Type instead of talking",
    "⌨ Ocultar teclado": "⌨ Hide keyboard",
    "Ver transcripción": "Show transcript",
    "Ocultar transcripción": "Hide transcript",
    "¿Qué deseas consultar?": "What would you like to ask?",
    "Ejemplo: ¿Por qué mi glucosa está en alerta?": "Example: Why is my glucose on alert?",
    "Consultar a Nova": "Ask Nova",
    "Lecturas del wearable": "Wearable readings",
    "En la misión llegan solas del wearable y del sensor de glucosa; aquí se simulan y puedes editarlas.": "During the mission they arrive automatically from the wearable and the glucose sensor; here they are simulated and you can edit them.",
    "Ubicacion de la mision": "Mission location",
    "Estacion Espacial": "Space Station",
    "Nave en Transito a Marte": "Spacecraft in transit to Mars",
    "Base Lunar": "Lunar base",
    "Base en Marte": "Mars base",
    "Escenario simulado": "Simulated scenario",
    "Fiebre": "Fever",
    "Hipotensión": "Hypotension",
    "Hipoglucemia": "Hypoglycemia",
    "Temperatura (°C)": "Temperature (°C)",
    "Frecuencia cardíaca (lpm)": "Heart rate (bpm)",
    "Presión sistólica (mmHg)": "Systolic pressure (mmHg)",
    "Presión diastólica (mmHg)": "Diastolic pressure (mmHg)",
    "Glucosa (mg/dl)": "Glucose (mg/dl)",
    "Horas de sueño(ultimas 24 horas)": "Hours of sleep (last 24 hours)",
    "Estado de ánimo": "Mood",
    "Procesar lectura": "Process reading",
    "Semáforo por indicador según la última lectura": "Traffic light per indicator based on the latest reading",
    "ⓘ ¿Por qué se vigilan estos indicadores?": "ⓘ Why are these indicators monitored?",
    "En una misión larga, la radiación, la microgravedad, el aislamiento y un ambiente cerrado cambian tu cuerpo poco a poco: inmunidad, huesos, corazón, sueño y ánimo. Lejos de la Tierra, tú eres quien primero puede notar esos cambios.": "On a long mission, radiation, microgravity, isolation and a closed environment change your body little by little: immunity, bones, heart, sleep and mood. Far from Earth, you are the first one who can notice those changes.",

    // --- Panel de ajustes ---
    "Ajustes": "Settings",
    "Cerrar": "Close",
    "Idioma de la página": "Page language",
    "Automático (idioma del dispositivo)": "Automatic (device language)",
    "Motor de voz": "Voice engine",
    "Gemini (si falla, usa la del navegador)": "Gemini (falls back to the browser voice)",
    "Voz del navegador": "Browser voice",
    "Gemini suena más natural, pero necesita la clave GEMINI_API_KEY en el servidor.": "Gemini sounds more natural, but it needs the GEMINI_API_KEY key on the server.",
    "Las voces «Natural» u «Online» suenan mejor. En Edge hay más para elegir.": "“Natural” or “Online” voices sound better. Edge has more to choose from.",
    "Velocidad del habla": "Speech speed",
    "Con la voz de Gemini la velocidad es aproximada.": "With the Gemini voice the speed is approximate.",
    "🔊 Probar voz": "🔊 Test voice",
    "Listo": "Done",
    "Idioma detectado en este dispositivo: {idioma}": "Language detected on this device: {idioma}",
    "Hola, soy Nova. Así sueno con estos ajustes.": "Hi, I'm Nova. This is how I sound with these settings.",

    // --- Gráficos ---
    "{n} de {total}": "{n} of {total}",
    "Este wearable no mide este indicador": "This wearable does not measure this indicator",
    "No hay datos para mostrar": "No data to show",
    "rango normal": "normal range",
    "tu base": "your baseline",
    "alto": "high",
    "bajo": "low",
    "Quitar enfoque": "Remove focus",
    "Ver con su escala y rango normal": "Show with its scale and normal range",
    "FC": "HR",
    "Sistólica": "Systolic",
    "Diastólica": "Diastolic",
    "Glucosa": "Glucose",
    "Sueño": "Sleep",
    "Ánimo": "Mood",
    "lpm": "bpm",

    // --- Entorno, guía y resultados ---
    "N/A (gravedad parcial)": "N/A (partial gravity)",
    "Entorno - {habitat} (día {dia})": "Environment - {habitat} (day {dia})",
    "Gravedad: {g}g": "Gravity: {g}g",
    "Radiación acumulada: {msv} mSv ({pct}% del límite de carrera)": "Accumulated radiation: {msv} mSv ({pct}% of the career limit)",
    "Pérdida ósea estimada: {osea}": "Estimated bone loss: {osea}",
    "ⓘ Cómo se mide y por qué importa": "ⓘ How it is measured and why it matters",
    "Cómo se mide:": "How it is measured:",
    "Cómo se mide: {nombre}": "How it is measured: {nombre}",
    "Normal:": "Normal:",
    "En el espacio:": "In space:",
    "Estado general:": "Overall status:",
    "Qué está pasando:": "What is happening:",
    "Qué hacer:": "What to do:",

    // --- Línea base personal ---
    "Tu {nombre} está {delta} {unidad} por {lado} de tu base personal, aunque sigue en rango normal. Vigila la tendencia.": "Your {nombre} is {delta} {unidad} {lado} your personal baseline, although it is still in the normal range. Watch the trend.",
    "encima": "above",
    "debajo": "below",
    "Calibrando tu línea base: {n} de {total} lecturas normales.": "Calibrating your baseline: {n} of {total} normal readings.",
    "Línea base personal": "Personal baseline",
    "Nova (línea base): ": "Nova (baseline): ",

    // --- Wearable ---
    "Oxígeno": "Oxygen",
    "Resp/min": "Breaths/min",
    "Vol. resp.": "Tidal vol.",
    "Var. cardíaca": "HR variability",
    "alta": "high",
    "moderada": "moderate",
    "reposo": "rest",
    "Actividad": "Activity",
    "Valores simulados": "Simulated values",
    "Banda WHOOP, sin pantalla": "WHOOP band, no screen",
    "Bio-Monitor: camiseta y diadema con sensores": "Bio-Monitor: shirt and headband with sensors",
    "SIN DATOS": "NO DATA",
    "Esperando mediciones": "Waiting for measurements",
    "Pulsa \"Conectar wearable (simulado)\".": "Press \"Connect wearable (simulated)\".",
    "NORMAL": "NORMAL",
    "ATENCIÓN": "ATTENTION",
    "ALERTA": "ALERT",
    "TIERRA": "EARTH",
    "Todo lo que mide tu wearable está en rango": "Everything your wearable measures is in range",
    "Sigue con tu rutina.": "Keep up your routine.",
    "Respuesta de Tierra recibida": "Earth response received",
    "Sigue el protocolo y vuelve a medir.": "Follow the protocol and measure again.",
    "MODO AUTONOMÍA": "AUTONOMY MODE",
    "en nivel de alerta": "at alert level",
    "moderadamente alterado": "moderately out of range",
    "moderadamente alterada": "moderately out of range",
    "Valor en alerta": "Value on alert",
    "Tu {nombre} está {grado}": "Your {nombre} is {grado}",
    "Vuelve a medir.": "Measure again.",
    "AVISO ENVIADO A TIERRA": "ALERT SENT TO EARTH",
    "Respuesta estimada en {tiempo}": "Estimated response in {tiempo}",
    "Día {dia}": "Day {dia}",
    "Respuesta simulada": "Simulated response",

    // --- Aviso a Tierra ---
    "Aviso enviado a Tierra. Respuesta estimada en {tiempo}.": "Alert sent to Earth. Estimated response in {tiempo}.",
    "Motivo:": "Reason:",
    "indicadores alterados": "indicators out of range",
    "Respuesta de Tierra recibida (simulada).": "Earth response received (simulated).",
    "{nombre} en alerta": "{nombre} on alert",
    "{nombre} alterado/a en {n} lecturas seguidas": "{nombre} out of range in {n} consecutive readings",
    "Nova (alerta automática): ": "Nova (automatic alert): ",
    "Hay más indicadores alterados, revisa el panel.": "More indicators are out of range, check the dashboard.",

    // --- Cabecera e indicadores ---
    "Lógica: Python (servidor)": "Logic: Python (server)",
    "Lógica: respaldo local": "Logic: local fallback",
    "vs. lectura anterior: —": "vs. previous reading: —",
    "vs. lectura anterior": "vs. previous reading",
    "Todo en rango": "All in range",
    "1 indicador alterado": "1 indicator out of range",
    "{n} indicadores alterados": "{n} indicators out of range",
    "sin dato": "no data",
    "{pct}% del límite NASA (600 mSv)": "{pct}% of the NASA limit (600 mSv)",
    "Día {dia} de misión": "Mission day {dia}",
    "No hay datos todavía. Registra al menos una lectura primero.": "There is no data yet. Record at least one reading first.",

    // --- Nova (texto) ---
    "Todavía no tengo lecturas tuyas, así que no puedo decirte cómo estás. Conecta el wearable o procesa una lectura y te respondo.": "I don't have any readings from you yet, so I can't tell you how you are. Connect the wearable or process a reading and I'll answer.",
    "¡Hola! Aquí estoy. ¿En qué te ayudo?": "Hi! I'm here. How can I help?",
    "Estoy bien, gracias por preguntar, y lista para ayudarte. ¿Quieres que revise cómo estás tú?": "I'm good, thanks for asking, and ready to help. Do you want me to check how you are?",
    "Soy Nova, tu asistente de salud a bordo. Reviso tus lecturas, te aviso si algo se altera y te digo qué hacer.": "I'm Nova, your onboard health assistant. I check your readings, let you know if something changes and tell you what to do.",
    "Puedo decirte cómo están tus indicadores, explicarte una alerta, decirte cuánta radiación llevas o cuánto falta para la respuesta de Tierra, y cambiar de wearable o iniciar la simulación.": "I can tell you how your indicators are, explain an alert, tell you how much radiation you've received or how long until Earth responds, and switch wearables or start the simulation.",
    "Ahora mismo no tengo conexión con mi asistente en línea, así que solo puedo responder sobre tus lecturas y comandos básicos.": "Right now I can't reach my online assistant, so I can only answer about your readings and basic commands.",
    "{nombre} fuera de rango.": "{nombre} out of range.",
    "Según tus mediciones, todos los indicadores están dentro de los rangos normales.": "According to your measurements, all indicators are within normal ranges.",
    "Según tus mediciones:": "According to your measurements:",
    "Astronauta: ": "Astronaut: ",
    "Tú: ": "You: ",
    "Analizando mediciones...": "Analyzing measurements...",
    "Consultando a Nova...": "Asking Nova...",
    "Nova (sin conexión con el asistente en línea): ": "Nova (offline assistant): ",

    // --- Nova (voz) ---
    "Tu navegador no permite reconocimiento de voz (usa Chrome o Edge).": "Your browser doesn't support speech recognition (use Chrome or Edge).",
    "💬 Modo conversación (sin decir «Nova»)": "💬 Conversation mode (no need to say “Nova”)",
    "🏷 Modo nombre (di «Nova» primero)": "🏷 Name mode (say “Nova” first)",
    "Responde a todo lo que oye. Cámbialo si hay mucho ruido o gente hablando.": "Answers everything it hears. Switch it if there is a lot of noise or people talking.",
    "Solo responde cuando dices «Nova».": "Only answers when you say “Nova”.",
    "🔴 Nova está atenta · pulsa para apagar": "🔴 Nova is listening · press to turn off",
    "🟢 Te escucho...": "🟢 I'm listening...",
    "⏳ Pensando...": "⏳ Thinking...",
    "🔊 Nova habla · di «Nova, para» para cortarla": "🔊 Nova is speaking · say “Nova, stop” to interrupt",
    "Háblame cuando quieras": "Talk to me whenever you want",
    "Di «Oye Nova» y tu pregunta": "Say “Hey Nova” and your question",
    "Puedes seguir hablando, o di «Nova» más tarde": "You can keep talking, or say “Nova” later",
    "Toca la página una vez para poder oír mi voz.": "Tap the page once so you can hear my voice.",
    "De nada. Aquí estoy.": "You're welcome. I'm here.",
    "Aún no he dicho nada.": "I haven't said anything yet.",
    "Estás en el día {dia} de la misión.": "You are on day {dia} of the mission.",
    "La respuesta de Tierra llega en {tiempo}.": "Earth's response arrives in {tiempo}.",
    "La respuesta de Tierra ya llegó. Sigue el protocolo.": "Earth's response has arrived. Follow the protocol.",
    "No hay ningún aviso a Tierra en curso.": "There is no alert to Earth in progress.",
    "Listo, wearable conectado. Recibirás una lectura cada {n} segundos.": "Done, wearable connected. You'll get a reading every {n} seconds.",
    "Listo, wearable desconectado.": "Done, wearable disconnected.",
    "Cambié a {nombre}.": "Switched to {nombre}.",
    "Llevas {msv} milisievert, el {pct} por ciento del límite de la NASA.": "You have received {msv} millisieverts, {pct} percent of the NASA limit.",
    "Ahora simulo con {nombre}.": "Now simulating with {nombre}.",
    "No pude responder ahora. Inténtalo de nuevo.": "I couldn't answer right now. Please try again.",
    "Nova no está escuchando. Toca la página para volver a activarla.": "Nova is not listening. Tap the page to turn her back on.",
    "De acuerdo, dejo de escuchar. Toca la pantalla cuando me necesites.": "Okay, I'll stop listening. Tap the screen when you need me.",
    "Te escucho": "I'm listening",
    "Oí: «{texto}»": "I heard: “{texto}”",
    "Oyendo: «{texto}…»": "Hearing: “{texto}…”",
    "Permite el micrófono en el navegador (candado junto a la dirección) y toca la página.": "Allow the microphone in the browser (padlock next to the address) and tap the page.",
    "No se encontró un micrófono.": "No microphone was found.",
    "Sin conexión con el servicio de voz. Reintentando...": "No connection to the speech service. Retrying...",
    "Toca la página para que Nova empiece a escuchar.": "Tap the page so Nova starts listening.",
    "Hola, soy Nova. Te escucho, pregúntame lo que quieras.": "Hi, I'm Nova. I'm listening, ask me anything.",
    "Hola, soy Nova. Cuando me necesites, di «Oye Nova».": "Hi, I'm Nova. When you need me, say “Hey Nova”.",
    "No recibo audio del micrófono. Revisa el permiso (candado junto a la dirección) y que el micrófono correcto esté seleccionado.": "I'm not getting audio from the microphone. Check the permission (padlock next to the address) and that the right microphone is selected.",

    // --- Misión salud ---
    "🏅 Logro desbloqueado: ": "🏅 Achievement unlocked: ",
    "Misión salud": "Health mission",
    "{n} de {total} tareas de hoy": "{n} of {total} tasks today",
    "Hecho": "Done",
};

// Párrafos con formato (etiquetas dentro): se reemplaza su HTML completo
const EN_HTML = {
    "guia-intro-2": 'Wearing the wearable every day builds your own baseline. That way a small change is caught in time, before it becomes an emergency. The colors tell you what to do: <b class="c-verde">green</b> keep your routine, <b class="c-amarillo">yellow</b> act and measure again, <b class="c-rojo">red</b> tell a crewmate; if it is serious or repeats, Earth is notified.',
};

// ===== Tablas de app.js en inglés =====
const MENSAJES_PRESION_EN = {
    "amarillo-alto": { pasa: "Your blood pressure is high.", hacer: "Rest for 5 minutes and measure again. Cut down on salt in your meals." },
    "rojo-alto": { pasa: "Your blood pressure is dangerously high.", hacer: "Sit down and avoid any effort. Tell a crewmate. An alert will be sent to Earth." },
    "amarillo-bajo": { pasa: "Your blood pressure is low. It's only a problem if you feel dizzy.", hacer: "Stand up slowly. Drink water. Measure again." },
    "rojo-bajo": { pasa: "Your blood pressure is very low.", hacer: "Lie down with your legs raised. Tell a crewmate. An alert will be sent to Earth." },
};

const DATOS_EN = {
    NOMBRES: {
        temperatura: { nombre: "Temperature" },
        frecuencia: { nombre: "Heart rate", unidad: "bpm" },
        sistolica: { nombre: "Systolic pressure" },
        diastolica: { nombre: "Diastolic pressure" },
        glucosa: { nombre: "Glucose" },
        sueno: { nombre: "Sleep" },
        animo: { nombre: "Mood" },
    },
    TEXTO_ESTADO: { verde: "Normal", amarillo: "Attention", rojo: "Alert", "sin-dato": "No data" },
    MENSAJES_PRESION: MENSAJES_PRESION_EN,
    // sistólica y diastólica usan MENSAJES_PRESION (se traduce aparte)
    MENSAJES: {
        temperatura: {
            "amarillo-alto": { pasa: "Your temperature is a bit high. It may be the start of a fever.", hacer: "Drink water, rest, avoid intense exercise. Measure again in 30 minutes." },
            "rojo-alto": { pasa: "You have a high fever.", hacer: "Tell a crewmate now. Rest somewhere cool. An alert will be sent to Earth." },
            "amarillo-bajo": { pasa: "Your temperature is somewhat low.", hacer: "Bundle up and measure again in 15 minutes. Check that you measured correctly." },
            "rojo-bajo": { pasa: "Your temperature is dangerously low (possible hypothermia).", hacer: "Tell a crewmate now. Bundle up. An alert will be sent to Earth." },
        },
        frecuencia: {
            "amarillo-alto": { pasa: "Your heart is beating faster than normal at rest. It may be due to stress, caffeine, fever or dehydration.", hacer: "Sit down, breathe slowly, drink water. Measure again in 10 minutes." },
            "rojo-alto": { pasa: "Your heart is beating very fast at rest.", hacer: "Sit or lie down. Tell a crewmate. An alert will be sent to Earth." },
            "amarillo-bajo": { pasa: "Your heart is beating slowly. In very fit people this can be normal.", hacer: "If you feel fine, measure again later. If you feel dizzy, tell a crewmate." },
            "rojo-bajo": { pasa: "Your heart is beating too slowly.", hacer: "Lie down. Tell a crewmate. An alert will be sent to Earth." },
        },
        glucosa: {
            "amarillo-bajo": { pasa: "Your glucose is low.", hacer: "Take 15 g of fast sugar (glucose, juice). Measure again in 15 minutes. Repeat if it's still low." },
            "rojo-bajo": { pasa: "Your glucose is very low. You may become confused soon.", hacer: "Take 15 g of fast sugar NOW. Ask a crewmate to stay with you. An alert will be sent to Earth." },
            "amarillo-alto": { pasa: "Your glucose is high.", hacer: "Drink water. Measure again in 2 hours." },
            "rojo-alto": { pasa: "Your glucose is very high.", hacer: "Tell a crewmate. An alert will be sent to Earth." },
        },
        sueno: {
            "amarillo-bajo": { pasa: "You slept less than recommended.", hacer: "Go to bed at your usual time tonight. Avoid screens for 30 minutes before." },
            "rojo-bajo": { pasa: "You slept very little. Your attention may be reduced.", hacer: "Avoid critical tasks if possible. Inform the crew." },
        },
        animo: {
            "amarillo-bajo": { pasa: "You're not feeling well today. It's normal to have days like this.", hacer: "Talk to a crewmate or to your family on the next call. Take a break." },
            "rojo-bajo": { pasa: "You're feeling very bad.", hacer: "Talk to a crewmate you trust today. The psychological support team on Earth will be notified." },
        },
    },
    HABITATS: {
        iss: { nombre: "space station", protocolo: "Doctors answer almost instantly. Be ready in case an evacuation is decided." },
        transito: { nombre: "Spacecraft in transit to Mars", protocolo: "There is no way back during the trip. Everything is treated on board: follow the protocol." },
        luna: { nombre: "Lunar base", protocolo: "Doctors answer almost instantly. A return to Earth would take days." },
        marte: { nombre: "Mars base", protocolo: "You are at maximum autonomy. Follow the protocol while the answer arrives." },
    },
    ETIQUETAS_CARAS: ["Very bad", "Bad", "Okay", "Good", "Very good"],
    WEARABLES: [
        { nombre: "Smartwatch (run3rs prototype)",
          nota: "Your watch prototype: optical pulse and electrocardiogram, blood oxygen, skin temperature, sleep and activity. Blood pressure is an estimate that must be calibrated with an arm cuff. Wrist screen: shows alerts and vibrates." },
        { nombre: "WHOOP MG band",
          nota: "Optical pulse, heart rate variability, breathing rate, blood oxygen, skin temperature, sleep and strain. Blood pressure is a daily estimate on waking (beta feature calibrated with a cuff). No screen: it vibrates and the data is shown in the app." },
        { nombre: "Bio-Monitor (Canadian Space Agency)",
          nota: "Smart shirt and headband from the Space Station. Measures pulse and electrocardiogram, blood pressure, breathing rate and volume, skin temperature, blood oxygen (headband) and physical activity. It does not measure sleep. No screen: the data is shown on the tablet and sent down to Earth." },
    ],
    GUIA: {
        temperatura: {
            como: "The temperature sensor in the suit (Astroskin) takes it continuously. To be reliable, the suit must fit snugly against the body.",
            normal: "36.0 to 37.9 °C. Fever from 38 °C.",
            espacio: "In flight, resting temperature rises about 1 °C over the weeks and the immune system weakens, so infections are more likely.",
        },
        frecuencia: {
            como: "The suit's electrocardiogram (Astroskin) calculates it beat by beat. It is assessed at rest: exercise raises it normally.",
            normal: "50 to 99 beats per minute at rest.",
            espacio: "In microgravity fluids shift toward the head and the heart adapts; fever, stress and dehydration speed it up.",
        },
        sistolica: {
            como: "The suit (Astroskin) estimates it from the pulse and electrocardiogram. It's the top number of your blood pressure. If it comes out of range, confirm it with an arm cuff.",
            normal: "90 to 129 mmHg.",
            espacio: "The main risk in space is LOW blood pressure when gravity changes: dizziness and fainting.",
        },
        diastolica: {
            como: "It's obtained together with the systolic. It's the bottom number of your blood pressure.",
            normal: "60 to 79 mmHg.",
            espacio: "Same as systolic: watch above all for drops, even more when arriving on the Moon or Mars.",
        },
        glucosa: {
            como: "A continuous glucose sensor sends it: a patch on the arm that measures every few minutes. If it reads low, confirm it with a finger-stick meter.",
            normal: "70 to 180 mg/dl.",
            espacio: "Irregular meals and the effort of spacewalks can lower it. Below 70: 15 g of fast carbs and measure again after 15 minutes.",
        },
        sueno: {
            como: "The suit (Astroskin) detects when you sleep from your breathing, pulse and movement, and adds up the hours in the last 24 hours.",
            normal: "7 hours or more.",
            espacio: "With no day or night, with noise and shifts, the body's rhythm gets out of sync and attention and reflexes drop.",
        },
        animo: {
            como: "It's the only thing a sensor doesn't measure: pick the face that best describes how you feel today. Be honest, nobody is grading you.",
            normal: "🙂 or better (3 out of 5 or more).",
            espacio: "Isolation and confinement affect mental health. Spotting it early lets you ask for support before it grows.",
        },
    },
    UNIDAD_HABLADA: {
        temperatura: "degrees", frecuencia: "beats per minute",
        sistolica: "millimeters of mercury", diastolica: "millimeters of mercury",
        glucosa: "milligrams per deciliter",
    },
    ETIQUETA_APP: { whoop: "View in the phone app", biomonitor: "View on the onboard tablet" },
    LEYENDA_ILUS: {
        whoop: "No screen: the light changes color and it vibrates. Optical sensors under the module; the clasp enables the electrocardiogram.",
        biomonitor: "Chest: heart · Bands: blood pressure and breathing · Side: skin temperature · Headband: oxygen · Hip: activity",
    },
    TAREAS: [
        { texto: "Wear the wearable and sync" },
        { texto: "Log your mood" },
        { texto: "Drink at least 2 liters of water" },
        { texto: "Resistance exercise (bones and muscle)" },
        { texto: "Sleep 7 hours or more" },
        { texto: "Respond to an alert (ask Nova)" },
    ],
    LOGROS: [
        { texto: "First sync" },
        { texto: "3 days in a row with the wearable" },
        { texto: "7 days in a row with the wearable" },
        { texto: "Full day (all tasks)" },
        { texto: "You responded to an alert" },
    ],
};

// ===== Traducir la página ya cargada (este script va al final del <body>) =====
(function traducirPagina() {
    document.documentElement.lang = IDIOMA;
    if (IDIOMA !== "en") return;
    document.title = tr(document.title);

    const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (caminante.nextNode()) nodos.push(caminante.currentNode);
    nodos.forEach(function (n) {
        if (n.parentElement && /^(SCRIPT|STYLE)$/.test(n.parentElement.tagName)) return;
        const clave = n.nodeValue.replace(/\s+/g, " ").trim();
        if (!clave || !Object.prototype.hasOwnProperty.call(EN_TEXTOS, clave)) return;
        const inicio = n.nodeValue.match(/^\s*/)[0], fin = n.nodeValue.match(/\s*$/)[0];
        n.nodeValue = inicio + EN_TEXTOS[clave] + fin;
    });

    document.querySelectorAll("[placeholder], [title], [aria-label]").forEach(function (el) {
        ["placeholder", "title", "aria-label"].forEach(function (attr) {
            const v = el.getAttribute(attr);
            if (v && Object.prototype.hasOwnProperty.call(EN_TEXTOS, v.trim())) el.setAttribute(attr, EN_TEXTOS[v.trim()]);
        });
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
        const html = EN_HTML[el.dataset.i18nHtml];
        if (html) el.innerHTML = html;
    });
})();
