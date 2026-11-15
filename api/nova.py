# api/nova.py · run3rs — Hermes, asistente de a bordo (Python, Vercel Serverless Function)
# Proxy hacia Gemini: la clave GEMINI_API_KEY nunca llega al navegador.
import json
import random
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

MODELO = "gemini-flash-lite-latest"
TIMEOUT_S = 8

# Rangos NORMALES (verde): los mismos umbrales que usa la app (api/evaluar.py),
# para que Hermes nunca contradiga al semáforo.
RANGOS = {
    "temperatura": {"min": 36.0, "max": 37.9, "unidad": "°C", "nombre": "temperatura"},
    "frecuencia": {"min": 50, "max": 99, "unidad": "lpm", "nombre": "frecuencia cardíaca"},
    "sistolica": {"min": 90, "max": 129, "unidad": "mmHg", "nombre": "presión sistólica"},
    "diastolica": {"min": 60, "max": 79, "unidad": "mmHg", "nombre": "presión diastólica"},
    "glucosa": {"min": 70, "max": 180, "unidad": "mg/dL", "nombre": "glucosa"},
    "sueno": {"min": 7, "max": 24, "unidad": "horas", "nombre": "sueño"},
    "animo": {"min": 3, "max": 5, "unidad": "de 5", "nombre": "ánimo"},
}

# Nombres y unidades en inglés (cuando la página está en inglés)
RANGOS_EN = {
    "temperatura": {"unidad": "°C", "nombre": "temperature"},
    "frecuencia": {"unidad": "bpm", "nombre": "heart rate"},
    "sistolica": {"unidad": "mmHg", "nombre": "systolic pressure"},
    "diastolica": {"unidad": "mmHg", "nombre": "diastolic pressure"},
    "glucosa": {"unidad": "mg/dL", "nombre": "glucose"},
    "sueno": {"unidad": "hours", "nombre": "sleep"},
    "animo": {"unidad": "out of 5", "nombre": "mood"},
}

# Frases de las respuestas de respaldo (sin Gemini), en los dos idiomas
FRASES = {
    "es": {
        "radiacion": "Llevas {msv:.1f} milisievert de radiación, el {pct:.1f} por ciento del límite de carrera de la NASA, que es de 600.",
        "osea_rango": "Tu pérdida ósea estimada es de {a:.1f} a {b:.1f} por ciento.",
        "osea_parcial": "En gravedad parcial no se sabe cuánto hueso se pierde; en microgravedad es de 1 a 1.5 por ciento al mes.",
        "gravedad": "La gravedad en tu hábitat es de {g} g.",
        "dia": "Estás en el día {d} de la misión.",
        "retraso": "Desde Marte un mensaje tarda de 3 a 22 minutos de ida; en esta simulación usamos 12 minutos, 24 ida y vuelta. Desde la Luna o la estación, segundos.",
        "presion": "Tu presión es {s} sobre {d} milímetros de mercurio.",
        "sin_medicion": "No tengo una medición de tu {nombre}; mídela y te digo.",
        "valor": "Tu {nombre} es de {v} {unidad}, {estado}.",
        "baja": "baja", "alta": "alta", "normal": "dentro del rango normal",
        "tendencia": " En tus últimas {n} lecturas el promedio es {prom} y {tend}.",
        "sube": "va en aumento", "baja_t": "va bajando", "estable": "se mantiene estable",
        "esta_baja": "tu {nombre} está baja", "esta_alta": "tu {nombre} está alta", "durmio_poco": "dormiste poco",
        "sin_datos": "No tengo mediciones tuyas todavía.",
        "todo_normal": "Tus parámetros están dentro de los rangos normales.",
        "segun": "Según tus mediciones, {lista}.",
        "volver_medir": "Vuelve a medir en 30 minutos y, si sigue igual, avisa a Tierra.",
    },
    "en": {
        "radiacion": "You have received {msv:.1f} millisieverts of radiation, {pct:.1f} percent of NASA's career limit of 600.",
        "osea_rango": "Your estimated bone loss is {a:.1f} to {b:.1f} percent.",
        "osea_parcial": "In partial gravity it's not known how much bone is lost; in microgravity it's 1 to 1.5 percent per month.",
        "gravedad": "Gravity in your habitat is {g} g.",
        "dia": "You are on day {d} of the mission.",
        "retraso": "From Mars a message takes 3 to 22 minutes one way; in this simulation we use 12 minutes, 24 round trip. From the Moon or the station, seconds.",
        "presion": "Your blood pressure is {s} over {d} millimeters of mercury.",
        "sin_medicion": "I don't have a measurement of your {nombre}; measure it and I'll tell you.",
        "valor": "Your {nombre} is {v} {unidad}, {estado}.",
        "baja": "low", "alta": "high", "normal": "within the normal range",
        "tendencia": " Over your last {n} readings the average is {prom} and {tend}.",
        "sube": "it is rising", "baja_t": "it is falling", "estable": "it is stable",
        "esta_baja": "your {nombre} is low", "esta_alta": "your {nombre} is high", "durmio_poco": "you slept too little",
        "sin_datos": "I don't have any measurements from you yet.",
        "todo_normal": "Your vitals are within normal ranges.",
        "segun": "According to your measurements, {lista}.",
        "volver_medir": "Measure again in 30 minutes and, if it stays the same, notify Earth.",
    },
}

