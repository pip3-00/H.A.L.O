# Fuentes de datos · H.A.L.O.

Referencias usadas para los umbrales del semáforo, el modelo de hábitats y los mensajes de la app.
Los archivos `umbrales.json`, `habitats.json` y `wearables.json` de esta carpeta son una copia de
referencia; la app usa los valores de `api/evaluar.py` (Python) y `public/app.js`.

## Radiación y hábitats
- NASA OCHMO — *Design for Ionizing Radiation Protection* (NASA-STD-3001): límite de carrera < 600 mSv, eventos solares < 250 mSv. https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- Simonsen, Zawaski y Weeks (NASA HQ / JSC) — *Moon 2 Mars Space Radiation Protection*: dosis en la ISS. https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf
- Zeitlin et al. 2013, *Science* — Curiosity RAD en crucero: 1.8 mSv/día. https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-radiation-exposure-associated-trip-mars
- Hassler et al. 2014, *Science* 343 — Curiosity RAD en la superficie de Marte: ~0.64 mSv/día. https://ntrs.nasa.gov/citations/20180007641

## Gravedad y huesos
- NASA HRP — *Hazard: Gravity Fields*. https://www.nasa.gov/hrp/hazard-gravity-fields
- NASA HRP — *Risk of Spaceflight-Induced Bone Changes*. https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
- Sibonga et al. (NASA, 2017) — *Risk of Early Onset Osteoporosis Due to Spaceflight*. https://ntrs.nasa.gov/citations/20170004598

## Signos vitales
- ADA — *Standards of Care in Diabetes 2024*, §6.12: protocolo de hipoglucemia (regla 15 g / 15 min).
- AHA — frecuencia cardíaca en reposo y medición de la presión arterial en casa.
- MedlinePlus — medición de la temperatura corporal; criterios de hipotensión.
- CDC — horas de sueño recomendadas en adultos.
- CORDIS — ARTHEROSPACE: desacondicionamiento cardiovascular al volver a la gravedad.

## Wearables
- WHOOP MG (2025): ECG, SpO2, temperatura de la piel, frecuencia respiratoria y estimación de presión con calibración.
- Apple Watch Series 11: ECG, SpO2, temperatura de la piel; avisos de hipertensión (sin lectura directa de presión).
- Agencia Espacial Canadiense — Bio-Monitor (Astroskin, Carré Technologies) en la ISS.
