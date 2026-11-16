# Agentes de Playwright con VS Code y GitHub Copilot

Playwright (desde la versión 1.56) incluye tres **agentes de testing** que se pueden usar desde un asistente de IA:

| Agente | Qué hace | Entrada | Salida |
|---|---|---|---|
| 🎭 **Planner** (`playwright-test-planner`) | Explora la app en un navegador real y escribe un plan de pruebas en Markdown. | Una petición (ej. *"plan de DCCuote agrupado por funcionalidad"*) + el *seed test*. | `tests/plan-planner.md` |
| 🎭 **Generator** (`playwright-test-generator`) | Convierte el plan en tests de Playwright, verificando selectores y aserciones en vivo. | El plan refinado, `tests/plan-final.md`. | `tests/<escenario>.spec.ts` |
| 🎭 **Healer** (`playwright-test-healer`) | Ejecuta los tests, depura los que fallan y los repara (o los marca como `skip` si cree que la funcionalidad está rota). | El nombre del test que falla (o "todos"). | Tests corregidos |

Los agentes son instrucciones + un **servidor MCP** (`playwright-test`) que le da a Copilot herramientas para controlar el navegador y el test runner. Playwright genera todo con un solo comando: `npx playwright init-agents --loop=vscode`. En VS Code aparecen como **agentes personalizados** (*custom agents*) del chat de Copilot.

> ⚠️ Los agentes **asisten**, no reemplazan su criterio. Revise cada plan y cada test generado: usted es responsable de lo que entrega.

## ¿Qué plan de Copilot necesito?

Los agentes funcionan con cualquier plan de Copilot que incluya **modo agente** y **servidores MCP** en VS Code, incluido el gratuito:

| Plan | Costo | Qué incluye (noviembre 2026) |
|---|---|---|
| **Copilot Student** | Gratis para estudiantes verificados en GitHub Education | 200 créditos de IA al mes. El modelo se elige solo en modo **Auto** (no se puede elegir Claude Sonnet/Opus a mano). |
| **Copilot Free** | Gratis para cualquier cuenta GitHub | Uso limitado de chat y agente, con modelos pequeños (por ejemplo Haiku 4.5 o GPT-5 mini). |
| **Copilot Pro / Pro+** | US$10 / US$39 al mes | Más créditos y todos los modelos. |

💡 **Recomendado para el curso: Copilot Student.** Como alumno de la UC puede verificarse con su correo `@uc.cl` (pasos en la sección 2.1). GitHub revisa la elegibilidad cada mes.

> ⚠️ Los agentes hacen muchas llamadas por tarea (explorar, generar y reparar consumen varias solicitudes cada uno). Con los planes gratuitos los créditos se acaban rápido: pida **un escenario a la vez**, revise el resultado y no le pida al healer "arreglar todo" repetidamente.

---

## 1. Requisitos

