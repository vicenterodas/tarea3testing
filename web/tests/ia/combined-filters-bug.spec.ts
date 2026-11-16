// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Bugs de la aplicación', () => {
  test('bug: combinar búsqueda con filtro de personaje', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const fragment = `Coincidencia ${testData.token}`;
    const character = `IA5 Alfa ${testData.token}`;
    const a = await testData.createQuote({ quote: `A ${fragment}`, character });
    const b = await testData.createQuote({ quote: `B sin fragmento ${testData.token}`, character });
    const c = await testData.createQuote({ quote: `C ${fragment}`, character: `IA5 Beta ${testData.token}` });
    const cards = page.getByTestId('quotes-grid').locator('[data-slot="card"]');
    // 1. Abrir /quotes, buscar el fragmento y comprobar A y C visibles, pero no B.
    await page.goto('/quotes');
    await expect(cards.filter({ hasText: b.quote })).toBeVisible();
    await page.getByPlaceholder('Buscar frases...').fill(fragment);
    await expect(cards.filter({ hasText: a.quote })).toBeVisible();
    await expect(cards.filter({ hasText: c.quote })).toBeVisible();
    await expect(cards.filter({ hasText: b.quote })).toHaveCount(0);
    await expect(cards).toHaveCount(2);
    // 2. Seleccionar el personaje de A y B.
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: character, exact: true }).click();
    // 3. Comprobar que C desaparece y A continúa visible.
    await expect(cards.filter({ hasText: c.quote })).toHaveCount(0);
    await expect(cards.filter({ hasText: a.quote })).toBeVisible();
    await expect(page.getByPlaceholder('Buscar frases...')).toHaveValue(fragment);
    // 4. Comprobar que B no aparece y la grilla contiene una sola tarjeta al combinar ambos filtros.
    test.fail(true, 'Bug confirmado en QuotesGrid.tsx: seleccionar personaje descarta la búsqueda y vuelve a mostrar B.');
    await expect.soft(cards.filter({ hasText: b.quote })).toHaveCount(0);
    await expect(cards).toHaveCount(1);
  });
});
