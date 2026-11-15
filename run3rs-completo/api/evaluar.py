# api/evaluar.py · run3rs — lógica de salud en Python (Vercel Serverless Function)
# Recibe las mediciones y devuelve el semáforo por indicador, el estado general y el entorno.
import json
from http.server import BaseHTTPRequestHandler

INF = float("inf")

INDICADORES = {
    "temperatura": {"rojo": (35, 39), "amarillo": (36, 38)},
    "frecuencia": {"rojo": (40, 130), "amarillo": (50, 100)},
    "sistolica": {"rojo": (80, 181), "amarillo": (90, 130)},
    "diastolica": {"rojo": (50, 121), "amarillo": (60, 80)},
    "glucosa": {"rojo": (54, 251), "amarillo": (70, 181)},
    "sueno": {"rojo": (5, INF), "amarillo": (7, INF)},
    "animo": {"rojo": (2, INF), "amarillo": (3, INF)},
}

PRIORIDAD = {"sin-dato": 0, "verde": 1, "amarillo": 2, "rojo": 3}

HABITATS = {
    "iss": {"nombre": "estacion espacial", "gravedad": 0},
    "transito": {"nombre": "Nave en Transito a Marte", "gravedad": 0},
    "luna": {"nombre": "Base lunar", "gravedad": 0.16},
    "marte": {"nombre": "Base en Marte", "gravedad": 0.38},
}


def numero(valor):
    """Devuelve float o None (dato ausente o no numérico)."""
    if valor is None or valor == "" or isinstance(valor, bool):
        return None
    try:
        x = float(valor)
    except (TypeError, ValueError):
        return None
    return x if x == x and abs(x) != INF else None


def evaluar_indicador(clave, valor):
    if valor is None:
        return {"estado": "sin-dato", "direccion": None}
    umbral = INDICADORES[clave]
    a_min, a_max = umbral["amarillo"]
    r_min, r_max = umbral["rojo"]

    direccion = None
    if valor < a_min:
        direccion = "bajo"
    elif valor >= a_max:
        direccion = "alto"

    if valor < r_min or valor >= r_max:
        return {"estado": "rojo", "direccion": direccion}
    if direccion is not None:
        return {"estado": "amarillo", "direccion": direccion}
    return {"estado": "verde", "direccion": None}


def evaluar_todo(mediciones):
    return {clave: evaluar_indicador(clave, numero(mediciones.get(clave))) for clave in INDICADORES}


def peor_estado(resultados):
    peor = "sin-dato"
    for r in resultados.values():
        if PRIORIDAD[r["estado"]] > PRIORIDAD[peor]:
            peor = r["estado"]
    return peor


def calcular_entorno(habitat, dia):
    if habitat not in HABITATS:
        habitat = "marte"
    dia = numero(dia) or 1

    if habitat in ("iss", "luna"):
        radiacion = 0.35 * dia
    elif habitat == "transito":
        radiacion = 1.8 * dia
    else:  # marte: 180 días de tránsito + estancia en superficie
        radiacion = (1.8 * 180) + (0.64 * dia)

    perdida_osea = None
    if habitat in ("iss", "transito"):
        meses = dia / 30
        perdida_osea = [meses * 1, meses * 1.5]

    return {
        "radiacionMSv": radiacion,
        "porcentajeLimite": (radiacion / 600) * 100,
        "perdidaOsea": perdida_osea,
        "gravedad": HABITATS[habitat]["gravedad"],
        "nombreHabitat": HABITATS[habitat]["nombre"],
        "diaMision": dia,
    }


def responder(cuerpo):
    """Lógica pura: dict de entrada -> (código HTTP, dict de salida)."""
    if not isinstance(cuerpo, dict):
        return 400, {"error": "Solicitud inválida."}
    mediciones = cuerpo.get("mediciones")
    if not isinstance(mediciones, dict):
        return 400, {"error": "Faltan las mediciones."}
    resultados = evaluar_todo(mediciones)
    return 200, {
        "resultados": resultados,
        "general": peor_estado(resultados),
        "entorno": calcular_entorno(cuerpo.get("habitat"), cuerpo.get("diaMision")),
        "fuente": "python",
    }


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
