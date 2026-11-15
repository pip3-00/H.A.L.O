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
        if (med.temperatura < 35.5) alertas.push(`Tu temperatura está baja (${med.temperatura}°C). Posible hipotermia leve. Verifica el sistema de climatización del hábitat y abrígate. Si persiste, contacta al equipo médico.`);

        // Evaluar frecuencia cardíaca
        if (med.frecuencia > 100) alertas.push(`Tu frecuencia cardíaca está elevada (${med.frecuencia} bpm). Puede ser por estrés, deshidratación o esfuerzo reciente. Hidrátate, descansa 15 minutos y vuelve a medir.`);
        if (med.frecuencia < 50) alertas.push(`Tu frecuencia cardíaca está baja (${med.frecuencia} bpm). Esto puede ser normal si tienes buena condición física, pero en el espacio puede indicar un problema cardiovascular. Reporta al equipo médico si sientes mareo o debilidad.`);

        // Evaluar presión arterial
        if (med.sistolica > 140 || med.diastolica > 90) alertas.push(`Tu presión arterial está alta (${med.sistolica}/${med.diastolica} mmHg). En el espacio, la redistribución de fluidos puede elevar la presión. Evita la sal, hidrátate y repite la medición en 30 minutos.`);
        if (med.sistolica < 90 || med.diastolica < 60) alertas.push(`Tu presión arterial está baja (${med.sistolica}/${med.diastolica} mmHg). Riesgo de síncope. Acuéstate con las piernas elevadas, hidrátate con solución electrolítica y mide de nuevo en 15 minutos.`);

        // Evaluar glucosa
        if (med.glucosa > 180) alertas.push(`Tu glucosa está alta (${med.glucosa} mg/dL). Esto puede deberse a estrés o alimentación reciente. Evita carbohidratos simples, hidrátate y vuelve a medir en 1 hora. Si persiste por encima de 200, contacta al equipo médico.`);
        if (med.glucosa < 70) alertas.push(`Tu glucosa está baja (${med.glucosa} mg/dL). Riesgo de hipoglucemia. Consume una ración de emergencia (jugo o gel de glucosa) inmediatamente. No realices actividades de riesgo hasta que se normalice.`);

        // Evaluar sueño
        if (med.sueno < 5) alertas.push(`Solo dormiste ${med.sueno} horas. La privación de sueño afecta la cognición y el sistema inmune. El protocolo recomienda 7-8 horas. Ajusta tu ciclo de luz artificial y evita pantallas 1 hora antes de dormir.`);

        // Evaluar ánimo
        if (med.animo <= 2) alertas.push(`Tu nivel de ánimo es bajo (${med.animo}/5). El aislamiento y confinamiento afectan la salud mental. Comunícate con tu equipo o familia, realiza ejercicio moderado y usa las técnicas de relajación del protocolo de bienestar.`);

        // Construir respuesta
        let respuesta = "";

        if (alertas.length > 0) {
            respuesta = `Según tus mediciones actuales, detecto ${alertas.length} punto(s) de atención:\n\n${alertas.join("\n\n")}`;
        } else {
            respuesta = "Tus mediciones están dentro de los rangos normales. Todos los indicadores se encuentran en estado verde. Sigue con tu rutina habitual y recuerda mantener hidratación adecuada y ejercicio regular.";
        }

        // Agregar contexto del hábitat
        if (ent.habitat) {
            respuesta += `\n\nNota: Te encuentras en ${ent.habitat}, día de misión ${ent.diaMision || "N/A"}.`;
            if (ent.habitat === "transit" || ent.habitat === "iss") {
                respuesta += " En microgravedad, recuerda realizar tus 2 horas diarias de ejercicio para mitigar la pérdida ósea.";
            }
        }

        if (pregunta.includes("radiación") || pregunta.includes("radiacion")) {
            respuesta += `\n\nSobre radiación: tu dosis acumulada es ${med.radiacionAcumulada || "no registrada"} mSv. El límite de carrera es 600 mSv. Mantente dentro de las zonas protegidas del hábitat durante eventos solares.`;
        }

        return new Response(
            JSON.stringify({ respuesta }),
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
