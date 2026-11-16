// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Etiquetas y validación', () => {
  test('Añadir etiquetas y conservarlas al recargar', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const quote = await testData.createQuote({ quote: `IA3 ${testData.token}`, character: 'Marie Curie', tags: [] });
    const newTag = `nueva-${testData.token}`;
    const names = ['science', newTag, 'life'];
    const dialog = page.getByRole('dialog', { name: 'Nuevas etiquetas para la frase' });
    const catalogResponse = await testData.api.get('/tags');
    await expect(catalogResponse).toBeOK();
    const catalog: { id: string; name: string }[] = await catalogResponse.json();
    // 1. Abrir su detalle, comprobar texto y pulsar Add Tag.
    await page.goto(`/quotes/${quote.id}`);
    await expect(page.getByRole('heading', { name: quote.quote, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Add Tag', exact: true }).click();
    // 2. Escribir etiquetas con espacios y una entrada vacía y pulsar Agregar etiquetas.
    await dialog.getByPlaceholder('chile, humor, tv').fill(` science, ${newTag}, , life `);
    await dialog.getByRole('button', { name: 'Agregar etiquetas', exact: true }).click();
    // 3. Comprobar éxito, cierre y exactamente las tres etiquetas normalizadas, una vez cada una.
    await expect(page.getByText('Etiquetas añadidas exitosamente', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();
    for (const name of names) {
      await expect(page.getByText(name, { exact: true })).toHaveCount(1);
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    // 4. Consultar frase por API y comprobar nombres e IDs persistidos.
    const persistedResponse = await testData.api.get(`/quotes/${quote.id}`);
    await expect(persistedResponse).toBeOK();
    const persisted = await persistedResponse.json();
    expect(persisted.tags.map((tag: { name: string }) => tag.name).sort()).toEqual([...names].sort());
    expect(new Set(persisted.tags.map((tag: { id: string }) => tag.id)).size).toBe(3);
    for (const tag of persisted.tags) {
      expect(tag.id).toEqual(expect.any(String));
      expect(tag.id.length).toBeGreaterThan(0);
      if (tag.name !== newTag) expect(tag.id).toBe(catalog.find(item => item.name === tag.name)?.id);
    }
    // 5. Recargar y comprobar que las tres etiquetas siguen visibles.
    await page.reload();
    await expect(page.getByRole('heading', { name: quote.quote, exact: true })).toBeVisible();
    for (const name of names) {
      await expect(page.getByText(name, { exact: true })).toHaveCount(1);
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });
});