- **Node.js 18+** y las dependencias de `web/` instaladas (`npm install`). Este proyecto ya usa `@playwright/test` 1.64, que incluye los agentes.
- El navegador de Playwright instalado: `npx playwright install chromium`.
- El **backend** corriendo en [http://127.0.0.1:5000](http://127.0.0.1:5000) (vea [api/README.md](../../api/README.md)).
- **VS Code 1.105 o superior** (requerido por Playwright para los agentes) con **GitHub Copilot** habilitado.
- Una **cuenta GitHub** con un plan de Copilot (ver la tabla anterior).

## 2. Instalación

### 2.1 Activar Copilot (gratis)

**Como estudiante (Copilot Student):**
1. Entre a [github.com/settings/education/benefits](https://github.com/settings/education/benefits).
2. Si aún no está verificado, haga clic en **Start an application** y complete la verificación (correo institucional y comprobante de alumno regular).
3. Una vez aprobado, en *Free GitHub developer resources for students and teachers* haga clic en **Learn more** y siga los pasos para activar **Copilot Student**.

> La aprobación puede tardar unos días. Mientras tanto puede usar **Copilot Free**, que se activa solo al iniciar sesión con GitHub en VS Code.

### 2.2 Instalar VS Code y Copilot

1. Instale [VS Code](https://code.visualstudio.com/download) (o actualícelo con *Help → Check for Updates*). Verifique que la versión sea 1.105 o superior.
2. Abra la vista de **Chat** (`Ctrl+Alt+I`, en macOS `Ctrl+Cmd+I`) e inicie sesión con su cuenta GitHub. VS Code instala y habilita Copilot automáticamente. Si no, instale la extensión [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat).
3. (Opcional, recomendado) Instale la extensión [Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) para ejecutar y depurar los tests desde el editor.

### 2.3 Inicializar los agentes en el proyecto

Posicionándose en la carpeta `web`, ejecute:
```bash
npx playwright init-agents --loop=vscode
```

> `--loop=vscode` y `--loop=copilot` generan exactamente lo mismo. Evite `--loop=vscode-legacy`, que crea los antiguos *chat modes* para versiones viejas de VS Code.

Esto crea:
```
web/
├── .github/
│   ├── agents/
│   │   ├── playwright-test-planner.agent.md     # definición de cada agente
│   │   ├── playwright-test-generator.agent.md
│   │   └── playwright-test-healer.agent.md
│   └── workflows/copilot-setup-steps.yml        # solo para el Copilot coding agent en GitHub (no se usa aquí)
├── .vscode/mcp.json                             # registra el servidor MCP "playwright-test"
├── specs/README.md                              # carpeta por defecto de los planes (en esta tarea no se usa)
└── tests/seed.spec.ts                           # seed test (ya incluido en el código base)
```

El comando además imprime un `TODO: GitHub > Settings > Copilot > Coding agent > MCP configuration`. Eso es para el agente de Copilot que corre en la nube de GitHub; **no lo necesita** para usar los agentes en VS Code. Puede borrar `.github/workflows/copilot-setup-steps.yml`.

> 🔁 Vuelva a ejecutar `npx playwright init-agents --loop=vscode` **cada vez que actualice Playwright**, para obtener las herramientas e instrucciones nuevas.

### 2.4 Ajustar el modelo (planes gratuitos)

Playwright deja fijado el modelo en cada agente:
```yaml
model: Claude Sonnet 4.6
```

Con **Copilot Student** (solo modo Auto) o **Copilot Free** ese modelo puede no estar disponible. En ese caso, **borre la línea `model:`** de los tres archivos en `web/.github/agents/`: así el agente usa el modelo seleccionado en el chat (Auto). Con Copilot Pro/Pro+ puede dejarla o cambiarla por otro modelo de su lista.

Recuerde repetir este paso si vuelve a ejecutar `init-agents`.

### 2.5 El *seed test* ya está incluido

Los agentes ejecutan `tests/seed.spec.ts` antes de trabajar: así obtienen la configuración, el `webServer`, fixtures y hooks, y lo usan como modelo para los tests que generan. El código base ya lo incluye, así que no necesita crearlo ni configurarlo, y `init-agents` lo conserva. No lo elimine.

El seed es parte de la configuración: no cuenta dentro de los 10 tests y `npx playwright test` lo excluye, por lo que no aparece en el reporte.

Como `playwright.config.ts` define el `webServer` y `baseURL: 'http://localhost:4173'`, no necesita levantar la web a mano; **sí** debe tener el backend corriendo.

### 2.6 Verificar la conexión

1. Abra **la carpeta `web/`** en VS Code (*File → Open Folder…*), no la raíz del repositorio: VS Code busca `.github/agents/` y `.vscode/mcp.json` en la raíz del workspace.
   ```bash
   code web
   ```
2. Abra el Chat. En el selector de agentes (donde dice *Agent* / *Ask*) deberían aparecer `playwright-test-planner`, `playwright-test-generator` y `playwright-test-healer`.
3. Abra `.vscode/mcp.json`: sobre `playwright-test` aparece la acción **Start**. Inícielo y acepte el aviso de confianza (revise antes que el comando sea `npx playwright run-test-mcp-server`). También puede hacerlo con el comando `MCP: List Servers` (`Ctrl+Shift+P`).
4. En el chat, con un agente de Playwright seleccionado, abra **Configure Tools** y confirme que aparecen las herramientas de `playwright-test`.

## 3. Uso

Seleccione el agente en el **selector de agentes** del chat y escriba su petición. Use los agentes en orden: **planner → generator → healer**.

### 3.1 Planner: crear el plan de pruebas

Pídale **un solo plan** para toda la aplicación, no uno por funcionalidad. Por ejemplo:

Agente: `playwright-test-planner`
```text
Crea un único plan de pruebas para DCCuote,
con los escenarios agrupados por funcionalidad.
Seed file: tests/seed.spec.ts
Guarda el plan en tests/plan-planner.md
```

Este prompt es **solo un ejemplo** con lo básico: experimente con sus propios prompts para obtener un mejor plan. Lo que no debería faltar es el pedido de un solo plan agrupado por funcionalidad, el seed y la ruta `tests/plan-planner.md` (por defecto, el agente usa `specs/`). También le puede servir pedir casos de error o más escenarios de los que va a usar, para tener de dónde elegir al refinar.

El agente abre el navegador, explora la app y guarda un plan con escenarios numerados (1.1, 1.2, …), cada uno con pasos y resultados esperados. **No edite este archivo:** debe entregarse sin modificaciones.

> 💡 Puede adjuntar archivos al contexto del chat (`#` o arrastrándolos), por ejemplo `#seed.spec.ts` para el planner o `#plan-final.md` para el generator, en vez de escribir la ruta.

### 3.2 Refinar el plan

1. Copie `tests/plan-planner.md` a `tests/plan-final.md`.
2. Refine **solo `tests/plan-final.md`**, de forma manual o con IA: deje los flujos que quiere generar y corrija lo necesario.

Recuerde que la suite debe tener exactamente 10 tests, 6 de ellos generados con los agentes, y que ningún flujo debe ser redundante con otro. Si falta alguno de los dos planes en la entrega, todos los tests generados con IA se consideran inválidos (se descuentan 1.8 puntos).

### 3.3 Generator: generar los tests

Agente: `playwright-test-generator`
```text
Genera los tests del escenario 1.1 del plan tests/plan-final.md
```

El agente ejecuta cada paso en vivo, verifica los selectores y escribe un archivo en `tests/` con comentarios `// spec:` y `// seed:` que lo enlazan al plan. Pida un escenario a la vez para revisarlos con calma.

### 3.4 Healer: reparar tests que fallan

Agente: `playwright-test-healer`
```text
Repara el test "añadir frase exitosamente" de tests/example.spec.ts
```

O, con cuidado por el consumo de créditos:
```text
Ejecuta todos los tests y repara los que fallan.
```

El healer re-ejecuta el test, inspecciona la UI, propone un cambio (locator, espera, datos) y repite hasta que pasa. Si concluye que la app está rota, marca el test como `skip`: **revise esos casos**, podría ser un bug real de la aplicación (que es justamente lo que buscamos encontrar).

VS Code le pedirá confirmar algunas acciones (ejecutar herramientas, editar archivos). Lea qué va a hacer antes de aceptar.

### 3.5 Ejecutar y revisar los tests

Después de usar los agentes, ejecute los tests como siempre:
```bash
npx playwright test
npx playwright show-report
```

O desde la vista **Testing** de VS Code si instaló la extensión de Playwright.

### Consejos para DCCuote

- Pida explícitamente que los tests **limpien los datos** que crean (por ejemplo, borrando la frase con la API, como en [example.spec.ts](../tests/example.spec.ts)) y que no repitan la misma frase entre tests, porque se ejecutan en paralelo.
- Indique los `data-testid` útiles que menciona [example.spec.ts](../tests/example.spec.ts) (`quotes-grid`, `data-testid={character.id}`).
- Si un agente no logra abrir la app, revise que el backend esté arriba y que `npx playwright test` funcione por sí solo.

## 4. Problemas comunes

- **No aparecen los agentes en el chat**: abra `web/` como carpeta del workspace (no la raíz del repo), actualice VS Code a 1.105+ y recargue la ventana (`Developer: Reload Window`).
- **El servidor `playwright-test` no arranca**: inícielo desde `.vscode/mcp.json` o con `MCP: List Servers` y revise su salida (*Show Output*). Compruebe que `npx playwright --version` funciona en la terminal de VS Code.
- **Error de modelo no disponible**: borre la línea `model:` de los agentes (sección 2.4).
- **Se acabaron los créditos**: en los planes gratuitos el cupo es mensual. Revise su uso en [github.com/settings/copilot](https://github.com/settings/copilot).
- **`.vscode/mcp.json` no aparece en git**: es normal, [web/.gitignore](../.gitignore) ignora `.vscode/*`. Cada integrante debe ejecutar `init-agents` en su máquina.
- **Errores con `config.webServer`**: aplique la misma solución que en [README.md](../README.md#problemas-comunes) (usar `npm run dev` y `http://localhost:5173`), y actualice el seed para usar esa URL.

---

## Referencias

**Playwright**
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) — documentación oficial de los agentes (planner, generator, healer, `init-agents`).
- [Playwright: Getting started con VS Code](https://playwright.dev/docs/getting-started-vscode)
- [Playwright: Installation / Getting started](https://playwright.dev/docs/intro)
- [Playwright: Command line (`npx playwright ...`)](https://playwright.dev/docs/test-cli)
- [Playwright: Locators](https://playwright.dev/docs/locators) y [Assertions](https://playwright.dev/docs/test-assertions) — útiles para revisar los tests generados.

**VS Code**
- [Descargar VS Code](https://code.visualstudio.com/download)
- [Custom agents en VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Servidores MCP en VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [Extensión Playwright Test for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

**GitHub Copilot**
- [Planes de Copilot](https://github.com/features/copilot/plans)
- [Acceder a Copilot gratis como estudiante](https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students)
- [Postular a GitHub Education como estudiante](https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student)
- [Cambios al plan Copilot Student (2026)](https://github.com/orgs/community/discussions/189268)

**Herramientas**
- [Node.js](https://nodejs.org/en)
