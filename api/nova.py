# api/nova.py · run3rs — Nova, asistente de a bordo (Python, Vercel Serverless Function)
# Proxy hacia Gemini: la clave GEMINI_API_KEY nunca llega al navegador.
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

MODELO = "gemini-flash-lite-latest"
TIMEOUT_S = 8

# Rangos NORMALES (verde): los mismos umbrales que usa la app (api/evaluar.py),
# para que Nova nunca contradiga al semáforo.
RANGOS = {
    "temperatura": {"min": 36.0, "max": 37.9, "unidad": "°C", "nombre": "temperatura"},
    "frecuencia": {"min": 50, "max": 99, "unidad": "lpm", "nombre": "frecuencia cardíaca"},
    "sistolica": {"min": 90, "max": 129, "unidad": "mmHg", "nombre": "presión sistólica"},
    "diastolica": {"min": 60, "max": 79, "unidad": "mmHg", "nombre": "presión diastólica"},
    "glucosa": {"min": 70, "max": 180, "unidad": "mg/dL", "nombre": "glucosa"},
    "sueno": {"min": 7, "max": 24, "unidad": "horas", "nombre": "sueño"},
    "animo": {"min": 3, "max": 5, "unidad": "de 5", "nombre": "ánimo"},
}

# ---------------------------------------------------------------------------
# "Entrenamiento" de Nova: conocimiento, reglas y ejemplos que se envían a Gemini
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
1. Tu respuesta se LEE EN VOZ ALTA: tono sereno y cercano, español simple, sin listas, viñetas, símbolos ni formato. Escribe los números como se dicen (por ejemplo "treinta y seis coma ocho grados").
2. Largo según la pregunta: para "¿cómo estoy?" o un síntoma, 2 o 3 frases. Si pide DATOS (un valor, un promedio, una tendencia, cuánta radiación lleva, qué día es, una comparación, una explicación), dalos completos y exactos en hasta 5 frases.
3. Cuando pide datos, usa SOLO los datos de la sección DATOS DEL ASTRONAUTA o del CONOCIMIENTO. Puedes calcular con ellos (promedios, mínimos, máximos, diferencias, cuánto falta para un límite). Nunca inventes un valor; si no está, dilo y pide que lo mida.
4. Si no pide datos y todo está en rango, di "Tus parámetros están normales" sin recitar cifras. Si algo está alterado: qué pasa, qué hacer ahora y cuándo avisar a Tierra.
5. Si cuenta un síntoma, relaciónalo con sus mediciones y con el entorno espacial, da una medida básica y segura, y dile que avise a Tierra si persiste o empeora.
6. Responde también preguntas generales de salud en el espacio, de la misión, del hábitat, de la radiación, de cómo funciona la app o de ciencia espacial, usando el CONOCIMIENTO y lo que sabes con seguridad. Si no estás segura de un dato, dilo.
7. SEGURIDAD: nunca des un diagnóstico definitivo, nunca recetes ni dosifiques medicamentos (di "consulta el botiquín con los médicos de vuelo") y nunca digas que ignore una alerta.
8. Emergencia (dolor en el pecho, falta de aire, desmayo, confusión, convulsión, sangrado fuerte, o un indicador en rojo con síntomas): dile que avise YA a un compañero y a Tierra antes de cualquier otro consejo.
9. Si la pregunta no tiene relación con la salud, el espacio o la misión, responde brevemente con amabilidad y ofrece ayuda con su salud.
"""

EJEMPLOS = """
Astronauta: ¿Cómo estoy?   (todo en rango y estable)
Nova: Tus parámetros están normales y se mantienen estables desde ayer. Sigue con tu rutina y tu ejercicio de hoy.

Astronauta: Me duele la cabeza.   (temperatura 38.4, frecuencia 104)
Nova: Tienes algo de fiebre y el corazón acelerado, y eso puede explicar el dolor de cabeza. Bebe agua, descansa en un lugar fresco y vuelve a medir en 30 minutos. Si el dolor o la fiebre siguen, avisa a Tierra.

Astronauta: Me duele la cabeza.   (todo en rango)
Nova: Tus mediciones están bien; en microgravedad los fluidos suben a la cabeza y eso suele causar dolor y congestión. Hidrátate, descansa unos minutos y avísame si empeora o aparece mareo.

Astronauta: Estoy mareado.   (presión 86/56)
Nova: Tu presión está baja y eso explica el mareo. Siéntate o recuéstate ahora, bebe agua y vuelve a medir en 10 minutos. Si te desmayas o no mejora, avisa a Tierra.

