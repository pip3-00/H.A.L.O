
export default async (req) => {
    // Solo aceptar solicitudes POST
    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Método no permitido" }),
            {
                status: 405,
                headers: { "Content-Type": "application/json" }
            }
        );
    }

    try {
        // Obtener API Key desde Netlify
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error: "La API Key no está configurada en Netlify."
                }),
                { status: 500 }
            );
        }

        const body = await req.json();

        const pregunta = body.pregunta;
        const contexto = body.contexto;

        if (
            typeof pregunta !== "string" ||
            pregunta.trim().length === 0 ||
            pregunta.length > 1000
        ) {
            return new Response(
                JSON.stringify({ error: "Pregunta inválida." }),
                { status: 400 }
            );
        }

        if (
            !contexto ||
            typeof contexto !== "object" ||
            Array.isArray(contexto)
        ) {
            return new Response(
                JSON.stringify({ error: "Contexto inválido." }),
                { status: 400 }
            );
        }

        const prompt = `
Eres el asistente médico de a bordo de run3rs,
un sistema experimental de monitoreo de salud para astronautas.

Tu función es ayudar a interpretar las mediciones
y explicar las alertas del sistema.

DATOS DEL ASTRONAUTA:
${JSON.stringify(contexto, null, 2)}

PREGUNTA:
${pregunta}

INSTRUCCIONES:
- Responde en español.
- Sé claro, preciso y breve.
- Utiliza los datos proporcionados.
- Explica qué podría significar una alerta.
- No inventes mediciones ni diagnósticos.
- No afirmes que una medición confirma una enfermedad.
- Si hay una alerta roja, recomienda seguir el protocolo
  de emergencia y contactar al equipo médico.
- Nunca minimices síntomas graves.
- No sustituyas al personal médico.
- Si faltan datos, indícalo.
`;

        const respuesta = await fetch(
            "https://api.anthropic.com/v1/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-opus-5-5",
                    max_tokens: 700,
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            console.error("Error de Anthropic:", datos);

            return new Response(
                JSON.stringify({
                    error: "Claude no pudo procesar la consulta."
                }),
                { status: respuesta.status }
            );
        }

        const texto = datos.content
            ?.filter(bloque => bloque.type === "text")
            .map(bloque => bloque.text)
            .join("\n");

        return new Response(
            JSON.stringify({ respuesta: texto }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    } catch (error) {
        console.error("Error del asistente:", error);

        return new Response(
            JSON.stringify({
                error: "Error interno al consultar el asistente."
            }),
            { status: 500 }
        );
    }
};
