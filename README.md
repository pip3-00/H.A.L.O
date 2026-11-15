# run3rs · Monitor de salud para astronautas

Proyecto del **NASA Space Apps Challenge 2026** (INTEC, Santo Domingo).

Demo en vercel: lasana00-hdg6kaujl-vertex-code.vercel.app

En misiones largas, la radiación espacial, el aislamiento, la gravedad alterada y un entorno cerrado pueden provocar cambios inmunes, pérdida ósea, eventos cardiovasculares y problemas de salud conductual. Con Tierra a minutos de distancia, el astronauta es quien debe detectar esos cambios en sí mismo.

**run3rs** reúne indicadores de salud, los evalúa contra rangos de referencia y le dice al astronauta qué pasa, qué hacer y cuándo avisar a Tierra.

> Es un prototipo educativo con datos **simulados**. No es un dispositivo médico ni sustituye a un médico.

## Qué hace

- **Indicadores de salud:** temperatura, frecuencia cardíaca, presión sistólica y diastólica, glucosa, sueño y estado de ánimo.
- **Semáforo por indicador:** normal (verde), atención (amarillo) y alerta (rojo), con mensaje de qué pasa y qué hacer.
- **Hábitats:** Estación Espacial, nave en tránsito a Marte, base lunar y base en Marte. Cada uno cambia el cálculo de radiación acumulada y pérdida ósea estimada, y el retraso de comunicación con Tierra.
- **Aviso a Tierra:** ante una alerta aguda o una tendencia sostenida, se envía un aviso con cuenta atrás hasta la respuesta estimada, según el retraso del hábitat.
- **Gráficos:** una lectura cada 10 s, con el día de misión en el eje inferior solo cuando cambia.
- **Datos simulados:** botón "Iniciar datos simulados", con escenarios normal, fiebre, hipotensión e hipoglucemia. El día de misión avanza solo.
- **Voz:** la app habla solo cuando un valor sale de rango, y también anuncia el aviso a Tierra.
- **Asistente con IA (Gemini):** responde preguntas usando las mediciones y el historial de la sesión. Si Gemini falla, responde con reglas locales.
- **Reloj simulado:** botón "Ver simulación". Es un reloj que cambia de estado con cada lectura y vibra en atención y alerta (en dispositivos compatibles). El diseño está hecho en Figma.

## Tecnología

- Front-end en JavaScript, HTML y CSS sin frameworks (`public/`), con gráficos en `canvas`.
- Función serverless en Vercel (`api/asistente.js`) que hace de proxy hacia la API REST de Gemini, modelo `gemini-flash-lite-latest`, con tiempo límite de 8 s.
- Voz con la Web Speech API del navegador.

## Estructura

```
public/
  index.html
  style.css
  app.js
api/
  asistente.js     # proxy a Gemini (la clave nunca llega al navegador)
vercel.json        # { "outputDirectory": "public" }
```

## Ejecutar y desplegar

1. Importa el repositorio en Vercel (preset **Other**).
2. Agrega la variable de entorno `GEMINI_API_KEY` (clave de Google AI Studio).
3. Despliega. Sin la clave, la app sigue funcionando y el asistente responde con reglas locales.

Importante: abrir `index.html` directamente no activa el asistente, porque la función vive en `/api/asistente`.

## Límites conocidos

- Los datos son simulados. No hay conexión real con un Astroskin ni con un reloj físico.
- El historial vive en memoria: **recargar la página lo borra**.
- Los rangos de referencia son orientativos y se tomaron de las fuentes del proyecto (NASA Human Research Program y literatura de apoyo). No son criterio clínico.
- La voz depende de las voces en español que tenga el navegador, y necesita una interacción previa del usuario para activarse.

## Diseño

Pantallas del reloj (normal, atención, alerta y respuesta de Tierra) en Figma:
https://www.figma.com/design/AzauwuKe5sQx7IgEJiAdrC