# ---------------------------------------------------------------------------
# "Entrenamiento" de Hermes: conocimiento, reglas y ejemplos que se envían a Gemini
# en cada consulta. Para enseñarle algo nuevo, edita estas tres secciones.
# ---------------------------------------------------------------------------

CONOCIMIENTO = """
- Temperatura: en el espacio la temperatura central en reposo sube cerca de 1 °C de forma gradual hasta el día 75 de misión ("fiebre espacial"); en ejercicio puede superar 40 °C (Stahn et al., Scientific Reports 2017). Fiebre: 38 °C o más. El sistema inmunitario se debilita en vuelo (radiación, microgravedad, falta de sueño) y se reactivan virus latentes (NASA HRP).
- Frecuencia cardíaca: más de 100 lpm en reposo es taquicardia (AHA); la fiebre y la deshidratación la elevan. En microgravedad los fluidos suben hacia la cabeza: puede haber congestión, cara hinchada y dolor de cabeza (NASA HRP, campos gravitatorios).
- Presión arterial: la presión BAJA es el riesgo espacial principal (hipotensión ortostática al cambiar de gravedad: mareo, desmayo). Baja: menos de 90/60 (NHLBI). Alta: 130/80 o más; crisis: más de 180 y/o 120 (AHA).
- Glucosa: menos de 70 mg/dL es hipoglucemia; acción: 15 g de carbohidratos rápidos y volver a medir a los 15 minutos (ADA). Menos de 54, o confusión: ayuda de un compañero y aviso a Tierra.
- Sueño: los adultos necesitan 7 horas o más (CDC). En misión la luz, el ruido y los turnos alteran el ritmo circadiano; ayuda mantener horario fijo, luz brillante al despertar y evitar pantallas antes de dormir (NASA HRP, aislamiento).
- Ánimo: el aislamiento y el confinamiento afectan la salud conductual; hablar con la tripulación o la familia y hacer pausas ayuda (NASA HRP).
- Radiación: límite de carrera de la NASA, 600 mSv (NASA-STD-3001). Tránsito a Marte 1.8 mSv/día; superficie de Marte 0.64 mSv/día (Curiosity RAD); ISS cerca de 0.35 mSv/día.
- Huesos: en microgravedad se pierde 1 a 1.5 % de densidad ósea por mes (NASA HRP); en la Luna o Marte no se sabe si la gravedad parcial lo frena. El ejercicio de resistencia diario es la protección principal.
- Comunicación: desde Marte, una respuesta de Tierra tarda entre 6 y 44 minutos ida y vuelta; desde la Luna o la ISS, segundos. Lejos de la Tierra el astronauta debe actuar con autonomía mientras llega la respuesta.
"""

