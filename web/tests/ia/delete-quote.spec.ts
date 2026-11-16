// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Catálogo y eliminación', () => {
  test('Cancelar y luego confirmar eliminación de una frase', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const quote = await testData.createQuote({ quote: `IA2 ${testData.token}`, character: 'Marie Curie', tags: [] });
    const card = page.getByTestId('quotes-grid').locator('[data-slot="card"]').filter({ hasText: quote.quote });
    const dialog = page.getByRole('dialog', { name: '¿Deseas eliminar la frase?' });
    // 1. Abrir /quotes, localizar tarjeta propia y activar Psycho Killer Mode mediante switch.
    await page.goto('/quotes');
    await expect(card).toBeVisible();
    await page.getByRole('switch').check();
    // 2. Abrir papelera, comprobar texto del diálogo y cancelar.
    await card.getByRole('button').click();
    await expect(dialog).toContainText(quote.quote);
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
    // 3. Comprobar tarjeta permanece y API todavía devuelve la frase.
    await expect(dialog).toBeHidden();
    await expect(card).toBeVisible();
    const preserved = await testData.api.get(`/quotes/${quote.id}`);
    expect(preserved.status()).toBe(200);
    expect(await preserved.json()).toMatchObject({ id: quote.id, quote: quote.quote });
    // 4. Volver a abrir confirmación y pulsar Eliminar.
    await card.getByRole('button').click();
    await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
    // 5. Comprobar que se cierra el diálogo y desaparece la tarjeta.
    await expect(dialog).toBeHidden();
    await expect(card).toHaveCount(0);
    // 6. Recargar, comprobar ausencia persistente y API 404.
    const loaded = page.waitForResponse(r => r.url() === 'http://127.0.0.1:5000/quotes' && r.request().method() === 'GET');
    await page.reload();
    expect((await loaded).ok()).toBe(true);
    await expect(card).toHaveCount(0);
    expect((await testData.api.get(`/quotes/${quote.id}`)).status()).toBe(404);
  });
});