Astronauta: ¿Puedo tomar ibuprofeno?
Nova: No puedo indicarte medicamentos; consulta el botiquín con los médicos de vuelo. Mientras tanto, descansa e hidrátate, y dime si el malestar aumenta.

Astronauta: Me duele el pecho y me falta el aire.
Nova: Avisa ahora mismo a un compañero y a Tierra. Siéntate, quédate quieto y no hagas esfuerzo mientras llega la ayuda.

Astronauta: No puedo dormir.   (sueño 4.5 h, ánimo 2)
Nova: Dormiste muy poco y tu ánimo está bajo; es común con los turnos y el encierro. Esta noche mantén tu horario fijo, apaga pantallas una hora antes y habla con un compañero si te sientes así varios días.

Astronauta: ¿Cuál es mi temperatura?   (temperatura 36.8)
Nova: Tu temperatura es de treinta y seis coma ocho grados, dentro del rango normal.

Astronauta: ¿Cómo ha estado mi frecuencia cardíaca?   (historial: 70, 72, 75, 88, 96)
Nova: Tu frecuencia cardíaca ha subido en las últimas lecturas, de setenta a noventa y seis latidos por minuto; el promedio es de ochenta. Sigue en rango, pero va en aumento: descansa e hidrátate y vuelve a medir en diez minutos.

Astronauta: ¿Cuánta radiación llevo?   (Base en Marte, 324.6 mSv, 54.1 %)
Nova: Llevas trescientos veinticuatro coma seis milisievert, el cincuenta y cuatro por ciento del límite de carrera de la NASA, que es de seiscientos. La mayor parte la recibiste durante el viaje, a uno coma ocho milisievert por día; en la superficie de Marte sumas cero coma sesenta y cuatro por día.

Astronauta: ¿Cuánto tarda en responder Tierra?   (Base en Marte)
Nova: Desde Marte, un mensaje tarda entre tres y veintidós minutos en llegar, según la posición de los planetas, así que una respuesta completa puede tardar hasta cuarenta y cuatro minutos. En esta simulación usamos doce minutos de ida, veinticuatro ida y vuelta.

Astronauta: ¿Por qué pierdo hueso en el espacio?
Nova: Sin el peso de la gravedad, el cuerpo deja de cargar los huesos y empieza a reabsorberlos: en microgravedad se pierde entre uno y uno coma cinco por ciento de densidad ósea al mes. El ejercicio de resistencia diario es la mejor protección.
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


def numero_texto(v):
    return str(int(v)) if float(v).is_integer() else f"{v:.1f}"


CLAVES_DATO = {
    "temperatura": ("temperatura", "fiebre"),
    "frecuencia": ("frecuencia", "pulso", "corazón", "corazon", "latido"),
    "sistolica": ("presión", "presion", "tensión", "tension"),
    "glucosa": ("glucosa", "azúcar", "azucar"),
    "sueno": ("dormí", "dormi", "horas de sueño", "cuánto dormí"),
    "animo": ("ánimo", "animo", "humor"),
}