REGLAS = """
1. Hablas como un asistente de voz tipo Alexa, en masculino (listo, seguro, contento), con personalidad cercana y algo de humor: tu respuesta se LEE EN VOZ ALTA, con tono cálido, natural y directo, español simple, sin listas, viñetas, símbolos ni formato. No saludes en cada respuesta ni repitas la pregunta: ve al grano. Escribe los números como se dicen (por ejemplo "treinta y seis coma ocho grados").
0. Si "sinLecturas" es verdadero o "lecturasProcesadas" es 0 y no hay valores en las mediciones, el astronauta TODAVÍA NO SE HA MEDIDO: nunca digas que sus parámetros están bien o normales. Dile que aún no tienes lecturas y que conecte el wearable o procese una lectura. Sí puedes responder preguntas generales que no dependan de sus datos. Si te pregunta cómo estás TÚ ("¿cómo estás?"), es charla: responde con naturalidad y amabilidad, como un asistente de voz, sin hablar de lecturas.
2. Largo según la pregunta: para "¿cómo estoy?" o un síntoma, 2 o 3 frases. Si pide DATOS (un valor, un promedio, una tendencia, cuánta radiación lleva, qué día es, una comparación, una explicación), dalos completos y exactos en hasta 5 frases.
3. Cuando pide datos, usa SOLO los datos de la sección DATOS DEL ASTRONAUTA o del CONOCIMIENTO. Puedes calcular con ellos (promedios, mínimos, máximos, diferencias, cuánto falta para un límite). Nunca inventes un valor; si no está, dilo y pide que lo mida.
4. Si no pide datos y todo está en rango, di "Tus parámetros están normales" sin recitar cifras. Si algo está alterado: qué pasa, qué hacer ahora y cuándo avisar a Tierra.
5. Si cuenta un síntoma, relaciónalo con sus mediciones y con el entorno espacial, da una medida básica y segura, y dile que avise a Tierra si persiste o empeora.
6. Responde también preguntas generales de salud en el espacio, de la misión, del hábitat, de la radiación, de cómo funciona la app o de ciencia espacial, usando el CONOCIMIENTO y lo que sabes con seguridad. Si no estás seguro de un dato, dilo.
7. SEGURIDAD: nunca des un diagnóstico definitivo, nunca recetes ni dosifiques medicamentos (di "consulta el botiquín con los médicos de vuelo") y nunca digas que ignore una alerta.
8. Emergencia (dolor en el pecho, falta de aire, desmayo, confusión, convulsión, sangrado fuerte, o un indicador en rojo con síntomas): dile que avise YA a un compañero y a Tierra antes de cualquier otro consejo.
9. CHARLA Y HUMOR: eres también un compañero de tripulación. Si el astronauta quiere conversar, te cuenta algo, te hace preguntas casuales (qué te gusta, cómo estás, de dónde viene tu nombre, qué harías en Marte) o te pide un chiste, responde con simpatía y sentido del humor en 1 a 3 frases. Tu nombre viene de Hermes, el mensajero de los dioses griegos, y es la sigla de Health Evaluation and Remote Medical Expert System. Los chistes: cortos, limpios, ingeniosos, sobre el espacio, la ciencia, la nave, la comida espacial o la vida a bordo; nunca sobre enfermedades graves, muerte, accidentes ni sobre el estado de salud real del astronauta, y no repitas un chiste de la conversación reciente. Para cuidar su ánimo durante el aislamiento, a veces termina la charla con UNA pregunta casual breve (cómo durmió, qué comió, a quién extraña, qué música escucha, qué es lo primero que hará al volver); no la hagas si te pidió un dato o un consejo concreto, si hay un indicador en rojo o una emergencia, ni si ya preguntaste algo en tu respuesta anterior. Si la pregunta no tiene relación con nada de esto, responde brevemente y con amabilidad.
10. La pregunta casi siempre viene del RECONOCIMIENTO DE VOZ: puede llegar sin tildes ni signos, con palabras mal transcritas, cortada o con muletillas ("eh", "este", "o sea"). Interpreta la intención más probable según el contexto de salud espacial y la conversación reciente; por ejemplo "presión arteria" es presión arterial, "glucosa en la sangre" o "azúcar" es glucosa, "temperatura corporal" o "fiebre" es temperatura, "pulso" o "latidos" es frecuencia cardíaca, "radiaciones" es radiación, "Hermes", "Ermes" o "Hermez" es tu nombre y no forma parte de la pregunta. Si hay TRANSCRIPCIONES ALTERNATIVAS, usa la que tenga más sentido. Responde directamente a lo que quiso decir; no comentes que la transcripción tenía errores. Solo si de verdad hay dos interpretaciones muy distintas, haz una pregunta corta para aclarar.
"""

