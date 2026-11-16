// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Catálogo y eliminación', () => {
  test('Filtrar por personaje y volver a Todos', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const a = await testData.createQuote({ quote: `IA1 A ${testData.token}`, character: `IA1 Alfa ${testData.token}` });
    const b = await testData.createQuote({ quote: `IA1 B ${testData.token}`, character: `IA1 Beta ${testData.token}` });
    const cards = page.getByTestId('quotes-grid').locator('[data-slot="card"]');
    // 1. Abrir /quotes y comprobar que ambas frases se muestran.
    await page.goto('/quotes');
    await expect(cards.filter({ hasText: a.quote })).toBeVisible();
    await expect(cards.filter({ hasText: b.quote })).toBeVisible();
    // 2. Abrir el combobox de personaje y seleccionar el personaje de la primera.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: a.character.name, exact: true }).click();
    await expect(page.getByPlaceholder('Search or create new')).toBeHidden();
    // 3. Comprobar primera visible, otra ausente y tarjetas del personaje seleccionado.
    await expect(cards.filter({ hasText: a.quote })).toBeVisible();
    await expect(cards.filter({ hasText: b.quote })).toHaveCount(0);
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText(a.character.name);
    // 4. Seleccionar Todos sin introducir búsqueda de texto.
    await expect(page.getByPlaceholder('Buscar frases...')).toHaveValue('');
    // El control no expone nombre accesible; el texto distingue el botón del buscador.
    await page.getByRole('combobox').filter({ hasText: a.character.name }).click();
    await page.getByRole('option', { name: 'Todos', exact: true }).click();
    // 5. Comprobar que ambas frases vuelven a aparecer.
    await expect(cards.filter({ hasText: a.quote })).toBeVisible();
    await expect(cards.filter({ hasText: b.quote })).toBeVisible();
  });
});
