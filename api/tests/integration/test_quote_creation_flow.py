def test_create_quote_with_new_character_and_tags_then_find_it(client):
    """Crear una frase con datos nuevos, descubrirlos y recuperar la frase.

    Endpoints: POST /quotes/add, GET /characters, GET /tags,
    GET /quotes (filtro por personaje) y GET /quotes/<id>.
    """
    payload = {
        "quote": "Cada prueba nos enseña algo nuevo.",
        "character": "Ada de pruebas",
        "source": "Cuaderno de pruebas",
        "tags": ["aprendizaje-api", "testing-api"],
    }

    # Confirmar que el personaje y las etiquetas todavía no existen.
    characters_before = client.get("/characters")
    assert characters_before.status_code == 200
    assert payload["character"] not in {
        character["name"] for character in characters_before.get_json()
    }
    tags_before = client.get("/tags")
    assert tags_before.status_code == 200
    assert set(payload["tags"]).isdisjoint(
        tag["name"] for tag in tags_before.get_json()
    )

    # La creación de la frase también debe crear los datos relacionados.
    response = client.post("/quotes/add", json=payload)
    assert response.status_code == 201
    created = response.get_json()
    assert isinstance(created["id"], str) and created["id"]
    assert created["quote"] == payload["quote"]
    assert created["source"] == payload["source"]
    assert created["character"]["name"] == payload["character"]
    assert isinstance(created["character"]["id"], str) and created["character"]["id"]
    assert len(created["tags"]) == 2
    assert {tag["name"] for tag in created["tags"]} == set(payload["tags"])
    assert all(isinstance(tag["id"], str) and tag["id"] for tag in created["tags"])
    assert len({tag["id"] for tag in created["tags"]}) == 2

    # Los nuevos recursos deben aparecer en sus respectivos listados.
    characters_after = client.get("/characters")
    assert characters_after.status_code == 200
    assert [
        character for character in characters_after.get_json()
        if character["name"] == payload["character"]
    ] == [created["character"]]

    tags_after = client.get("/tags")
    assert tags_after.status_code == 200
    listed_tags = [
        tag for tag in tags_after.get_json() if tag["name"] in payload["tags"]
    ]
    assert len(listed_tags) == 2
    expected_tags = {(tag["id"], tag["name"]) for tag in created["tags"]}
    assert {(tag["id"], tag["name"]) for tag in listed_tags} == expected_tags

    # El usuario encuentra la frase usando el nuevo personaje y abre su detalle.
    filtered_response = client.get(
        "/quotes", query_string={"character": payload["character"]}
    )
    assert filtered_response.status_code == 200
    filtered = filtered_response.get_json()
    assert len(filtered) == 1
    assert filtered[0]["id"] == created["id"]

    saved_response = client.get(f'/quotes/{created["id"]}')
    assert saved_response.status_code == 200
    saved = saved_response.get_json()
    assert saved["id"] == created["id"]
    assert saved["quote"] == payload["quote"]
    assert saved["source"] == payload["source"]
    assert saved["character"] == created["character"]
    assert len(saved["tags"]) == 2
    assert {(tag["id"], tag["name"]) for tag in saved["tags"]} == expected_tags
