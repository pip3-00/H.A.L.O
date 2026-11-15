// api/asistente.js  (Vercel Serverless Function)
const MODELO = "gemini-flash-lite-latest";
const TIMEOUT_MS = 8000;

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
    return "Indicadores fuera de rango:\n- " + lineas.join("\n- ") +
        "\nVuelve a medir en 30 minutos. Si persiste, activa el protocolo y avisa al equipo médico en Tierra.";
}

function construirPrompt(pregunta, m, e) {
    return `Eres un asistente de salud a bordo para astronautas en misiones de larga duración.
El astronauta no es médico: responde en español, con lenguaje simple, en máximo 6 oraciones.
Indica (1) qué puede estar pasando, (2) qué hacer ahora, (3) cuándo avisar a Tierra.
No des diagnósticos definitivos. Si faltan datos, dilo.

Mediciones del astronauta: ${JSON.stringify(m)}
Rangos de referencia: ${JSON.stringify(RANGOS)}
Entorno (hábitat, día de misión, radiación acumulada, pérdida ósea estimada): ${JSON.stringify({ ...e, historial: undefined })}
Historial de lecturas previas (de la más antigua a la más reciente, cada una con su día de misión y estado por indicador): ${JSON.stringify(e.historial || [])}

Basa tu respuesta en el historial: compara la lectura actual con las anteriores, señala tendencias (sube, baja, se mantiene) citando valores y días concretos. Si hay menos de 3 lecturas, dilo y no inventes tendencias.

Pregunta del astronauta: ${pregunta || "Evalúa mi estado de salud actual."}`;
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); }
        catch { return res.status(400).json({ error: "Solicitud inválida." }); }
    }
    body = body || {};

    const pregunta = (body.pregunta || "").trim();
    const ctx = body.contexto || {};
    const m = ctx.mediciones || body.mediciones || {};
    const e = {
        habitat: ctx.habitat,
        diaMision: ctx.diaMision,
        estadoGeneral: ctx.estadoGeneral,
        resultados: ctx.resultados,
        historial: ctx.historial || [],
        ...(ctx.entorno || body.entorno || {})
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({ respuesta: respuestaLocal(m), fuente: "local (sin API key)" });
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
                        temperature: 0.4
                    }
                })
            }
        );
        clearTimeout(timer);

        const datos = await resp.json();
        console.log("Gemini:", resp.status, JSON.stringify(datos).slice(0, 500));

        if (!resp.ok) {
            return res.status(200).json({
                respuesta: respuestaLocal(m),
                fuente: `local (Gemini ${resp.status}: ${datos.error?.message || "error"})`
            });
        }

        const texto = datos.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!texto) {
            return res.status(200).json({ respuesta: respuestaLocal(m), fuente: "local (respuesta vacía)" });
        }

        return res.status(200).json({ respuesta: texto, fuente: "gemini" });
    } catch (err) {
        clearTimeout(timer);
        console.error("Error del asistente:", err);
        const motivo = err.name === "AbortError" ? "timeout" : "error de red";
        return res.status(200).json({ respuesta: respuestaLocal(m), fuente: `local (${motivo})` });
    }
};