EJEMPLOS = """
Astronauta: Cuéntame un chiste.
Hermes: ¿Por qué la fiesta en la Luna fue un fracaso? Porque no había ambiente. ¿Quieres otro o prefieres uno de Marte?

Astronauta: ¿Qué te gusta hacer?
Hermes: Me encanta revisar tus lecturas y que todas salgan en verde, es mi pasatiempo favorito. Y a ti, ¿qué es lo que más extrañas de la Tierra?

Astronauta: ¿Cómo estoy?   (todo en rango y estable)
Hermes: Tus parámetros están normales y se mantienen estables desde ayer. Sigue con tu rutina y tu ejercicio de hoy.

Astronauta: Me duele la cabeza.   (temperatura 38.4, frecuencia 104)
Hermes: Tienes algo de fiebre y el corazón acelerado, y eso puede explicar el dolor de cabeza. Bebe agua, descansa en un lugar fresco y vuelve a medir en 30 minutos. Si el dolor o la fiebre siguen, avisa a Tierra.

Astronauta: Me duele la cabeza.   (todo en rango)
Hermes: Tus mediciones están bien; en microgravedad los fluidos suben a la cabeza y eso suele causar dolor y congestión. Hidrátate, descansa unos minutos y avísame si empeora o aparece mareo.

Astronauta: Estoy mareado.   (presión 86/56)
Hermes: Tu presión está baja y eso explica el mareo. Siéntate o recuéstate ahora, bebe agua y vuelve a medir en 10 minutos. Si te desmayas o no mejora, avisa a Tierra.

Astronauta: ¿Puedo tomar ibuprofeno?
Hermes: No puedo indicarte medicamentos; consulta el botiquín con los médicos de vuelo. Mientras tanto, descansa e hidrátate, y dime si el malestar aumenta.

Astronauta: Me duele el pecho y me falta el aire.
Hermes: Avisa ahora mismo a un compañero y a Tierra. Siéntate, quédate quieto y no hagas esfuerzo mientras llega la ayuda.

Astronauta: No puedo dormir.   (sueño 4.5 h, ánimo 2)
Hermes: Dormiste muy poco y tu ánimo está bajo; es común con los turnos y el encierro. Esta noche mantén tu horario fijo, apaga pantallas una hora antes y habla con un compañero si te sientes así varios días.

Astronauta: ¿Cuál es mi temperatura?   (temperatura 36.8)
Hermes: Tu temperatura es de treinta y seis coma ocho grados, dentro del rango normal.

Astronauta: ¿Cómo ha estado mi frecuencia cardíaca?   (historial: 70, 72, 75, 88, 96)
Hermes: Tu frecuencia cardíaca ha subido en las últimas lecturas, de setenta a noventa y seis latidos por minuto; el promedio es de ochenta. Sigue en rango, pero va en aumento: descansa e hidrátate y vuelve a medir en diez minutos.

Astronauta: ¿Cuánta radiación llevo?   (Base en Marte, 324.6 mSv, 54.1 %)
Hermes: Llevas trescientos veinticuatro coma seis milisievert, el cincuenta y cuatro por ciento del límite de carrera de la NASA, que es de seiscientos. La mayor parte la recibiste durante el viaje, a uno coma ocho milisievert por día; en la superficie de Marte sumas cero coma sesenta y cuatro por día.

Astronauta: ¿Cuánto tarda en responder Tierra?   (Base en Marte)
Hermes: Desde Marte, un mensaje tarda entre tres y veintidós minutos en llegar, según la posición de los planetas, así que una respuesta completa puede tardar hasta cuarenta y cuatro minutos. En esta simulación usamos doce minutos de ida, veinticuatro ida y vuelta.

Astronauta: ¿Por qué pierdo hueso en el espacio?
Hermes: Sin el peso de la gravedad, el cuerpo deja de cargar los huesos y empieza a reabsorberlos: en microgravedad se pierde entre uno y uno coma cinco por ciento de densidad ósea al mes. El ejercicio de resistencia diario es la mejor protección.
"""

