# Agentes de Playwright con Gemini (Antigravity)

Playwright (desde la versión 1.56) incluye tres **agentes de testing** que se pueden usar desde un asistente de IA:

| Agente | Qué hace | Entrada | Salida |
|---|---|---|---|
| 🎭 **Planner** (`playwright-test-planner`) | Explora la app en un navegador real y escribe un plan de pruebas en Markdown. | Una petición (ej. *"plan de DCCuote agrupado por funcionalidad"*) + el *seed test*. | `tests/plan-planner.md` |
| 🎭 **Generator** (`playwright-test-generator`) | Convierte el plan en tests de Playwright, verificando selectores y aserciones en vivo. | El plan refinado, `tests/plan-final.md`. | `tests/<escenario>.spec.ts` |
| 🎭 **Healer** (`playwright-test-healer`) | Ejecuta los tests, depura los que fallan y los repara (o los marca como `skip` si cree que la funcionalidad está rota). | El nombre del test que falla (o "todos"). | Tests corregidos |

Los agentes son instrucciones + un **servidor MCP** (`playwright-test`) que le da al modelo herramientas para controlar el navegador y el test runner.

## ¿Gemini CLI o Antigravity?

Para usar los modelos **Gemini** de Google, use **Antigravity**:

- Desde el **18 de junio de 2026**, **Gemini CLI dejó de atender solicitudes** de cuentas individuales (gratuitas, Google AI Pro y Ultra). Google lo reemplazó por **Antigravity CLI** (comando `agy`). Gemini CLI solo sigue funcionando con una API key de Gemini o con licencias empresariales, así que esta guía no lo usa.
- **Antigravity** es la plataforma de agentes de Google y tiene dos formas de uso, que comparten la misma configuración del proyecto (`.agents/`):
  - **Antigravity CLI (`agy`)**: agente en la terminal. Es la opción **recomendada** en esta guía.
  - **Antigravity (app / IDE)**: editor de escritorio con panel de agente.
- Se inicia sesión con una **cuenta Google personal**. El plan gratuito tiene límites de uso; los planes Google AI Pro/Ultra dan más cuota.

### Diferencia con Claude Code

`npx playwright init-agents` **no tiene una opción para Antigravity** (en Playwright 1.64 las opciones de `--loop` son `claude`, `codex`, `copilot`, `opencode`, `vscode` y `vscode-legacy`). Por eso este repositorio incluye el script [scripts/playwright-agents-antigravity.mjs](../scripts/playwright-agents-antigravity.mjs), que:

1. Ejecuta `npx playwright init-agents --loop=claude` (conserva el seed test incluido y crea `specs/` y las instrucciones de los agentes).
2. Convierte cada agente en una **skill** de Antigravity: `.agents/skills/<agente>/SKILL.md`.
3. Registra el servidor MCP `playwright-test` en `.agents/mcp_config.json`.
4. Borra los archivos propios de Claude Code (`.claude/agents/` y `.mcp.json`).

> ⚠️ Los agentes **asisten**, no reemplazan su criterio. Revise cada plan y cada test generado: usted es responsable de lo que entrega.

---

## 1. Requisitos

