# api/nova.py · run3rs — Nova, asistente de a bordo (Python, Vercel Serverless Function)
# Proxy hacia Gemini: la clave GEMINI_API_KEY nunca llega al navegador.
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

MODELO = "gemini-flash-lite-latest"
TIMEOUT_S = 8

RANGOS = {
    "temperatura": {"min": 36.1, "max": 37.5, "unidad": "°C", "nombre": "temperatura"},
    "frecuencia": {"min": 60, "max": 100, "unidad": "bpm", "nombre": "frecuencia cardíaca"},
    "sistolica": {"min": 90, "max": 140, "unidad": "mmHg", "nombre": "presión sistólica"},
    "diastolica": {"min": 60, "max": 90, "unidad": "mmHg", "nombre": "presión diastólica"},
    "glucosa": {"min": 70, "max": 140, "unidad": "mg/dL", "nombre": "glucosa"},
    "sueno": {"min": 6, "max": 9, "unidad": "horas", "nombre": "sueño"},
    "animo": {"min": 3, "max": 5, "unidad": "/5", "nombre": "ánimo"},
}


def respuesta_local(m):
    """Respaldo con reglas: si Gemini falla o tarda, Nova sigue respondiendo."""
    fuera, leidos = [], 0
    for clave, r in RANGOS.items():
        v = m.get(clave)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            continue
        leidos += 1
        if v < r["min"]:
            fuera.append(f"tu {r['nombre']} está baja")
        elif v > r["max"]:
            fuera.append(f"tu {r['nombre']} está alta")
    if leidos == 0:
        return "No recibí mediciones. Registra tus indicadores antes de consultar."
    if not fuera:
        return "Tus parámetros están dentro de los rangos normales."
    return ("Según tus mediciones, " + ", ".join(fuera) +
            ". Vuelve a medir en 30 minutos y, si sigue igual, avisa a Tierra.")


def construir_prompt(pregunta, m, e):
    entorno = {k: v for k, v in e.items() if k != "historial"}
    j = lambda x: json.dumps(x, ensure_ascii=False)
    return f"""Te llamas Nova y eres la asistente de salud a bordo de astronautas en misiones de larga duración.
Tu respuesta se LEE EN VOZ ALTA: habla como en una conversación, en español simple, con 2 o 3 frases cortas como máximo.
Reglas de estilo:
- No uses listas, viñetas, símbolos ni formato.
- No repitas todas las cifras. Si todo está dentro de rango, di algo como "Tus parámetros están normales" y, si aplica, que se mantienen estables. Cita un valor solo si la pregunta lo pide o si es el que está alterado.
- Si hay algo alterado: dilo en una frase, di qué hacer ahora en otra y, solo si es necesario, cuándo avisar a Tierra.
- Si el astronauta cuenta un síntoma (por ejemplo dolor de cabeza), relaciónalo con sus mediciones, da una medida básica y segura, y dile que avise a Tierra si persiste o empeora.
- No des diagnósticos definitivos ni recetes medicamentos. Si faltan datos, dilo brevemente.

Datos para tu análisis (no los recites):
Mediciones actuales: {j(m)}
Rangos de referencia: {j(RANGOS)}
Entorno (hábitat, día de misión, radiación acumulada, pérdida ósea estimada): {j(entorno)}
Historial de lecturas previas (de la más antigua a la más reciente): {j(e.get("historial") or [])}
Usa el historial para decir si algo sube, baja o se mantiene, sin citar todos los valores. Si hay menos de 3 lecturas, no inventes tendencias.

Pregunta del astronauta: {pregunta or "Evalúa mi estado de salud actual."}"""


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
        return 200, {"respuesta": respuesta_local(m), "fuente": "local (sin API key)"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent?key={clave}"
    carga = json.dumps({
        "contents": [{"parts": [{"text": construir_prompt(pregunta, m, e)}]}],
        "generationConfig": {"maxOutputTokens": 220, "temperature": 0.4},
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
        return 200, {"respuesta": respuesta_local(m), "fuente": f"local (Gemini {err.code}: {detalle})"}
    except Exception as err:  # timeout, red, JSON inválido
        motivo = "timeout" if "timed out" in str(err).lower() else "error de red"
        return 200, {"respuesta": respuesta_local(m), "fuente": f"local ({motivo})"}

    try:
        texto = datos["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        texto = ""
    if not texto:
        return 200, {"respuesta": respuesta_local(m), "fuente": "local (respuesta vacía)"}
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
