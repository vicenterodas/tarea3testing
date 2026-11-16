# Tres flujos para reescribir manualmente

`borradores-manuales.spec.ts.txt` contiene borradores preparados con IA a petición
del estudiante. La extensión `.txt` evita que Playwright los ejecute o cuente como
tests manuales ya terminados. El tag `@borrador` también indica su estado.

Reescribe estos flujos en `web/tests/manual.spec.ts`, revisa cada selector y
assertion, y usa `@manual` al terminar tu versión. Conserva el test de ejemplo,
que es el primer manual. No añadas otros casos: la entrega final necesita
exactamente cuatro manuales y seis de IA.

1. **Cancelar creación:** escribir datos, cancelar, volver a abrir el formulario y
   verificar que está vacío y que no se guardó ninguna frase.
2. **Buscar y recuperar el listado:** preparar dos frases propias, buscar una con
   mayúsculas diferentes, comprobar exclusión de la otra, buscar texto inexistente
   y limpiar la búsqueda para recuperar ambas.
3. **Abrir detalle y recargar:** preparar una frase con fuente y etiqueta, abrirla
   desde la lista y verificar URL, texto, personaje, fuente y etiqueta antes y
   después de recargar.

La fixture de `support/test-data.ts` prepara y elimina los recursos propios incluso
si falla una assertion. En estos borradores la API se usa para preparación,
verificación adicional y limpieza; el comportamiento principal se prueba en la UI.

Desde `web/`, con la API encendida y sin ejecutar pytest simultáneamente:

```sh
npx playwright test manual.spec.ts --headed
npx playwright test --grep @manual
```

Los borradores no se presentarán como escritos manualmente por el estudiante.