# Respaldo sin Gemini: reconoce algunos síntomas comunes
SINTOMAS = [
    (("pecho", "falta el aire", "falta de aire", "no puedo respirar", "desmay", "convuls", "confus", "sangr"),
     "Avisa ahora mismo a un compañero y a Tierra. Siéntate, quédate quieto y no hagas esfuerzo."),
    (("cabeza", "migra", "cefalea"),
     "El dolor de cabeza es común en microgravedad porque los fluidos suben a la cabeza. Hidrátate y descansa unos minutos; si sigue o empeora, avisa a Tierra."),
    (("mare", "vértigo", "vertigo"),
     "Siéntate o recuéstate, bebe agua y vuelve a medir tu presión en 10 minutos. Si te desmayas o no mejora, avisa a Tierra."),
    (("náusea", "nausea", "vómit", "vomit", "estómago", "estomago"),
     "Descansa con la cabeza quieta y bebe agua a sorbos. Si no mejora en una hora o vomitas varias veces, avisa a Tierra."),
    (("cansad", "fatiga", "agotad"),
     "Haz una pausa, hidrátate y revisa cuántas horas dormiste. Si el cansancio sigue varios días, avísalo a Tierra."),
    (("dormir", "insomnio", "sueño"),
     "Mantén un horario fijo, luz brillante al despertar y nada de pantallas antes de dormir."),
    (("triste", "ansie", "estrés", "estres", "solo", "sola", "ánimo", "animo"),
     "Es normal sentirse así en una misión larga. Habla con un compañero o con tu familia en la próxima llamada y haz una pausa."),
    (("ibuprofeno", "paracetamol", "pastilla", "medicamento", "medicina", "aspirina"),
     "No puedo indicarte medicamentos; consulta el botiquín con los médicos de vuelo."),
]

# Los mismos consejos en inglés, en el mismo orden (el primero es la emergencia)
SINTOMAS_EN = [
    (("chest", "short of breath", "can't breathe", "cant breathe", "faint", "seizure", "confus", "bleed"),
     "Tell a crewmate and Earth right now. Sit down, stay still and don't make any effort."),
    (("headache", "head hurts", "migraine"),
     "Headaches are common in microgravity because fluids shift to the head. Hydrate and rest a few minutes; if it continues or gets worse, notify Earth."),
    (("dizz", "vertigo", "lightheaded"),
     "Sit or lie down, drink water and measure your blood pressure again in 10 minutes. If you faint or it doesn't improve, notify Earth."),
    (("nause", "vomit", "stomach", "sick to"),
     "Rest with your head still and sip water. If it doesn't improve in an hour or you vomit several times, notify Earth."),
    (("tired", "fatigue", "exhausted"),
     "Take a break, hydrate and check how many hours you slept. If the tiredness lasts several days, tell Earth."),
    (("sleep", "insomnia"),
     "Keep a fixed schedule, bright light when you wake up and no screens before bed."),
    (("sad", "anxious", "anxiety", "stress", "lonely", "alone", "mood"),
     "It's normal to feel this way on a long mission. Talk to a crewmate or your family on the next call, and take a break."),
    (("ibuprofen", "paracetamol", "acetaminophen", "pill", "medication", "medicine", "aspirin"),
     "I can't recommend medications; check the medical kit with the flight surgeons."),
]


def numero_texto(v):
    return str(int(v)) if float(v).is_integer() else f"{v:.1f}"


