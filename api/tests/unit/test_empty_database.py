from sqlalchemy import delete

import src.app as app_module
from src.models.models import Quote
from src.scripts.characters import character_delete
from src.scripts.quotes import quote_delete


def test_empty_database_has_no_daily_quote_or_search_results(client):
    with app_module.app.app_context():
        app_module.db.session.execute(delete(Quote))
        app_module.db.session.commit()

    daily = client.get("/quotes/daily")
    assert daily.status_code == 200
    assert daily.get_json() == {}
    quotes = client.get("/quotes")
    assert quotes.status_code == 200
    assert quotes.get_json() == []


def test_delete_helpers_ignore_missing_records_without_changing_data(client):
    before = client.get("/characters")
    assert before.status_code == 200
    with app_module.app.app_context():
        quote_delete(app_module.db, "no-existe")
        character_delete(app_module.db, "no-existe")
    after = client.get("/characters")
    assert after.status_code == 200
    assert after.get_json() == before.get_json()
