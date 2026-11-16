import runpy
from unittest.mock import patch

import src.app as app_module


def test_script_entrypoint_starts_the_configured_application():
    # Ejecutar el archivo como script, evitando que Flask bloquee el test al
    # iniciar un servidor permanente. Las rutas y la conexión a BD son reales.
    with patch("flask.Flask.run", autospec=True) as run_server:
        namespace = runpy.run_path(app_module.__file__, run_name="__main__")

    started_app = namespace["app"]
    run_server.assert_called_once_with(started_app, debug=True)
    with started_app.test_client() as client:
        response = client.get("/quotes/daily")
        assert response.status_code == 200
        assert set(response.get_json()) == {"id", "quote", "character", "source", "tags"}
    with started_app.app_context():
        namespace["db"].session.remove()
        namespace["db"].engine.dispose()