- **Node.js 18+** y las dependencias de `web/` instaladas (`npm install`). Este proyecto ya usa `@playwright/test` 1.64, que incluye los agentes.
- El navegador de Playwright instalado: `npx playwright install chromium`.
- El **backend** corriendo en [http://127.0.0.1:5000](http://127.0.0.1:5000) (vea [api/README.md](../../api/README.md)).
- Una **cuenta Google** para iniciar sesión en Antigravity.

## 2. Instalación

### 2.1 Instalar Antigravity CLI (`agy`)

**macOS / Linux:**
```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

**Windows (CMD):**
```cmd
curl -fsSL https://antigravity.google/cli/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Verifique la instalación (puede que deba abrir una terminal nueva para que `agy` quede en el `PATH`):
```bash
agy --version
```

La primera vez que ejecute `agy` le pedirá elegir un tema, confiar en la carpeta (*workspace trust*) e iniciar sesión con su cuenta Google.

> 💡 Si prefiere una interfaz gráfica, descargue la app de Antigravity desde [antigravity.google/download](https://antigravity.google/download). La configuración de los pasos siguientes sirve para ambas.
>
> 💡 Si antes usaba Gemini CLI, el instalador de `agy` detecta su configuración y migra servidores MCP, skills y perfiles de agentes.

### 2.2 Inicializar los agentes en el proyecto

Posicionándose en la carpeta `web`, ejecute:
```bash
node scripts/playwright-agents-antigravity.mjs
```

Esto crea:
```
web/
├── .agents/
│   ├── mcp_config.json                          # servidor MCP "playwright-test"
│   └── skills/
│       ├── playwright-test-planner/SKILL.md     # instrucciones de cada agente
│       ├── playwright-test-generator/SKILL.md
│       └── playwright-test-healer/SKILL.md
├── specs/README.md                              # carpeta por defecto de los planes (en esta tarea no se usa)
└── tests/seed.spec.ts                           # seed test (ya incluido en el código base)
```

El archivo `.agents/mcp_config.json` queda así (en macOS/Linux el comando es directamente `npx`):
```json
{
  "mcpServers": {
    "playwright-test": {
      "command": "cmd",
      "args": ["/c", "npx", "playwright", "run-test-mcp-server"],
      "cwd": "C:\\ruta\\a\\dccuote\\web"
    }
  }
}
```

> 🔁 Vuelva a ejecutar `node scripts/playwright-agents-antigravity.mjs` **cada vez que actualice Playwright**, para obtener las herramientas e instrucciones nuevas. También si mueve el repositorio de carpeta, porque `cwd` guarda la ruta absoluta.

### 2.3 El *seed test* ya está incluido

Los agentes ejecutan `tests/seed.spec.ts` antes de trabajar: así obtienen la configuración, el `webServer`, fixtures y hooks, y lo usan como modelo para los tests que generan. El código base ya lo incluye, así que no necesita crearlo ni configurarlo, y `init-agents` lo conserva. No lo elimine.

El seed es parte de la configuración: no cuenta dentro de los 10 tests y `npx playwright test` lo excluye, por lo que no aparece en el reporte.

Como `playwright.config.ts` define el `webServer` y `baseURL: 'http://localhost:4173'`, no necesita levantar la web a mano; **sí** debe tener el backend corriendo.

### 2.4 Verificar la conexión

Abra Antigravity **con `web/` como workspace** (Antigravity lee `.agents/` desde la raíz del workspace, no desde subcarpetas):

```bash
cd web
agy
```

- Escriba `/mcp` y confirme que `playwright-test` aparece conectado.
- Escriba `/` y confirme que aparecen las skills `/playwright-test-planner`, `/playwright-test-generator` y `/playwright-test-healer`. Si agregó las skills con `agy` abierto, ejecute `/skills reload`.

En la **app de Antigravity**, abra la carpeta `web/` (no la raíz del repositorio) y revise las skills en el menú *Customizations* del panel del agente y los servidores en *Manage MCP servers*.

## 3. Uso

Invoque cada agente con su skill (`/nombre-de-la-skill` seguido de la petición) o nómbrelo en el prompt. Use los agentes en orden: **planner → generator → healer**.

### 3.1 Planner: crear el plan de pruebas

Pídale **un solo plan** para toda la aplicación, no uno por funcionalidad. Por ejemplo:

```text
/playwright-test-planner Crea un único plan de pruebas para DCCuote,
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
/playwright-test-generator Genera los tests del escenario 1.1 del plan
tests/plan-final.md
```

El agente ejecuta cada paso en vivo, verifica los selectores y escribe un archivo en `tests/` con comentarios `// spec:` y `// seed:` que lo enlazan al plan. Pida un escenario a la vez para revisarlos con calma.

### 3.4 Healer: reparar tests que fallan

```text
/playwright-test-healer Ejecuta todos los tests y repara los que fallan.
```

O sobre uno específico:
```text
/playwright-test-healer Repara el test "añadir frase exitosamente" de tests/example.spec.ts
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
- Si el agente intenta usar su propio navegador o escribir los tests "a mano", recuérdele que use las herramientas del servidor MCP `playwright-test` (`planner_setup_page`, `generator_setup_page`, `test_run`, etc.).
- Si un agente no logra abrir la app, revise que el backend esté arriba y que `npx playwright test` funcione por sí solo.

## 4. Problemas comunes

- **`playwright-test` no aparece en `/mcp`**: confirme que abrió `agy` (o la app) con `web/` como workspace y que existe `web/.agents/mcp_config.json`. Reinicie la sesión después de crearlo.
- **No aparecen las skills**: ejecute `/skills reload` o inicie una conversación nueva.
- **`agy` no se reconoce como comando**: abra una terminal nueva; en Windows el binario queda en `C:\Users\<usuario>\AppData\Local\agy\bin`.
- **Errores con `config.webServer`**: aplique la misma solución que en [README.md](../README.md#problemas-comunes) (usar `npm run dev` y `http://localhost:5173`), y actualice el seed para usar esa URL.

---

## Referencias

**Playwright**
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) — documentación oficial de los agentes (planner, generator, healer, `init-agents`).
- [Playwright: Installation / Getting started](https://playwright.dev/docs/intro)
- [Playwright: Command line (`npx playwright ...`)](https://playwright.dev/docs/test-cli)
- [Playwright: Locators](https://playwright.dev/docs/locators) y [Assertions](https://playwright.dev/docs/test-assertions) — útiles para revisar los tests generados.

**Antigravity**
- [Antigravity: Getting started (CLI)](https://antigravity.google/docs/getting-started?tab=cli) — instalación de `agy`.
- [Descargar la app de Antigravity](https://antigravity.google/download)
- [Antigravity: MCP](https://antigravity.google/docs/mcp)
- [Antigravity: Skills](https://antigravity.google/docs/skills)
- [Antigravity: Subagents](https://antigravity.google/docs/subagents)
- [Migración desde Gemini CLI](https://antigravity.google/docs/cli/gcli-migration/)
- [Anuncio: Gemini CLI deja de atender cuentas individuales](https://github.com/google-gemini/gemini-cli/discussions/28017)

**Herramientas**
- [Node.js](https://nodejs.org/en)