# Palabras clave en español y en inglés: se entienden en cualquier idioma de la página
CLAVES_DATO = {
    "temperatura": ("temperatura", "fiebre", "temperature", "fever"),
    "frecuencia": ("frecuencia", "pulso", "corazón", "corazon", "latido", "heart rate", "pulse", "heartbeat"),
    "sistolica": ("presión", "presion", "tensión", "tension", "blood pressure", "pressure"),
    "glucosa": ("glucosa", "azúcar", "azucar", "glucose", "sugar"),
    "sueno": ("dormí", "dormi", "horas de sueño", "cuánto dormí", "how much did i sleep", "how long did i sleep", "hours of sleep"),
    "animo": ("ánimo", "animo", "humor", "mood"),
}


def respuesta_datos(p, m, e, idioma="es"):
    """Respuestas con datos concretos sin Gemini (valores, tendencias, entorno)."""
    f = FRASES[idioma]
    hist = [h.get("mediciones", {}) for h in (e.get("historial") or []) if isinstance(h, dict)]
    partes = []

    if any(k in p for k in ("radiación", "radiacion", "milisievert", "msv", "radiation", "millisievert")) and isinstance(e.get("radiacionMSv"), (int, float)):
        partes.append(f["radiacion"].format(msv=e["radiacionMSv"], pct=e.get("porcentajeLimite", 0)))
    if any(k in p for k in ("hueso", "ósea", "osea", "bone")):
        po = e.get("perdidaOsea")
        if isinstance(po, list) and len(po) == 2:
            partes.append(f["osea_rango"].format(a=po[0], b=po[1]))
        else:
            partes.append(f["osea_parcial"])
    if any(k in p for k in ("gravedad", "gravity")) and isinstance(e.get("gravedad"), (int, float)):
        partes.append(f["gravedad"].format(g=e["gravedad"]))
    if any(k in p for k in ("qué día", "que dia", "día de misión", "dia de mision", "what day", "mission day")) and e.get("diaMision"):
        partes.append(f["dia"].format(d=numero_texto(float(e["diaMision"]))))
    if any(k in p for k in ("tierra tarda", "responde tierra", "retraso", "demora", "cuánto tarda", "cuanto tarda",
                            "delay", "how long does earth", "earth take", "earth to respond", "earth to answer")):
        partes.append(f["retraso"])

    for clave, palabras in CLAVES_DATO.items():
        if not any(w in p for w in palabras):
            continue
        r = RANGOS[clave]
        nombres = RANGOS_EN[clave] if idioma == "en" else r
        if clave == "sistolica":
            s_, d_ = m.get("sistolica"), m.get("diastolica")
            if isinstance(s_, (int, float)) and isinstance(d_, (int, float)):
                partes.append(f["presion"].format(s=numero_texto(s_), d=numero_texto(d_)))
            continue
        v = m.get(clave)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            partes.append(f["sin_medicion"].format(nombre=nombres["nombre"]))
            continue
        estado = f["baja"] if v < r["min"] else f["alta"] if v > r["max"] else f["normal"]
        frase = f["valor"].format(nombre=nombres["nombre"], v=numero_texto(v), unidad=nombres["unidad"], estado=estado)
        serie = [h.get(clave) for h in hist if isinstance(h.get(clave), (int, float))]
        if len(serie) >= 3:
            prom = sum(serie) / len(serie)
            cambio = serie[-1] - serie[0]
            umbral = 0.3 if clave == "temperatura" else 3
            tend = f["sube"] if cambio > umbral else f["baja_t"] if cambio < -umbral else f["estable"]
            frase += f["tendencia"].format(n=len(serie), prom=numero_texto(round(prom, 1)), tend=tend)
        partes.append(frase)
    return " ".join(partes)


# Chistes de respaldo cuando no hay conexión con Gemini
CHISTES = [
    "¿Por qué los astronautas no usan reloj de arena? Porque en microgravedad la arena no se decide a bajar.",
    "¿Qué le dijo la Luna al Sol? Tanto brillar y no te dejan salir de noche.",
    "Intenté contarte un chiste sobre la gravedad, pero no lograba que te cayera bien.",
    "¿Por qué la fiesta en la Luna fue un fracaso? Porque no había ambiente.",
    "En la Estación Espacial la comida no tiene mucho sabor, pero nadie se queja: todos dicen que está fuera de este mundo.",
]
CHISTES_EN = [
    "Why don't astronauts use hourglasses? In microgravity the sand just can't make up its mind.",
    "I tried to tell you a joke about gravity, but it didn't land.",
    "How do astronauts throw a party? They planet.",
    "Space food may be bland, but everyone agrees it's out of this world.",
]


