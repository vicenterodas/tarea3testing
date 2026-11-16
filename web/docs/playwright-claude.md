# Agentes de Playwright con Claude Code

Playwright (desde la versión 1.56) incluye tres **agentes de testing** que se pueden usar desde un asistente de IA:

| Agente | Qué hace | Entrada | Salida |
|---|---|---|---|
| 🎭 **Planner** (`playwright-test-planner`) | Explora la app en un navegador real y escribe un plan de pruebas en Markdown. | Una petición (ej. *"plan de DCCuote agrupado por funcionalidad"*) + el *seed test*. | `tests/plan-planner.md` |
| 🎭 **Generator** (`playwright-test-generator`) | Convierte el plan en tests de Playwright, verificando selectores y aserciones en vivo. | El plan refinado, `tests/plan-final.md`. | `tests/<escenario>.spec.ts` |
| 🎭 **Healer** (`playwright-test-healer`) | Ejecuta los tests, depura los que fallan y los repara (o los marca como `skip` si cree que la funcionalidad está rota). | El nombre del test que falla (o "todos"). | Tests corregidos |

Los agentes son instrucciones + un **servidor MCP** (`playwright-test`) que le da a Claude herramientas para controlar el navegador y el test runner. Playwright genera todo con un solo comando: `npx playwright init-agents --loop=claude`.

> ⚠️ Los agentes **asisten**, no reemplazan su criterio. Revise cada plan y cada test generado: usted es responsable de lo que entrega.

---

## 1. Requisitos

