/**
 * API Client for Usefly
 * Provides methods for fetching and mutating data from the backend
 */

import {
  Scenario,
  CreateScenarioRequest,
  PersonaRun,
  CreatePersonaRunRequest,
  ReportListItem,
  ReportAggregate,
  SystemConfig,
  UpdateSystemConfigRequest,
  CrawlerAnalysisRequest,
  CrawlerAnalysisResponse,
  SaveScenarioRequest,
  SaveScenarioResponse,
  PersonaExecutionResponse,
  RunStatusResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Fetch helper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Scenario API methods
 */
export const scenarioApi = {
  list: () => apiFetch<Scenario[]>("/api/scenarios"),

  get: (id: string) => apiFetch<Scenario>(`/api/scenarios/${id}`),

  create: (data: CreateScenarioRequest) =>
    apiFetch<Scenario>("/api/scenarios", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTasks: (id: string, selectedTaskNumbers: number[]) =>
    apiFetch<Scenario>(`/api/scenario/${id}/tasks`, {
      method: "PATCH",
      body: JSON.stringify({ selected_task_numbers: selectedTaskNumbers }),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/api/scenarios/${id}`, {
      method: "DELETE",
    }),

  getPersonas: () =>
    apiFetch<{ personas: string[]; counts: Record<string, number> }>("/api/scenario/personas"),
};

/**
 * Persona Run Records API methods
 */
export const personaRecordsApi = {
  list: (filters?: {
    configId?: string;
    personaType?: string;
    reportId?: string;
    status?: string;
    platform?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.configId) params.append("config_id", filters.configId);
    if (filters?.personaType) params.append("persona_type", filters.personaType);
    if (filters?.reportId) params.append("report_id", filters.reportId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.platform) params.append("platform", filters.platform);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<PersonaRun[]>(`/api/persona-runs${query}`);
  },

  get: (id: string) => apiFetch<PersonaRun>(`/api/persona-runs/${id}`),

  create: (data: CreatePersonaRunRequest) =>
    apiFetch<PersonaRun>("/api/persona-runs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/**
 * Report API methods
 */
export const reportApi = {
  list: () => apiFetch<ReportListItem[]>("/api/reports/list"),

  getAggregate: (reportId: string, mode?: string, filters?: { persona?: string; status?: string; platform?: string }) => {
    const params = new URLSearchParams();
    if (mode && mode !== "compact") params.append("mode", mode);
    if (filters?.persona && filters.persona !== "all") params.append("persona", filters.persona);
    if (filters?.status && filters.status !== "all") params.append("status", filters.status);
    if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<ReportAggregate>(`/api/reports/${reportId}/aggregate${query}`);
  },

  getRuns: (reportId: string, filters?: { persona?: string; status?: string; platform?: string }) => {
    const params = new URLSearchParams();
    if (filters?.persona && filters.persona !== "all") params.append("persona", filters.persona);
    if (filters?.status && filters.status !== "all") params.append("status", filters.status);
    if (filters?.platform && filters.platform !== "all") params.append("platform", filters.platform);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<PersonaRun[]>(`/api/reports/${reportId}/runs${query}`);
  },
};

/**
 * System Config API methods
 */
export const systemConfigApi = {
  get: () => apiFetch<SystemConfig>("/api/system-config"),

  update: (data: UpdateSystemConfigRequest) =>
    apiFetch<SystemConfig>("/api/system-config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/**
 * Crawler API methods
 */
export const crawlerApi = {
  analyze: (data: CrawlerAnalysisRequest) =>
    apiFetch<CrawlerAnalysisResponse>("/api/scenario/analyze", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  save: (data: SaveScenarioRequest) =>
    apiFetch<SaveScenarioResponse>("/api/scenario/save", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/**
 * Persona Execution API methods
 */
export const personaExecutionApi = {
  run: (scenarioId: string) =>
    apiFetch<PersonaExecutionResponse>(`/api/persona/run/${scenarioId}`, {
      method: "POST",
    }),

  getStatus: (runId: string) =>
    apiFetch<RunStatusResponse>(`/api/persona/run/${runId}/status`),

  acknowledgeCompletion: (runId: string) =>
    apiFetch<void>(`/api/persona/run/${runId}`, {
      method: "DELETE",
    }),
};