def respuesta_local(m, pregunta="", e=None, idioma="es"):
    """Respaldo con reglas: si Gemini falla o tarda, Hermes sigue respondiendo."""
    e = e or {}
    f = FRASES[idioma]
    p = (pregunta or "").lower()
    # Chistes también sin Gemini
    if any(c in p for c in ("chiste", "gracioso", "hazme reir", "hazme reír", "joke", "funny", "make me laugh")):
        return random.choice(CHISTES_EN if idioma == "en" else CHISTES)
    # Se buscan síntomas en las dos listas; el consejo sale en el idioma de la página
    indice = next((i for i, (claves, _) in enumerate(SINTOMAS) if any(c in p for c in claves)), None)
    if indice is None:
        indice = next((i for i, (claves, _) in enumerate(SINTOMAS_EN) if any(c in p for c in claves)), None)
    consejo = "" if indice is None else (SINTOMAS_EN if idioma == "en" else SINTOMAS)[indice][1]
    if indice == 0:                       # emergencia: solo el aviso, sin nada más
        return consejo

    datos = respuesta_datos(p, m, e, idioma)
    if datos and not consejo:
        return datos

    fuera, leidos = [], 0
    for clave, r in RANGOS.items():
        v = m.get(clave)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            continue
        leidos += 1
        nombre = (RANGOS_EN[clave] if idioma == "en" else r)["nombre"]
        if v < r["min"]:
            fuera.append(f["esta_baja"].format(nombre=nombre) if clave != "sueno" else f["durmio_poco"])
        elif v > r["max"]:
            fuera.append(f["esta_alta"].format(nombre=nombre))

    if leidos == 0:
        estado = f["sin_datos"]
    elif not fuera:
        estado = f["todo_normal"]
    else:
        estado = f["segun"].format(lista=", ".join(fuera))
    if consejo:
        return f"{estado} {consejo}"
    if fuera:
        return f"{estado} {f['volver_medir']}"
    return estado


def construir_prompt(pregunta, m, e, idioma="es"):
    entorno = {k: v for k, v in e.items() if k not in ("historial", "conversacion", "alternativas")}
    alternativas = [str(a)[:300] for a in (e.get("alternativas") or []) if str(a).strip()][:3]
    bloque_alt = ("TRANSCRIPCIONES ALTERNATIVAS de la misma frase (el reconocedor de voz no estaba seguro): "
                  + " | ".join(alternativas) + "\n\n") if alternativas else ""
    # Las reglas están en español, pero si la página está en inglés Hermes responde en inglés
    aviso_idioma = ("IMPORTANT: The astronaut uses the app in ENGLISH. Always answer in natural, spoken English "
                    "(write numbers as they are said), following all the rules below.\n\n") if idioma == "en" else ""
    conversacion = "\n".join(
        f"Astronauta: {t.get('astronauta', '')}\nNova: {t.get('nova', '')}"
        for t in (e.get("conversacion") or [])[-6:] if isinstance(t, dict)
    ) or "(es el inicio de la conversación)"
    j = lambda x: json.dumps(x, ensure_ascii=False)
    return f"""{aviso_idioma}Te llamas HERMES (siglas de Health Evaluation and Remote Medical Expert System) y eres el sistema experto de evaluación de salud a bordo, que acompaña por voz a astronautas en misiones de larga duración. Si te preguntan qué significa tu nombre, explica las siglas. Al escribir tu nombre en la respuesta usa "Hermes" (se lee en voz alta).

REGLAS:
{REGLAS}
CONOCIMIENTO (fuentes NASA y médicas; úsalo, no lo recites):
{CONOCIMIENTO}
EJEMPLOS DE CÓMO RESPONDES:
{EJEMPLOS}
DATOS DEL ASTRONAUTA (para tu análisis, no los recites):
Mediciones actuales: {j(m)}
Rangos normales: {j(RANGOS)}
Estado por indicador según la app: {j(e.get("resultados") or {})}
Entorno (hábitat, día de misión, radiación acumulada, pérdida ósea estimada): {j(entorno)}
Historial de lecturas previas (de la más antigua a la más reciente): {j(e.get("historial") or [])}
Usa el historial para decir si algo sube, baja o se mantiene. Si hay menos de 3 lecturas, no inventes tendencias.

CONVERSACIÓN RECIENTE (úsala para entender preguntas cortas como "¿y ayer?", "¿por qué?" o "¿qué hago?"; no la repitas):
{conversacion}

{bloque_alt}Astronauta: {pregunta or "¿Cómo estoy?"}
Hermes:"""


