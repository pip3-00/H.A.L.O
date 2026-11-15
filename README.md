# run3rs · Monitor de salud para astronautas

Proyecto del **NASA Space Apps Challenge 2026** (INTEC, Santo Domingo).

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
- **H.A.L.O. (Health Assessment and Life-support Operations), asistente por voz (Gemini):** responde por voz sin tener que decir su nombre (modo conversación) o solo al decir "H.A.L.O." (modo nombre); "adiós" o "hasta luego" la deja en silencio. Responde preguntas usando las mediciones y el historial de la sesión. Si Gemini falla, responde con reglas locales.
- **Reloj simulado:** botón "Ver simulación". Es un reloj que cambia de estado con cada lectura y vibra en atención y alerta (en dispositivos compatibles). El diseño está hecho en Figma.

## Tecnología

- **Python (lógica):** `api/evaluar.py` calcula el semáforo de cada indicador, el estado general y el entorno (radiación, pérdida ósea, gravedad). `api/voz.py` genera la voz de H.A.L.O. con Gemini TTS (voz «Kore»); si no está disponible se usa la voz del navegador. `api/nova.py` es el proxy hacia Gemini (`gemini-flash-lite-latest`, límite de 8 s) con respaldo por reglas.
- **JavaScript (interfaz):** `public/app.js` pinta resultados, gráficos en `canvas`, voz (Web Speech API), el reloj y la línea base personal. Si el servidor no responde, usa una copia local del mismo cálculo para que la app no se detenga.

## Estructura

```
public/
  index.html
  style.css
  app.js
api/
  evaluar.py         # lógica de salud (Python)
  nova.py            # asistente H.A.L.O.: proxy a Gemini (Python)
  voz.py             # voz de H.A.L.O.: Gemini TTS -> WAV (Python)
  asistente.js       # versión anterior del proxy, queda de respaldo
servidor_local.py    # para probar en tu computadora
vercel.json          # { "outputDirectory": "public" }
```

## Ejecutar y desplegar

**En Vercel:** importa el repositorio (preset **Other**), agrega la variable de entorno `GEMINI_API_KEY` y despliega. Vercel detecta solo las funciones Python de `api/`.

**En tu computadora:** ejecuta `python servidor_local.py` y abre `http://localhost:8000`. No uses Live Server: no ejecuta las funciones de `api/`.

Sin la clave de Gemini la app funciona igual y H.A.L.O. responde con reglas.

## Límites conocidos

- Los datos son simulados. No hay conexión real con un Astroskin ni con un reloj físico.
- El historial vive en memoria: **recargar la página lo borra**.
- Los rangos de referencia son orientativos y se tomaron de las fuentes del proyecto (NASA Human Research Program y literatura de apoyo). No son criterio clínico.
- La voz depende de las voces en español que tenga el navegador, y necesita una interacción previa del usuario para activarse.

## Diseño

Pantallas del reloj (normal, atención, alerta y respuesta de Tierra) en Figma:
https://www.figma.com/design/AzauwuKe5sQx7IgEJiAdrC
