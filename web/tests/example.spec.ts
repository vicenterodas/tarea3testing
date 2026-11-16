import { test, expect, apiBaseURL } from './support/test-data';

// ⚠️ Asegúrate de que la API esté corriendo antes de ejecutar las pruebas ⚠️
// No es necesario iniciar la app web manualmente. Ya que en playwright.config.ts se configuró el webServer
// con la baseURL de la app: 'http://localhost:4173', es decir '/' apunta a 'http://localhost:4173'

test('añadir frase exitosamente', { tag: '@manual' }, async ({ page, testData }) => {
  const quoteText = `La poderosa nueva frase de prueba ${testData.token}`;
  await page.goto(`/`);
  // Si le aparece un error durante la ejecución de los tests relacionado con config.webServer
  // descomenta la siguiente línea y comenta la línea anterior; y en playwright.config.ts comenta el webServer (lineas 74-80)
  // y corre los tests mientras la web app está corriendo en localhost:5173
  // await page.goto(`http://localhost:5173`);

  await page.getByRole('button', { name: 'Nueva frase' }).click();

  await page.getByRole('textbox', { name: 'Frase' }).fill(quoteText);
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Marie Curie' }).click();
  await page.getByLabel('Fuente').fill('Speech');
  await page.getByLabel('Etiquetas').fill('science');

  const createdResponsePromise = page.waitForResponse(response =>
    response.url() === `${apiBaseURL}/quotes/add` && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Añadir' }).click();
  const createdResponse = await createdResponsePromise;
  expect(createdResponse.status()).toBe(201);
  testData.trackQuote(await createdResponse.json());

  await expect(page.getByText('Frase añadida exitosamente')).toBeVisible();
  await page.getByRole('button', { name: 'Ver' }).click();
  await expect(page.getByRole('heading', { level: 1, name: quoteText, exact: true })).toBeVisible();

  // La fixture testData elimina la frase incluso si falla una assertion anterior.

});

// Recuerda la existencia de la existencia de 
// data-testid={character.id} en la vista de una frase
// data-testid="quotes-grid" en el grid de frases
// puede ser útil para seleccionar elementos en las pruebas.

// Nota: Si agregas frases o personajes recuerda que puedes eliminarlos usando la API directamente, 
// llamando a los endpoints correspondientes, para mejorar la independencia de las pruebas.

// Nota: Cuidado con crear la misma frase varias veces en tests diferentes y la paralelización de tests
