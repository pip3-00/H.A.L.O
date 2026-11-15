# api/voz.py · run3rs — voz de Nova (Python, Vercel Serverless Function)
# Convierte texto en audio con Gemini TTS y lo devuelve como WAV en base64.
# Si falla (sin clave, modelo no disponible, tiempo agotado), responde {"audio": null}
# y el navegador usa su voz de respaldo.
import base64
import io
import json
import os
import urllib.error
import urllib.request
import wave
from http.server import BaseHTTPRequestHandler

MODELO_VOZ = "gemini-2.5-flash-preview-tts"
VOZ = "Kore"          # voz prediseñada de Gemini (femenina, clara)
TIMEOUT_S = 12
MAX_CARACTERES = 600


def pcm_a_wav(pcm, frecuencia=24000):
    salida = io.BytesIO()
    with wave.open(salida, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)          # 16 bits
        w.setframerate(frecuencia)
        w.writeframes(pcm)
    return salida.getvalue()


def frecuencia_de(mime):
    # p. ej. "audio/L16;codec=pcm;rate=24000"
    for parte in (mime or "").split(";"):
        parte = parte.strip()
        if parte.startswith("rate="):
            try:
                return int(parte[5:])
            except ValueError:
                pass
    return 24000


def responder(cuerpo):
    """Lógica pura: dict de entrada -> (código HTTP, dict de salida)."""
    if not isinstance(cuerpo, dict):
        return 400, {"error": "Solicitud inválida."}
    texto = " ".join(str(cuerpo.get("texto") or "").split())[:MAX_CARACTERES]
    if not texto:
        return 400, {"error": "Falta el texto."}

    clave = os.environ.get("GEMINI_API_KEY")
    if not clave:
        return 200, {"audio": None, "fuente": "sin API key"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO_VOZ}:generateContent?key={clave}"
    carga = json.dumps({
        "contents": [{"parts": [{"text": "Lee en español, con tono sereno y claro: " + texto}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOZ}}},
        },
    }).encode("utf-8")
    peticion = urllib.request.Request(url, data=carga, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(peticion, timeout=TIMEOUT_S) as r:
            datos = json.loads(r.read().decode("utf-8"))
        parte = datos["candidates"][0]["content"]["parts"][0]["inlineData"]
        pcm = base64.b64decode(parte["data"])
    except urllib.error.HTTPError as err:
        return 200, {"audio": None, "fuente": f"Gemini TTS {err.code}"}
    except Exception as err:
        return 200, {"audio": None, "fuente": f"error: {type(err).__name__}"}

    if not pcm:
        return 200, {"audio": None, "fuente": "audio vacío"}
    wav = pcm_a_wav(pcm, frecuencia_de(parte.get("mimeType")))
    return 200, {"audio": base64.b64encode(wav).decode("ascii"), "formato": "wav", "fuente": "gemini-tts"}


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
