import pytest


QUOTE_ID = "q1f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4"


@pytest.mark.parametrize(
    "payload, expected_error",
    [
        pytest.param({}, "No se proporcionó ninguna etiqueta", id="missing-tags"),
        pytest.param({"tags": []}, "No se proporcionó ninguna etiqueta", id="empty-list"),
        pytest.param({"tags": None}, "No se proporcionó ninguna etiqueta", id="null"),
        pytest.param({"tags": "science"}, "El formato de las etiquetas es inválido", id="string"),
        pytest.param({"tags": [42]}, "El formato de las etiquetas es inválido", id="number-item"),
        pytest.param(
            {"tags": ["no-debe-crearse", None]},
            "El formato de las etiquetas es inválido", id="invalid-item-after-valid-one",
        ),
    ],
)
def test_add_tags_rejects_invalid_data_without_partial_changes(client, payload, expected_error):
    before_quote = client.get(f"/quotes/{QUOTE_ID}")
    before_tags = client.get("/tags")
    assert before_quote.status_code == before_tags.status_code == 200

    response = client.post(f"/quotes/{QUOTE_ID}/tags", json=payload)

    assert response.status_code == 400
    assert response.get_json() == {"error": expected_error}
    after_quote = client.get(f"/quotes/{QUOTE_ID}")
    after_tags = client.get("/tags")
    assert after_quote.status_code == after_tags.status_code == 200
    assert after_quote.get_json() == before_quote.get_json()
    assert {tuple(sorted(tag.items())) for tag in after_tags.get_json()} == {
        tuple(sorted(tag.items())) for tag in before_tags.get_json()
    }


@pytest.mark.parametrize(
    "method, path, payload, expected_error",
    [
        ("get", "/quotes/no-existe", None, "Cita no encontrada"),
        ("delete", "/quotes/delete/no-existe", None, "Cita no encontrada"),
        ("post", "/quotes/no-existe/tags", {"tags": ["science"]}, "Cita no encontrada"),
        ("delete", "/tags/delete/no-existe", None, "Etiqueta no encontrada"),
        ("delete", "/characters/delete/no-existe", None, "Personaje no encontrado"),
    ],
)
def test_missing_resources_return_404(client, method, path, payload, expected_error):
    response = getattr(client, method)(path, json=payload)
    assert response.status_code == 404
    assert response.get_json() == {"error": expected_error}


def test_add_quote_with_repeated_tags_persists_one_relationship(client):
    response = client.post("/quotes/add", json={
        "quote": "Una etiqueta repetida no duplica la relación.",
        "character": "Marie Curie", "source": "Prueba de etiquetas",
        "tags": ["science", "science"],
    })
    assert response.status_code == 201
    saved = client.get(f'/quotes/{response.get_json()["id"]}')
    assert saved.status_code == 200
    assert saved.get_json()["tags"] == [
        {"id": "t1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6", "name": "science"}
    ]
