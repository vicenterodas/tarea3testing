# Web App DCCuote

El *frontend* está desarrollado en **React** (con **TypeScript**) y usaremos [Playwright](https://playwright.dev/docs/intro) para los tests.  
Es altamente recomendable explorar la documentación de [Playwright](https://playwright.dev/docs/intro).

## Requisitos
Antes de levantar la aplicación, debe confirmar que:
- Tiene instalado [Node.js](https://nodejs.org/en) en su dispositivo.
- Tiene levantado el **backend** en [http://127.0.0.1:5000/](http://127.0.0.1:5000/) (como se establece por defecto) ⚠️

## Levantar la aplicación
Posicionándose en la carpeta `web`, siga los siguientes pasos para levantar la aplicación de manera local:

1. Ejecute el comando:
    ```bash
    npm install
    ```
    Esto instalará todas las dependencias necesarias.

2. Posteriormente, ejecute:
    ```bash
    npm run dev
    ```
    Esto debería levantar la aplicación en *localhost* y mostrar lo siguiente:
    ```
    ➜  Local:   http://localhost:5173/
    ```

## Ejecutar los tests
⚠️ Para ejecutar los tests, es necesario tener el backend levantado en [http://127.0.0.1:5000/](http://127.0.0.1:5000/) y haber instalado las dependencias con `npm install`.

Posteriormente, posicionándose en la carpeta `web`, siga los siguientes pasos para ejecutar los tests end-to-end (E2E):

1. Configure **Playwright** instalando el navegador (la primera vez y cada vez que actualice Playwright):
    ```bash
    npx playwright install chromium
    ```

2. Ejecute los tests:
    ```bash
    npx playwright test
    ```
    *(Puede tardar un poco, ya que en cada ejecución se crea un build sobre el cual se ejecutan los tests.)*

3. Vea el reporte generado por Playwright:
    ```bash
    npx playwright show-report
    ```

Si todo salió bien, debería poder ver el siguiente mensaje en consola:
```bash
Running 1 test using 1 worker
  1 passed (15.0s)

To open last HTML report run:

  npx playwright show-report
```

> 💡 No es necesario iniciar la aplicación web manualmente (`npm run dev`), ya que en `playwright.config.ts` el `webServer` construye y levanta la app en `http://localhost:4173`, y la `baseURL` hace que `'/'` apunte a esa dirección. Puede ver el resto de la configuración en [playwright.config.ts](./playwright.config.ts).

### Crear nuevos tests
Puede crear nuevos tests en la carpeta [tests](./tests/), donde también podrá encontrar el test de ejemplo visto en clases.

**Aclaración:** si por alguna razón levantó el backend en otro puerto, debe configurarlo en el frontend cambiando `baseUrl` en [./src/api.tsx](./src/api.tsx) y, en los tests, cambiando `apiBaseURL` en [example.spec.ts](./tests/example.spec.ts).

### Problemas comunes
> ⚠️ Nota: si le aparece un error durante la ejecución de los tests relacionado con `config.webServer`, en [example.spec.ts](./tests/example.spec.ts) descomente la línea 22 y comente la línea 18; y en [playwright.config.ts](./playwright.config.ts) comente el `webServer` (líneas 74-78). Ahora, para correr los tests, deberá asegurarse de que la web app esté corriendo en localhost:5173 con `npm run dev`.
```js
await page.goto(`http://localhost:5173`);
```

> ⚠️ Nota: ejecutar los tests desde WSL puede generar problemas; se recomienda hacerlo desde la terminal nativa del sistema.


## Generar tests con los agentes de IA de Playwright

De los 10 tests de la tarea, 6 deben generarse con los [Playwright Test Agents](https://playwright.dev/docs/test-agents):

- **Planner:** explora la aplicación y genera un plan de pruebas en Markdown.
- **Generator:** genera los tests a partir del plan y verifica los selectores y assertions sobre la aplicación en ejecución.
- **Healer:** ejecuta los tests e intenta reparar los que fallan.

### 1. Elegir un asistente e instalar los agentes

Puede usar el asistente de IA que prefiera. La instalación y la configuración de cada uno se detallan en su guía:

- [Playwright agents para GitHub Copilot en VS Code](./docs/playwright-copilot.md)
- [Playwright agents para Claude Code](./docs/playwright-claude.md)
- [Playwright agents para Antigravity](./docs/playwright-gemini.md)


Los agentes se instalan desde la carpeta `web`, reemplazando `<asistente>` por `vscode`, `codex` o `claude`:
```bash
npx playwright init-agents --loop=<asistente>
```

> ⚠️ Antigravity no está soportado en `--loop`, así que debe seguir los pasos de [su guía](./docs/playwright-gemini.md).

### 2. Generar y refinar el plan

1. **Generación:** pídale al agente Planner un plan de pruebas con los flujos que desee probar. Guárdelo sin modificaciones en `./web/tests/plan-planner.md`.
2. **Refinamiento:** de manera manual o con IA, seleccione los flujos que desee ejecutar y haga las correcciones necesarias. Guarde el resultado en `./web/tests/plan-final.md`.

Ambos archivos deben incluirse en su entrega.

### 3. Generar y reparar los tests

Ejecute el agente Generator a partir de `plan-final.md`. Si un test falla o no prueba el comportamiento esperado, puede usar el agente Healer o refinarlo manualmente. Los tests deben cumplir los mismos criterios de validación que los escritos a mano.

### 4. Agregar los tags

Todos los tests deben indicar su origen con [tags de Playwright](https://playwright.dev/docs/test-annotations#tag-tests): `@manual` para los escritos manualmente, y `@ia` junto con el tag del asistente (por ejemplo, `@copilot`, `@codex`, `@claude` o `@antigravity`) para los generados con los agentes:
```ts
test('crear frase', { tag: '@manual' }, async () => { ... });
test('agregar etiquetas a una frase', { tag: ['@ia', '@claude'] }, async () => { ... });
```

## Formas de ejecutar los tests con Playwright

A partir de ahora puede ejecutar comandos de **Playwright**, como por ejemplo:

**Ejecutar un solo archivo de tests:**
```bash
npx playwright test example.spec.ts
```

**Ejecutar codegen** (para generar los tests con UI). Requiere tener la app corriendo con `npm run dev` en otra terminal:
```bash
npx playwright codegen http://localhost:5173/
```

**Ejecutar los tests en modo UI:**
```bash
npx playwright test --ui
```

**Ejecutar los tests en modo headed** (ver cómo Playwright interactúa con la web):
```bash
npx playwright test --headed
```


**Ver el trace de los tests:**
```bash
npx playwright test --trace on
npx playwright show-report
```

Puede ver más comandos en https://playwright.dev/docs/intro