- **Node.js 18+** y las dependencias de `web/` instaladas (`npm install`). Este proyecto ya usa `@playwright/test` 1.64, que incluye los agentes.
- El navegador de Playwright instalado: `npx playwright install chromium`.
- El **backend** corriendo en [http://127.0.0.1:5000](http://127.0.0.1:5000) (vea [api/README.md](../../api/README.md)).
- **Claude Code** instalado y con sesión iniciada. Necesita una cuenta Claude **Pro, Max, Team o Enterprise**, o una cuenta de la Claude Console (API, pago por uso). El plan gratuito de Claude.ai no incluye Claude Code.
- En Windows, Claude Code necesita [Git for Windows](https://git-scm.com/downloads/win).

## 2. Instalación

### 2.1 Instalar Claude Code

**macOS / Linux / WSL:**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows (CMD):**
```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

> 💡 En Windows, puede reconocer la terminal por su prompt: PowerShell muestra `PS C:\Users\...>` y CMD muestra `C:\Users\...>`, sin el `PS`.

Verifique la instalación e inicie sesión (la primera ejecución abre el navegador para autenticarse):
```bash
claude --version
claude
```

> 💡 También puede usar Claude Code desde la extensión de VS Code o la app de escritorio. Vea los enlaces al final.

### 2.2 Inicializar los agentes en el proyecto

Posicionándose en la carpeta `web`, ejecute:
```bash
npx playwright init-agents --loop=claude
```

Esto crea:
```
web/
├── .claude/agents/
│   ├── playwright-test-planner.md     # definición de cada agente (subagentes de Claude Code)
│   ├── playwright-test-generator.md
│   └── playwright-test-healer.md
├── .mcp.json                          # registra el servidor MCP "playwright-test"
├── specs/README.md                    # carpeta por defecto de los planes (en esta tarea no se usa)
└── tests/seed.spec.ts                 # seed test (ya incluido en el código base)
```

Opcional: agregue `--prompts` para que además cree plantillas de prompts en `.claude/prompts/` (incluye una que encadena planner → generator → healer).

> 🔁 Vuelva a ejecutar `npx playwright init-agents --loop=claude` **cada vez que actualice Playwright**, para obtener las herramientas e instrucciones nuevas.

### 2.3 El *seed test* ya está incluido

Los agentes ejecutan `tests/seed.spec.ts` antes de trabajar: así obtienen la configuración, el `webServer`, fixtures y hooks, y lo usan como modelo para los tests que generan. El código base ya lo incluye, así que no necesita crearlo ni configurarlo, y `init-agents` lo conserva. No lo elimine.

El seed es parte de la configuración: no cuenta dentro de los 10 tests y `npx playwright test` lo excluye, por lo que no aparece en el reporte.

Como `playwright.config.ts` define el `webServer` y `baseURL: 'http://localhost:4173'`, no necesita levantar la web a mano; **sí** debe tener el backend corriendo.

### 2.4 Verificar la conexión

Abra Claude Code **dentro de `web/`** (donde están `.mcp.json` y `playwright.config.ts`):
```bash
cd web
claude
```

- La primera vez, Claude Code le preguntará si confía en el servidor MCP `playwright-test` definido en `.mcp.json`: acéptelo.
- Escriba `/mcp` y confirme que `playwright-test` aparece como **connected**.
- Escriba `/agents` y confirme que aparecen los tres agentes `playwright-test-*`.

## 3. Uso

Puede pedirle a Claude que use un agente por su nombre, o mencionarlo con `@` (escriba `@` y elija el agente). Use los agentes en orden: **planner → generator → healer**.

### 3.1 Planner: crear el plan de pruebas

Pídale **un solo plan** para toda la aplicación, no uno por funcionalidad. Por ejemplo:

```text
@agent-playwright-test-planner Crea un único plan de pruebas para DCCuote,
con los escenarios agrupados por funcionalidad.
Seed file: tests/seed.spec.ts
Guarda el plan en tests/plan-planner.md
```

Este prompt es **solo un ejemplo** con lo básico: experimente con sus propios prompts para obtener un mejor plan. Lo que no debería faltar es el pedido de un solo plan agrupado por funcionalidad, el seed y la ruta `tests/plan-planner.md` (por defecto, el agente usa `specs/`). También le puede servir pedir casos de error o más escenarios de los que va a usar, para tener de dónde elegir al refinar.

El agente abre el navegador, explora la app y guarda un plan con escenarios numerados (1.1, 1.2, …), cada uno con pasos y resultados esperados. **No edite este archivo:** debe entregarse sin modificaciones.

### 3.2 Refinar el plan

1. Copie `tests/plan-planner.md` a `tests/plan-final.md`.
2. Refine **solo `tests/plan-final.md`**, de forma manual o con IA: deje los flujos que quiere generar y corrija lo necesario.

Recuerde que la suite debe tener exactamente 10 tests, 6 de ellos generados con los agentes, y que ningún flujo debe ser redundante con otro. Si falta alguno de los dos planes en la entrega, todos los tests generados con IA se consideran inválidos (se descuentan 1.8 puntos).

### 3.3 Generator: generar los tests

```text
@agent-playwright-test-generator Genera los tests del escenario 1.1 del plan
tests/plan-final.md
```

El agente ejecuta cada paso en vivo, verifica los selectores y escribe un archivo en `tests/` con comentarios `// spec:` y `// seed:` que lo enlazan al plan. Pida un escenario a la vez para revisarlos con calma.

### 3.4 Healer: reparar tests que fallan

```text
@agent-playwright-test-healer Ejecuta todos los tests y repara los que fallan.
```

O sobre uno específico:
```text
@agent-playwright-test-healer Repara el test "añadir frase exitosamente" de tests/example.spec.ts
```

El healer re-ejecuta el test, inspecciona la UI, propone un cambio (locator, espera, datos) y repite hasta que pasa. Si concluye que la app está rota, marca el test como `skip`: **revise esos casos**, podría ser un bug real de la aplicación (que es justamente lo que buscamos encontrar).

### 3.5 Ejecutar y revisar los tests

Después de usar los agentes, ejecute los tests como siempre:
```bash
npx playwright test
npx playwright show-report
```

### Consejos para DCCuote

- Pida explícitamente que los tests **limpien los datos** que crean (por ejemplo, borrando la frase con la API, como en [example.spec.ts](../tests/example.spec.ts)) y que no repitan la misma frase entre tests, porque se ejecutan en paralelo.
- Indique los `data-testid` útiles que menciona [example.spec.ts](../tests/example.spec.ts) (`quotes-grid`, `data-testid={character.id}`).
- Si un agente no logra abrir la app, revise que el backend esté arriba y que `npx playwright test` funcione por sí solo.

## 4. Problemas comunes

- **`playwright-test` no aparece en `/mcp`**: asegúrese de haber abierto `claude` desde `web/` y de haber aprobado el servidor. Puede revisar con `claude mcp list`.
- **Errores con `config.webServer`**: aplique la misma solución que en [README.md](../README.md#problemas-comunes) (usar `npm run dev` y `http://localhost:5173`), y actualice el seed para usar esa URL.
- **Agentes desactualizados** tras actualizar Playwright: vuelva a ejecutar `npx playwright init-agents --loop=claude`.

---

## Referencias

**Playwright**
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) — documentación oficial de los agentes (planner, generator, healer, `init-agents`).
- [Playwright: Installation / Getting started](https://playwright.dev/docs/intro)
- [Playwright: Command line (`npx playwright ...`)](https://playwright.dev/docs/test-cli)
- [Playwright: Locators](https://playwright.dev/docs/locators) y [Assertions](https://playwright.dev/docs/test-assertions) — útiles para revisar los tests generados.

**Claude Code**
- [Instalar Claude Code (setup)](https://code.claude.com/docs/en/setup)
- [Quickstart de Claude Code](https://code.claude.com/docs/en/quickstart)
- [Subagentes en Claude Code](https://code.claude.com/docs/en/sub-agents)
- [MCP en Claude Code](https://code.claude.com/docs/en/mcp)
- [Extensión de VS Code](https://code.claude.com/docs/en/vs-code)

**Herramientas**
- [Node.js](https://nodejs.org/en)
- [Git for Windows](https://git-scm.com/downloads/win) (requerido por Claude Code en Windows)
