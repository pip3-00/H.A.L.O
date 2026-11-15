// netlify/functions/asistente.mjs
const MODELO = "gemini-2.5-flash-lite";
const TIMEOUT_MS = 8000;

const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json" }
    });

const RANGOS = {
    temperatura: { min: 36.1, max: 37.5, unidad: "°C", nombre: "temperatura" },
    frecuencia: { min: 60, max: 100, unidad: "bpm", nombre: "frecuencia cardíaca" },
    sistolica: { min: 90, max: 140, unidad: "mmHg", nombre: "presión sistólica" },
    diastolica: { min: 60, max: 90, unidad: "mmHg", nombre: "presión diastólica" },
    glucosa: { min: 70, max: 140, unidad: "mg/dL", nombre: "glucosa" },
    sueno: { min: 6, max: 9, unidad: "horas", nombre: "sueño" },
    animo: { min: 3, max: 5, unidad: "/5", nombre: "ánimo" }
};

// Respaldo local: si Gemini falla o tarda, la demo sigue funcionando.
function respuestaLocal(m) {
    const lineas = [];
    let leidos = 0;
    for (const [clave, r] of Object.entries(RANGOS)) {
        const v = m[clave];
        if (v === undefined || v === null || v === "") continue;
        leidos++;
        if (v < r.min) lineas.push(`${r.nombre}: ${v} ${r.unidad}, por debajo del rango (${r.min}-${r.max}).`);
        else if (v > r.max) lineas.push(`${r.nombre}: ${v} ${r.unidad}, por encima del rango (${r.min}-${r.max}).`);
    }
    if (leidos === 0) {
        return "No recibí mediciones. Registra tus indicadores antes de consultar.";
    }
    if (lineas.length === 0) {
        return "Tus indicadores medidos están dentro de los rangos de referencia.";
    }
}

function construirPrompt(pregunta, m, e) {
    return `Eres un asistente de salud a bordo para astronautas en misiones de larga duración.
El astronauta no es médico: responde en español, con lenguaje simple, en máximo 6 oraciones.
Indica (1) qué puede estar pasando, (2) qué hacer ahora, (3) cuándo avisar a Tierra.
No des diagnósticos definitivos. Si faltan datos, dilo.

Mediciones del astronauta: ${JSON.stringify(m)}
Rangos de referencia: ${JSON.stringify(RANGOS)}
Entorno (hábitat, día de misión, radiación acumulada, pérdida ósea estimada): ${JSON.stringify(e)}

Pregunta del astronauta: ${pregunta || "Evalúa mi estado de salud actual."}`;
}

export default async (req) => {
    if (req.method !== "POST") {
        return json({ error: "Método no permitido" }, 405);
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return json({ error: "Solicitud inválida." }, 400);
    }

    const pregunta = (body.pregunta || "").trim();
    const m = body.mediciones || {};
    const e = body.entorno || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return json({ respuesta: respuestaLocal(m), fuente: "local (sin API key)" });
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: ctrl.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: construirPrompt(pregunta, m, e) }] }],
                    generationConfig: {
                        maxOutputTokens: 400,
                        temperature: 0.4,
                        thinkingConfig: { thinkingBudget: 0 }
                    }
                })
            }
        );
        clearTimeout(timer);

        const datos = await resp.json();
        console.log("Gemini:", resp.status, JSON.stringify(datos).slice(0, 500));

        if (!resp.ok) {
            return json({
                respuesta: respuestaLocal(m),
                fuente: `local (Gemini ${resp.status}: ${datos.error?.message || "error"})`
            });
        }

        const texto = datos.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!texto) {
            return json({ respuesta: respuestaLocal(m), fuente: "local (respuesta vacía)" });
        }

        return json({ respuesta: texto, fuente: "gemini" });
    } catch (err) {
        clearTimeout(timer);
        console.error("Error del asistente:", err);
        const motivo = err.name === "AbortError" ? "timeout" : "error de red";
        return json({ respuesta: respuestaLocal(m), fuente: `local (${motivo})` });
    }
};