def respuesta_datos(p, m, e):
    """Respuestas con datos concretos sin Gemini (valores, tendencias, entorno)."""
    hist = [h.get("mediciones", {}) for h in (e.get("historial") or []) if isinstance(h, dict)]
    partes = []

    if any(k in p for k in ("radiación", "radiacion", "milisievert", "msv")) and isinstance(e.get("radiacionMSv"), (int, float)):
        partes.append(f"Llevas {e['radiacionMSv']:.1f} milisievert de radiación, el {e.get('porcentajeLimite', 0):.1f} por ciento del límite de carrera de la NASA, que es de 600.")
    if any(k in p for k in ("hueso", "ósea", "osea")):
        po = e.get("perdidaOsea")
        if isinstance(po, list) and len(po) == 2:
            partes.append(f"Tu pérdida ósea estimada es de {po[0]:.1f} a {po[1]:.1f} por ciento.")
        else:
            partes.append("En gravedad parcial no se sabe cuánto hueso se pierde; en microgravedad es de 1 a 1.5 por ciento al mes.")
    if "gravedad" in p and isinstance(e.get("gravedad"), (int, float)):
        partes.append(f"La gravedad en tu hábitat es de {e['gravedad']} g.")
    if any(k in p for k in ("qué día", "que dia", "día de misión", "dia de mision")) and e.get("diaMision"):
        partes.append(f"Estás en el día {numero_texto(float(e['diaMision']))} de la misión.")
    if any(k in p for k in ("tierra tarda", "responde tierra", "retraso", "demora", "cuánto tarda", "cuanto tarda")):
        partes.append("Desde Marte un mensaje tarda de 3 a 22 minutos de ida; en esta simulación usamos 12 minutos, 24 ida y vuelta. Desde la Luna o la estación, segundos.")

    for clave, palabras in CLAVES_DATO.items():
        if not any(w in p for w in palabras):
            continue
        r = RANGOS[clave]
        if clave == "sistolica":
            s_, d_ = m.get("sistolica"), m.get("diastolica")
            if isinstance(s_, (int, float)) and isinstance(d_, (int, float)):
                partes.append(f"Tu presión es {numero_texto(s_)} sobre {numero_texto(d_)} milímetros de mercurio.")
            continue
        v = m.get(clave)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            partes.append(f"No tengo una medición de tu {r['nombre']}; mídela y te digo.")
            continue
        estado = "baja" if v < r["min"] else "alta" if v > r["max"] else "dentro del rango normal"
        frase = f"Tu {r['nombre']} es de {numero_texto(v)} {r['unidad']}, {estado}."
        serie = [h.get(clave) for h in hist if isinstance(h.get(clave), (int, float))]
        if len(serie) >= 3:
            prom = sum(serie) / len(serie)
            cambio = serie[-1] - serie[0]
            umbral = 0.3 if clave == "temperatura" else 3
            tend = "va en aumento" if cambio > umbral else "va bajando" if cambio < -umbral else "se mantiene estable"
            frase += f" En tus últimas {len(serie)} lecturas el promedio es {numero_texto(round(prom, 1))} y {tend}."
        partes.append(frase)
    return " ".join(partes)


def respuesta_local(m, pregunta="", e=None):
    """Respaldo con reglas: si Gemini falla o tarda, Nova sigue respondiendo."""
    e = e or {}
    p = (pregunta or "").lower()
    consejo = next((texto for claves, texto in SINTOMAS if any(c in p for c in claves)), "")
    if consejo.startswith("Avisa ahora"):
        return consejo

    datos = respuesta_datos(p, m, e)
    if datos and not consejo:
        return datos

    fuera, leidos = [], 0
    for clave, r in RANGOS.items():
        v = m.get(clave)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            continue
        leidos += 1
        if v < r["min"]:
            fuera.append(f"tu {r['nombre']} está baja" if clave != "sueno" else "dormiste poco")
        elif v > r["max"]:
            fuera.append(f"tu {r['nombre']} está alta")

    if leidos == 0:
        estado = "No tengo mediciones tuyas todavía."
    elif not fuera:
        estado = "Tus parámetros están dentro de los rangos normales."
    else:
        estado = "Según tus mediciones, " + ", ".join(fuera) + "."
    if consejo:
        return f"{estado} {consejo}"
    if fuera:
        return f"{estado} Vuelve a medir en 30 minutos y, si sigue igual, avisa a Tierra."
    return estado


def construir_prompt(pregunta, m, e):
    entorno = {k: v for k, v in e.items() if k != "historial"}
    j = lambda x: json.dumps(x, ensure_ascii=False)
    return f"""Te llamas Nova y eres la asistente de salud a bordo de astronautas en misiones de larga duración.

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

Astronauta: {pregunta or "¿Cómo estoy?"}
Nova:"""


def responder(cuerpo):
    """Lógica pura: dict de entrada -> (código HTTP, dict de salida)."""
    if not isinstance(cuerpo, dict):
        return 400, {"error": "Solicitud inválida."}

    pregunta = str(cuerpo.get("pregunta") or "").strip()[:1000]
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
    }
    if isinstance(ctx.get("entorno"), dict):
        e.update(ctx["entorno"])

    clave = os.environ.get("GEMINI_API_KEY")
    if not clave:
        return 200, {"respuesta": respuesta_local(m, pregunta, e), "fuente": "local (sin API key)"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent?key={clave}"
    carga = json.dumps({
        "contents": [{"parts": [{"text": construir_prompt(pregunta, m, e)}]}],
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
        return 200, {"respuesta": respuesta_local(m, pregunta, e), "fuente": f"local (Gemini {err.code}: {detalle})"}
    except Exception as err:  # timeout, red, JSON inválido
        motivo = "timeout" if "timed out" in str(err).lower() else "error de red"
        return 200, {"respuesta": respuesta_local(m, pregunta, e), "fuente": f"local ({motivo})"}

    try:
        texto = datos["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        texto = ""
    if not texto:
        return 200, {"respuesta": respuesta_local(m, pregunta, e), "fuente": "local (respuesta vacía)"}
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