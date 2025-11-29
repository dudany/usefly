/**
 * API Client for Usefly
 * Provides methods for fetching and mutating data from the backend
 */

import {
  TestConfig,
  CreateTestConfigRequest,
  AgentRun,
  CreateAgentRunRequest,
  Report,
  CreateReportRequest,
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
 * Test Config API methods
 */
export const configApi = {
  list: () => apiFetch<TestConfig[]>("/api/configs"),

  get: (id: string) => apiFetch<TestConfig>(`/api/configs/${id}`),

  create: (data: CreateTestConfigRequest) =>
    apiFetch<TestConfig>("/api/configs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/**
 * Agent Run API methods
 */
export const agentRunApi = {
  list: (filters?: {
    configId?: string;
    personaType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.configId) params.append("config_id", filters.configId);
    if (filters?.personaType) params.append("persona_type", filters.personaType);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<AgentRun[]>(`/api/agent-runs${query}`);
  },

  get: (id: string) => apiFetch<AgentRun>(`/api/agent-runs/${id}`),

  create: (data: CreateAgentRunRequest) =>
    apiFetch<AgentRun>("/api/agent-runs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/**
 * Report API methods
 */
export const reportApi = {
  list: (filters?: {
    configId?: string;
    isBaseline?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.configId) params.append("config_id", filters.configId);
    if (filters?.isBaseline !== undefined)
      params.append("is_baseline", filters.isBaseline.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<Report[]>(`/api/reports${query}`);
  },

  get: (id: string) => apiFetch<Report>(`/api/reports/${id}`),

  create: (data: CreateReportRequest) =>
    apiFetch<Report>("/api/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
