// Seed de los agentes de Playwright: es configuración, no un test de la tarea.
// No cuenta dentro de los 10 tests y no aparece en el reporte (ver testIgnore en playwright.config.ts).
// Los agentes lo ejecutan antes de trabajar y lo usan como punto de partida. No lo elimine.
import { test } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
  });
});
