export default async (req) => {
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Método no permitido" }),
            { status: 405, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json();
        const pregunta = body.pregunta?.toLowerCase() || "";
        const med = body.mediciones || {};
        const ent = body.entorno || {};

        const alertas = [];

        // Evaluar temperatura
        if (med.temperatura > 38) alertas.push(`Tu temperatura está elevada (${med.temperatura}°C). Esto puede indicar una respuesta inflamatoria o infección. En microgravedad, el sistema inmune se altera y las infecciones pueden progresar más rápido. Monitorea cada 2 horas y reporta si supera 38.5°C.`);
        if (med.temperatura