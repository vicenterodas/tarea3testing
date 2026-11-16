// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Bugs de la aplicación', () => {
  test('bug: no duplicar visualmente una etiqueta existente', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const quote = await testData.createQuote({ quote: `IA6 ${testData.token}`, character: 'Marie Curie', tags: ['science'] });
    expect(quote.tags).toHaveLength(1);
    expect(quote.tags[0].name).toBe('science');
    const science = page.getByText('science', { exact: true });
    const dialog = page.getByRole('dialog', { name: 'Nuevas etiquetas para la frase' });
    // 1. Abrir detalle y comprobar que science aparece una sola vez.
    await page.goto(`/quotes/${quote.id}`);
    await expect(page.getByRole('heading', { name: quote.quote, exact: true })).toBeVisible();
    await expect(science).toHaveCount(1);
    await expect(science).toBeVisible();
    // 2. Pulsar Add Tag, enviar science y esperar éxito y cierre del diálogo.
    await page.getByRole('button', { name: 'Add Tag', exact: true }).click();
    await dialog.getByPlaceholder('chile, humor, tv').fill('science');
    await dialog.getByRole('button', { name: 'Agregar etiquetas', exact: true }).click();
    await expect(page.getByText('Etiquetas añadidas exitosamente', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
    // 3. Comprobar por API que solo existe una relación con la etiqueta original.
    const persistedResponse = await testData.api.get(`/quotes/${quote.id}`);
    await expect(persistedResponse).toBeOK();
    const persisted = await persistedResponse.json();
    expect(persisted.tags).toEqual([{ id: quote.tags[0].id, name: 'science' }]);
    // 4. Exigir exactamente una instancia visible de science antes de recargar.
    test.fail(true, 'Bug confirmado en QuoteView.tsx: concatenar una etiqueta existente muestra dos copias en UI aunque la API conserva una.');
    await expect(science.filter({ visible: true })).toHaveCount(1);
  });
});
