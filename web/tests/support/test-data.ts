import { randomUUID } from 'node:crypto';
import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import type { Quote } from '../../src/types/Quote';

export const apiBaseURL = 'http://127.0.0.1:5000';

type QuoteInput = {
  quote: string;
  character: string;
  source: string;
  tags?: string[];
};

type TestData = {
  token: string;
  api: APIRequestContext;
  createQuote: (input?: Partial<QuoteInput>) => Promise<Quote>;
  trackQuote: (quote: Quote) => void;
};

// Esta fixture solo prepara y limpia datos. Las acciones del flujo se hacen en
// el navegador, y los recursos iniciales nunca se borran durante la limpieza.
export const test = base.extend<{ testData: TestData }>({
  testData: async ({}, use) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const quoteIds = new Set<string>();
    const characterIds = new Set<string>();
    const tagIds = new Set<string>();
    let initialCharacters = new Set<string>();
    let initialTags = new Set<string>();
    const trackQuote = (quote: Quote) => {
      quoteIds.add(quote.id);
      if (!initialCharacters.has(quote.character.id)) characterIds.add(quote.character.id);
      for (const tag of quote.tags) {
        if (!initialTags.has(tag.id)) tagIds.add(tag.id);
      }
    };
    try {
      const charactersResponse = await api.get('/characters');
      const tagsResponse = await api.get('/tags');
      await expect(charactersResponse).toBeOK();
      await expect(tagsResponse).toBeOK();
      initialCharacters = new Set<string>(
        (await charactersResponse.json()).map((item: { id: string }) => item.id),
      );
      initialTags = new Set<string>(
        (await tagsResponse.json()).map((item: { id: string }) => item.id),
      );
      const token = randomUUID();
      await use({
        token,
        api,
        trackQuote,
        createQuote: async (input = {}) => {
          const response = await api.post('/quotes/add', {
            data: {
              quote: `Frase E2E ${randomUUID()}`,
              character: 'Marie Curie',
              source: 'Pruebas E2E',
              tags: [],
              ...input,
            },
          });
          expect(response.status()).toBe(201);
          const quote: Quote = await response.json();
          trackQuote(quote);
          return quote;
        },
      });
    } finally {
      const cleanupErrors: string[] = [];
      // Recuperar también las etiquetas que el usuario haya añadido desde la UI.
      for (const id of quoteIds) {
        try {
          const response = await api.get(`/quotes/${id}`);
          if (response.ok()) trackQuote(await response.json());
          else if (response.status() !== 404) cleanupErrors.push(`GET quotes/${id}: ${response.status()}`);
        } catch (error) {
          cleanupErrors.push(`GET quotes/${id}: ${String(error)}`);
        }
      }
      // Continuar con los demás recursos aunque un borrado falle.
      for (const [resource, ids] of [
        ['quotes', quoteIds], ['characters', characterIds], ['tags', tagIds],
      ] as const) {
        for (const id of ids) {
          try {
            const response = await api.delete(`/${resource}/delete/${id}`);
            if (![200, 404].includes(response.status())) {
              cleanupErrors.push(`${resource}/${id}: ${response.status()}`);
            }
          } catch (error) {
            cleanupErrors.push(`${resource}/${id}: ${String(error)}`);
          }
        }
      }
      await api.dispose();
      expect(cleanupErrors, 'La limpieza de datos debe completarse').toEqual([]);
    }
  },
});

export { expect };
