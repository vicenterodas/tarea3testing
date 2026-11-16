import pytest


@pytest.fixture()
def quote_payload():
    return {
        "quote": "La curiosidad es el primer paso para aprender.",
        "character": "Marie Curie",
        "source": "Prueba de creación de frases",
        "tags": ["science", "life"],
    }


def test_daily_quote(client):
    resp = client.get('/quotes/daily')
    assert resp.status_code == 200
    data = resp.get_json()
    assert set(data.keys()) == {"id", "quote", "character", "source", "tags"}
    assert isinstance(data["character"], dict)
    assert {"id", "name"}.issubset(set(data["character"].keys()))
    assert isinstance(data["tags"], list)
    for t in data["tags"]:
        assert "id" in t and "name" in t


def test_add_quote_creates_and_persists_valid_quote(client, quote_payload):
    # Preparar: usar un personaje y etiquetas presentes en los datos iniciales.
    payload = quote_payload
    expected_character = {
        "id": "c3a7f1c0d9b8e6f5a4c3b2a1d0e9f8c7",
        "name": "Marie Curie",
    }
    expected_tags = {
        ("t1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6", "science"),
        ("t3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8", "life"),
    }

    # Actuar: json= serializa el diccionario y envía Content-Type: application/json.
    response = client.post("/quotes/add", json=payload)

    # Verificar la creación y los datos devueltos por la API.
    assert response.status_code == 201
    created = response.get_json()
    assert set(created) == {"id", "quote", "character", "source", "tags"}
    assert isinstance(created["id"], str) and created["id"]
    assert created["quote"] == payload["quote"]
    assert created["character"] == expected_character
    assert created["source"] == payload["source"]
    assert len(created["tags"]) == 2
    assert {(tag["id"], tag["name"]) for tag in created["tags"]} == expected_tags

    # Consultar de nuevo para comprobar que los datos quedaron guardados.
    saved_response = client.get(f'/quotes/{created["id"]}')

    assert saved_response.status_code == 200
    saved = saved_response.get_json()
    assert set(saved) == {"id", "quote", "character", "source", "tags"}
    assert saved["id"] == created["id"]
    assert saved["quote"] == payload["quote"]
    assert saved["character"] == expected_character
    assert saved["source"] == payload["source"]
    assert len(saved["tags"]) == 2
    # Las etiquetas no tienen un orden garantizado en la respuesta.
    assert {(tag["id"], tag["name"]) for tag in saved["tags"]} == expected_tags


@pytest.mark.parametrize(
    "invalid_fields, expected_error",
    [
        pytest.param(
            {"quote": " \t\n"},
            "El texto de la cita no es válido",
            id="blank-quote",
        ),
        pytest.param(
            {"character": None},
            "El nombre del personaje no es válido",
            id="null-character",
        ),
        pytest.param({"source": 42}, "La fuente no es válida", id="numeric-source"),
        pytest.param(
            {"tags": "science"},
            "Los tags deben ser una lista",
            id="tags-not-a-list",
        ),
        pytest.param(
            {"tags": ["science", ""]},
            "Los tags deben ser cadenas no vacías",
            id="empty-tag",
        ),
    ],
)
def test_add_quote_rejects_invalid_data_without_saving(
    client, quote_payload, invalid_fields, expected_error
):
    before_response = client.get("/quotes")
    assert before_response.status_code == 200
    before_ids = {quote["id"] for quote in before_response.get_json()}
    payload = {**quote_payload, **invalid_fields}

    response = client.post("/quotes/add", json=payload)

    assert response.status_code == 400
    assert response.get_json() == {"error": expected_error}

    after_response = client.get("/quotes")
    assert after_response.status_code == 200
    assert {quote["id"] for quote in after_response.get_json()} == before_ids


def test_add_quote_rejects_missing_required_field(client, quote_payload):
    del quote_payload["source"]

    response = client.post("/quotes/add", json=quote_payload)

    assert response.status_code == 400
    assert response.get_json() == {"error": "Faltan campos obligatorios"}


@pytest.mark.parametrize(
    "optional_fields",
    [
        pytest.param({}, id="without-tags"),
        pytest.param({"tags": []}, id="empty-tags"),
    ],
)
def test_add_quote_accepts_optional_tags(client, quote_payload, optional_fields):
    del quote_payload["tags"]
    payload = {**quote_payload, **optional_fields}

    response = client.post("/quotes/add", json=payload)

    assert response.status_code == 201
    created = response.get_json()
    assert isinstance(created["id"], str) and created["id"]
    assert created["quote"] == payload["quote"]
    assert created["character"]["name"] == payload["character"]
    assert created["source"] == payload["source"]
    assert created["tags"] == []

    saved_response = client.get(f'/quotes/{created["id"]}')
    assert saved_response.status_code == 200
    assert saved_response.get_json() == created


def test_add_quote_rejects_duplicate_without_changing_original(client, quote_payload):
    first_response = client.post("/quotes/add", json=quote_payload)
    assert first_response.status_code == 201
    original = first_response.get_json()
    # El texto repetido debe rechazarse aunque cambien los demás campos.
    duplicate_payload = {
        **quote_payload,
        "character": "Albert Einstein",
        "source": "Una fuente diferente",
        "tags": ["science"],
    }

    response = client.post("/quotes/add", json=duplicate_payload)

    assert response.status_code == 409
    assert response.get_json() == {"error": "La cita ya existe"}

    saved_response = client.get(f'/quotes/{original["id"]}')
    assert saved_response.status_code == 200
    saved = saved_response.get_json()
    assert saved["quote"] == quote_payload["quote"]
    assert saved["character"] == original["character"]
    assert saved["source"] == quote_payload["source"]
    assert len(saved["tags"]) == len(original["tags"])
    assert {(tag["id"], tag["name"]) for tag in saved["tags"]} == {
        (tag["id"], tag["name"]) for tag in original["tags"]
    }

    quotes_response = client.get("/quotes")
    assert quotes_response.status_code == 200
    matching_quotes = [
        quote for quote in quotes_response.get_json()
        if quote["quote"] == quote_payload["quote"]
    ]
    assert len(matching_quotes) == 1
    assert matching_quotes[0]["id"] == original["id"]
