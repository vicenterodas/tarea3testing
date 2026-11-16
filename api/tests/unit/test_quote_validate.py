import pytest

from src.scripts.quotes import quote_validate


@pytest.fixture()
def valid_quote():
    # Cada caso recibe un diccionario nuevo para no afectar otros tests.
    return {
        "quote": "Nada en la vida debe ser temido, solamente comprendido.",
        "character": "Marie Curie",
        "source": "Discurso",
    }


@pytest.mark.parametrize(
    "optional_fields",
    [
        pytest.param({}, id="without-tags"),
        pytest.param({"tags": []}, id="empty-tags"),
        pytest.param({"tags": ["science", "life"]}, id="valid-tags"),
    ],
)
def test_quote_validate_accepts_valid_quote(valid_quote, optional_fields):
    # Preparar: las etiquetas son opcionales y también pueden ser una lista vacía.
    quote = {**valid_quote, **optional_fields}

    # Actuar: llamar directamente a la función, sin pasar por un endpoint.
    result = quote_validate(quote)

    # Verificar: la frase se acepta y no se devuelve ningún error.
    assert result == {"is_valid": True}


@pytest.mark.parametrize("missing_field", ["quote", "character", "source"])
def test_quote_validate_rejects_missing_required_field(valid_quote, missing_field):
    del valid_quote[missing_field]

    result = quote_validate(valid_quote)

    assert result == {
        "is_valid": False,
        "error": "Faltan campos obligatorios",
    }


@pytest.mark.parametrize(
    "field, expected_error",
    [
        ("quote", "El texto de la cita no es válido"),
        ("character", "El nombre del personaje no es válido"),
        ("source", "La fuente no es válida"),
    ],
)
@pytest.mark.parametrize(
    "invalid_value",
    [
        pytest.param(None, id="null"),
        pytest.param(42, id="number"),
        pytest.param("", id="empty-string"),
        pytest.param(" \t\n", id="whitespace"),
    ],
)
def test_quote_validate_rejects_invalid_required_field(
    valid_quote, field, expected_error, invalid_value
):
    # Se cambia un solo campo para aislar la causa del rechazo.
    valid_quote[field] = invalid_value

    result = quote_validate(valid_quote)

    assert result == {"is_valid": False, "error": expected_error}


@pytest.mark.parametrize(
    "invalid_tags",
    [
        pytest.param(None, id="null"),
        pytest.param("science", id="string"),
        pytest.param({"name": "science"}, id="dictionary"),
        pytest.param(("science",), id="tuple"),
    ],
)
def test_quote_validate_rejects_tags_that_are_not_a_list(valid_quote, invalid_tags):
    valid_quote["tags"] = invalid_tags

    result = quote_validate(valid_quote)

    assert result == {"is_valid": False, "error": "Los tags deben ser una lista"}


@pytest.mark.parametrize(
    "invalid_tags",
    [
        pytest.param([""], id="empty-tag"),
        pytest.param([" \t\n"], id="whitespace-tag"),
        pytest.param([42], id="number-tag"),
        pytest.param([None], id="null-tag"),
        pytest.param(["science", ""], id="valid-tag-followed-by-invalid-tag"),
    ],
)
def test_quote_validate_rejects_invalid_tag_items(valid_quote, invalid_tags):
    valid_quote["tags"] = invalid_tags

    result = quote_validate(valid_quote)

    assert result == {
        "is_valid": False,
        "error": "Los tags deben ser cadenas no vacías",
    }
