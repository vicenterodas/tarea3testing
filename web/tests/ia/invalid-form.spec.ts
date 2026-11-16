// spec: tests/plan-final.md
// seed: tests/seed.spec.ts
import { test, expect } from '../support/test-data';

test.describe('Etiquetas y validación', () => {
  test('Corregir un formulario inválido y enviarlo', { tag: ['@ia', '@codex'] }, async ({ page, testData }) => {
    const text = `IA4 ${testData.token}`;
    const source = `Fuente IA4 ${testData.token}`;
    const dialog = page.getByRole('dialog', { name: 'Nueva frase', exact: true });
    const isPost = (r: import('@playwright/test').Response) => r.url() === 'http://127.0.0.1:5000/quotes/add' && r.request().method() === 'POST';
    // 1. Abrir Nueva frase, escribir texto propio y seleccionar Marie Curie.
    await page.goto('/quotes');
    await page.getByRole('button', { name: 'Nueva frase', exact: true }).click();
    await dialog.getByRole('textbox', { name: 'Frase', exact: true }).fill(text);
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Marie Curie', exact: true }).click();
    // 2. Dejar Fuente vacía y pulsar Añadir.
    await expect(dialog.getByRole('textbox', { name: 'Fuente', exact: true })).toHaveValue('');
    const invalidPost = page.waitForResponse(isPost);
    await dialog.getByRole('button', { name: 'Añadir', exact: true }).click();
    const invalidResponse = await invalidPost;
    // 3. Comprobar error, diálogo abierto, valores conservados, API 400 y ausencia de frase.
    expect(invalidResponse.status()).toBe(400);
    await expect(dialog.getByRole('alert')).toContainText('La fuente no es válida');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Frase', exact: true })).toHaveValue(text);
    await expect(dialog.getByRole('combobox')).toHaveText('Marie Curie');
    const listResponse = await testData.api.get('/quotes');
    await expect(listResponse).toBeOK();
    expect((await listResponse.json()).filter((q: { quote: string }) => q.quote === text)).toEqual([]);
    // 4. Completar fuente y enviar; registrar el POST antes de assertions posteriores.
    await dialog.getByRole('textbox', { name: 'Fuente', exact: true }).fill(source);
    const validPost = page.waitForResponse(isPost);
    await dialog.getByRole('button', { name: 'Añadir', exact: true }).click();
    const validResponse = await validPost;
    const created = await validResponse.json();
    testData.trackQuote(created);
    expect(validResponse.status()).toBe(201);
    // 5. Comprobar éxito, abrir Ver y verificar texto, personaje y fuente del detalle.
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Frase añadida exitosamente', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ver', exact: true }).click();
    await expect(page).toHaveURL(`/quotes/${created.id}`);
    await expect(page.getByRole('heading', { name: text, exact: true })).toBeVisible();
    await expect(page.getByTestId(created.character.id)).toContainText('Marie Curie');
    await expect(page.getByTestId(created.character.id)).toContainText(source);
  });
});