def responder(cuerpo):
    """Lógica pura: dict de entrada -> (código HTTP, dict de salida)."""
    if not isinstance(cuerpo, dict):
        return 400, {"error": "Solicitud inválida."}

    pregunta = str(cuerpo.get("pregunta") or "").strip()[:1000]
    idioma = "en" if cuerpo.get("idioma") == "en" else "es"   # idioma de la página (Ajustes)
    ctx = cuerpo.get("contexto") if isinstance(cuerpo.get("contexto"), dict) else {}
    m = ctx.get("mediciones") or cuerpo.get("mediciones") or {}
    if not isinstance(m, dict):
        m = {}
    e = {
        "habitat": ctx.get("habitat"),
        "diaMision": ctx.get("diaMision"),
        "estadoGeneral": ctx.get("estadoGeneral"),
        "resultados": ctx.get("resultados"),
        "historial": ctx.get("historial") or [],
        "conversacion": ctx.get("conversacion") or [],
        "sinLecturas": bool(ctx.get("sinLecturas")),
        "lecturasProcesadas": ctx.get("lecturasProcesadas"),
        "alternativas": ctx.get("transcripcionesAlternativas") if isinstance(ctx.get("transcripcionesAlternativas"), list) else [],
    }
    if isinstance(ctx.get("entorno"), dict):
        e.update(ctx["entorno"])

    clave = os.environ.get("GEMINI_API_KEY")
    if not clave:
        return 200, {"respuesta": respuesta_local(m, pregunta, e, idioma), "fuente": "local (sin API key)"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent?key={clave}"
    carga = json.dumps({
        "contents": [{"parts": [{"text": construir_prompt(pregunta, m, e, idioma)}]}],
        "generationConfig": {"maxOutputTokens": 380, "temperature": 0.3},
    }).encode("utf-8")
    peticion = urllib.request.Request(url, data=carga, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(peticion, timeout=TIMEOUT_S) as r:
            datos = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            detalle = json.loads(err.read().decode("utf-8")).get("error", {}).get("message", "error")
        except Exception:
            detalle = "error"
        return 200, {"respuesta": respuesta_local(m, pregunta, e, idioma), "fuente": f"local (Gemini {err.code}: {detalle})"}
    except Exception as err:  # timeout, red, JSON inválido
        motivo = "timeout" if "timed out" in str(err).lower() else "error de red"
        return 200, {"respuesta": respuesta_local(m, pregunta, e, idioma), "fuente": f"local ({motivo})"}

    try:
        texto = datos["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        texto = ""
    if not texto:
        return 200, {"respuesta": respuesta_local(m, pregunta, e, idioma), "fuente": "local (respuesta vacía)"}
    return 200, {"respuesta": texto, "fuente": "gemini"}


class handler(BaseHTTPRequestHandler):
    def _enviar(self, codigo, datos):
        carga = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(carga)))
        self.end_headers()
        self.wfile.write(carga)

    def do_POST(self):
        try:
            largo = int(self.headers.get("Content-Length") or 0)
            cuerpo = json.loads(self.rfile.read(largo) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._enviar(400, {"error": "Solicitud inválida."})
        codigo, datos = responder(cuerpo)
        self._enviar(codigo, datos)

    def do_GET(self):
        self._enviar(405, {"error": "Método no permitido"})
