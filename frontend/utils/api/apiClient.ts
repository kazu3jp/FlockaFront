import { createAuthApi } from './auth';
import { createCardsApi } from './cards';
import { DEFAULT_API_BASE_URL, HttpClient } from './client';
import { createExchangesApi } from './exchanges';

export function createApiClient(baseUrl: string = DEFAULT_API_BASE_URL) {
  const http = new HttpClient(baseUrl);
  return {
    ...createAuthApi(http),
    ...createCardsApi(http),
    ...createExchangesApi(http),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const apiClient: ApiClient = createApiClient();
