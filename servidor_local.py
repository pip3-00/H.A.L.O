# servidor_local.py · run3rs — servidor para probar en tu computadora (en lugar de Live Server).
# Sirve la carpeta public/ y ejecuta las funciones Python de api/ igual que en Vercel.
# Uso:  python servidor_local.py      y abre  http://localhost:8000
# Para que Nova use Gemini:  define la variable de entorno GEMINI_API_KEY antes de ejecutarlo.
import importlib.util
import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.dirname(os.path.abspath(__file__))
PUERTO = int(os.environ.get("PORT", 8000))


def cargar(nombre):
    ruta = os.path.join(RAIZ, "api", nombre + ".py")
    if not os.path.isfile(ruta):
        return None
    spec = importlib.util.spec_from_file_location("api_" + nombre, ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


class Servidor(SimpleHTTPRequestHandler):
    def do_POST(self):
        nombre = self.path.split("?")[0].strip("/").removeprefix("api/")
        modulo = cargar(nombre) if nombre.isidentifier() and self.path.startswith("/api/") else None
        if modulo is None:
            codigo, datos = 404, {"error": "No existe esa función."}
        else:
            try:
                largo = int(self.headers.get("Content-Length") or 0)
                codigo, datos = modulo.responder(json.loads(self.rfile.read(largo) or b"{}"))
            except Exception as err:
                codigo, datos = 500, {"error": str(err)}
        carga = json.dumps(datos, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(carga)))
        self.end_headers()
        self.wfile.write(carga)


if __name__ == "__main__":
    manejador = partial(Servidor, directory=os.path.join(RAIZ, "public"))
    print(f"run3rs en http://localhost:{PUERTO}  (Ctrl+C para salir)")
    ThreadingHTTPServer(("", PUERTO), manejador).serve_forever()
