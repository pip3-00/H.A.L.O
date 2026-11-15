export default async (req) => {
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Método no permitido" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "La API Key de Gemini no está configurada." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const pregunta = body.pregunta;
        const mediciones = body.mediciones || {};
        const entorno = body.entorno || {};

        if (typeof pregunta !== "string" || pregunta.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: "Pregunta inválida." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const prompt = `Eres el asistente médico de a bordo de run3rs, un sistema de monitoreo de salud para astronautas en misiones de larga duración.

DATOS ACTUALES DEL ASTRONAUTA:
- Temperatura: ${mediciones.temperatura || "N/A"}°C
- Frecuencia cardíaca: ${mediciones.frecuencia || "N/A"} bpm
- Presión arterial: ${mediciones.sistolica || "N/A"}/${mediciones.diastolica || "N/A"} mmHg
- Glucosa: ${mediciones.glucosa || "N/A"} mg/dL
- Horas de sueño: ${mediciones.sueno || "N/A"}
- Estado de ánimo: ${mediciones.animo || "N/A"}/5
- Radiación acumulada: ${mediciones.radiacionAcumulada || "N/A"} mSv

ENTORNO:
- Hábitat: ${entorno.habitat || "N/A"}
- Día de misión: ${entorno.diaMision || "N/A"}
- Gravedad: ${entorno.gravedad || "N/A"}

PREGUNTA DEL ASTRONAUTA:
${pregunta}

INSTRUCCIONES:
- Responde en español, claro y breve (máximo 3 párrafos).
- Usa los datos proporcionados para dar una respuesta personalizada.
- Si hay valores fuera de rango, explica qué significa y qué hacer.
- No inventes datos ni diagnósticos definitivos.
- Si hay alerta grave, recomienda contactar al equipo médico en Tierra.`;

        const respuesta = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 500 }
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            console.error("Error de Gemini:", datos);
            return new Response(
                JSON.stringify({ error: datos.error?.message || "No se pudo procesar la consulta." }),
                { status: respuesta.status, headers: { "Content-Type": "application/json" } }
            );
        }

        const texto = datos.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta.";

        return new Response(
            JSON.stringify({ respuesta: texto }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error del asistente:", error);
        return new Response(
            JSON.stringify({ error: "Error interno al consultar el asistente." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};