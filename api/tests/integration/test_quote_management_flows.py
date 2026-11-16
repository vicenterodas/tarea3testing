def create_quote(client, text, character="Marie Curie", tags=None):
    payload = {"quote": text, "character": character, "source": "Integración"}
    if tags is not None:
        payload["tags"] = tags
    response = client.post("/quotes/add", json=payload)
    assert response.status_code == 201
    return response.get_json()


def get_json(client, path, **kwargs):
    response = client.get(path, **kwargs)
    assert response.status_code == 200
    return response.get_json()


def test_enrich_quote_with_new_and_existing_tags_then_find_it(client):
    """Crear, etiquetar y encontrar una frase: /quotes/add, /quotes/<id>/tags,
    /quotes/<id>, /quotes y /tags.
    """
    quote = create_quote(client, "Etiquetar ayuda a encontrar ideas.", tags=["science"])
    quote_id = quote["id"]
    new_tags = ["wisdom", "organizacion-integracion"]

    response = client.post(f"/quotes/{quote_id}/tags", json={"tags": new_tags})
    assert response.status_code == 201
    added = response.get_json()
    assert len(added) == 2
    assert {tag["name"] for tag in added} == set(new_tags)
    assert all(isinstance(tag["id"], str) and tag["id"] for tag in added)

    saved = get_json(client, f"/quotes/{quote_id}")
    assert {tag["name"] for tag in saved["tags"]} == {"science", *new_tags}
    assert len(saved["tags"]) == 3
    catalog = get_json(client, "/tags")
    assert {tuple(sorted(tag.items())) for tag in added}.issubset(
        {tuple(sorted(tag.items())) for tag in catalog}
    )

    # Repetir la solicitud no debe duplicar las relaciones persistidas.
    repeated = client.post(f"/quotes/{quote_id}/tags", json={"tags": new_tags})
    assert repeated.status_code == 201
    saved_again = get_json(client, f"/quotes/{quote_id}")
    assert len(saved_again["tags"]) == 3
    assert {tag["name"] for tag in saved_again["tags"]} == {"science", *new_tags}
    matches = get_json(
        client, "/quotes", query_string=[("tag", tag) for tag in new_tags]
    )
    assert [item["id"] for item in matches] == [quote_id]


def test_delete_quote_then_remove_its_character(client):
    """Crear y consultar una frase, proteger su personaje, borrar la frase y
    después el personaje. Usa /quotes/add, /quotes/<id>, /quotes/delete/<id>,
    /characters/delete/<id>, /characters y /tags.
    """
    quote = create_quote(
        client, "Una frase temporal para un personaje temporal.",
        character="Personaje temporal de integración", tags=["temporal-integracion"],
    )
    quote_id = quote["id"]
    character_id = quote["character"]["id"]

    blocked = client.delete(f"/characters/delete/{character_id}")
    assert blocked.status_code == 400
    assert blocked.get_json() == {
        "error": "No se puede eliminar un personaje con citas asociadas"
    }
    assert get_json(client, f"/quotes/{quote_id}") == quote

    deleted = client.delete(f"/quotes/delete/{quote_id}")
    assert deleted.status_code == 200
    assert deleted.get_json() == {"message": "Cita eliminada con éxito"}
    missing = client.get(f"/quotes/{quote_id}")
    assert missing.status_code == 404
    assert missing.get_json() == {"error": "Cita no encontrada"}

    removed_character = client.delete(f"/characters/delete/{character_id}")
    assert removed_character.status_code == 200
    assert removed_character.get_json() == {"message": "Personaje eliminado con éxito"}
    assert character_id not in {item["id"] for item in get_json(client, "/characters")}
    # Borrar la frase no debe borrar una etiqueta del catálogo.
    assert quote["tags"][0] in get_json(client, "/tags")


def test_delete_shared_tag_preserves_quotes_and_other_tags(client):
    """Crear dos frases con una etiqueta compartida, borrarla y comprobar ambas.
    Endpoints: /quotes/add, /tags/delete/<id>, /tags, /quotes/<id> y /quotes.
    """
    shared = "compartida-integracion"
    first = create_quote(client, "Primera frase con etiqueta compartida.", tags=[shared, "science"])
    second = create_quote(client, "Segunda frase con etiqueta compartida.", tags=[shared, "life"])
    tag_id = next(tag["id"] for tag in first["tags"] if tag["name"] == shared)
    assert next(tag["id"] for tag in second["tags"] if tag["name"] == shared) == tag_id
    before = get_json(client, "/quotes", query_string={"tag": shared})
    assert {item["id"] for item in before} == {first["id"], second["id"]}

    deleted = client.delete(f"/tags/delete/{tag_id}")
    assert deleted.status_code == 200
    assert deleted.get_json() == {"message": "Etiqueta eliminada con éxito"}
    assert tag_id not in {tag["id"] for tag in get_json(client, "/tags")}

    for original, remaining_tag in [(first, "science"), (second, "life")]:
        saved = get_json(client, f'/quotes/{original["id"]}')
        assert saved["quote"] == original["quote"]
        assert saved["character"] == original["character"]
        assert saved["source"] == original["source"]
        assert len(saved["tags"]) == 1
        assert saved["tags"][0]["name"] == remaining_tag
    assert get_json(client, "/quotes", query_string={"tag": shared}) == []


def test_combined_filters_update_after_tagging_another_quote(client):
    """Buscar por personaje y todas las etiquetas, completar una frase y repetir
    la búsqueda. Endpoints: /quotes/add, /quotes, /quotes/<id>, /quotes/<id>/tags.
    """
    tags = ["filtro-integracion-a", "filtro-integracion-b"]
    character = "Autora de filtros"
    first = create_quote(client, "Coincide con ambos filtros.", character, tags)
    partial = create_quote(client, "Todavía le falta una etiqueta.", character, tags[:1])
    create_quote(client, "Otro personaje con las mismas etiquetas.", "Otro autor de filtros", tags)
    filters = [("character", character), *(('tag', tag) for tag in tags)]

    matches = get_json(client, "/quotes", query_string=filters)
    assert [quote["id"] for quote in matches] == [first["id"]]
    assert get_json(client, f'/quotes/{first["id"]}')["quote"] == first["quote"]

    added = client.post(f'/quotes/{partial["id"]}/tags', json={"tags": tags[1:]})
    assert added.status_code == 201
    assert [tag["name"] for tag in added.get_json()] == tags[1:]
    updated = get_json(client, "/quotes", query_string=filters)
    assert len(updated) == 2
    assert {quote["id"] for quote in updated} == {first["id"], partial["id"]}
    assert all(quote["character"]["name"] == character for quote in updated)
    assert all({tag["name"] for tag in quote["tags"]} == set(tags) for quote in updated)
