/**
 * TypeScript types for Usefly API responses
 * These mirror the Python Pydantic models for type safety
 */

/**
 * Test Scenario
 * Defines test setup and personas
 */
export interface UserJourneyTask {
  number: number;
  starting_url: string;
  goal: string;
  steps: string;
  persona: string;
}

export interface TasksMetadata {
  total_tasks: number;
  total_generated?: number;
  total_selected?: number;
  selected_task_numbers?: number[];
  persona_distribution: Record<string, number>;
  generated_at?: string;
  error?: string;
}

export interface DiscoveredUrl {
  url: string;
  url_decoded?: string;
}

export interface Scenario {
  id: string;
  name: string;
  website_url: string;
  personas: string[];
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  description?: string;
  metrics?: string[];
  email?: string;
  tasks?: UserJourneyTask[];
  tasks_metadata?: TasksMetadata;
  discovered_urls?: DiscoveredUrl[];
  crawler_final_result?: any;
  crawler_extracted_content?: any;
}

export interface CreateScenarioRequest {
  name: string;
  website_url: string;
  personas?: string[];
}

/**
 * System Configuration
 * Global settings for the application
 */
export interface SystemConfig {
  id: number;
  model_name: string;
  api_key: string;
  use_thinking: boolean;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface UpdateSystemConfigRequest {
  model_name: string;
  api_key: string;
  use_thinking: boolean;
}

/**
 * Crawler Analysis
 * Website crawling and analysis
 */
export interface CrawlerAnalysisRequest {
  scenario_id?: string;
  website_url: string;
  description?: string;
  name?: string;
  metrics?: string[];
  email?: string;
}

export interface CrawlerAnalysisResponse {
  run_id: string;
  scenario_id: string;
  output_path?: string;
  status: string;
  duration?: number;
  steps?: number;
  error?: string;
  crawler_summary?: string;
  crawler_extracted_content: string;
  tasks?: UserJourneyTask[];
  tasks_metadata?: TasksMetadata;
}

export interface SaveScenarioRequest {
  scenario_id: string;
  name: string;
  website_url: string;
  description?: string;
  metrics: string[];
  email: string;
  selected_task_numbers: number[];
  all_tasks: UserJourneyTask[];
  tasks_metadata: TasksMetadata;
  crawler_final_result?: string;
  crawler_extracted_content?: string;
  discovered_urls: DiscoveredUrl[];
}

export interface SaveScenarioResponse {
  scenario_id: string;
  message: string;
}

/**
 * Friction Point
 * Represents a point where the user encountered friction
 */
export interface FrictionPoint {
  step: string;
  type: string;
  duration: number;
}

/**
 * Metrics Data
 * Contains performance metrics for an agent run
 */
export interface MetricsData {
  time_to_value?: {
    minutes: number;
    steps: number;
  };
  onboarding?: {
    completed: boolean;
  };
  feature_adoption?: {
    adopted: boolean;
  };
}

/**
 * Agent Run
 * Represents a single agent execution
 */
export interface AgentRun {
  id: string;
  config_id: string;
  report_id?: string;
  persona_type: string;
  status: "success" | "error" | "anomaly" | "in-progress";
  timestamp: string; // ISO datetime
  duration?: number; // seconds
  platform: string;
  location?: string; // Geographic location (US, UK, CA, etc.)
  error_type?: string; // Error type for failed runs
  steps_completed: number;
  total_steps: number;
  journey_path: string[];
  goals_achieved: string[];
  friction_points: FrictionPoint[];
  metrics: MetricsData;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface CreateAgentRunRequest {
  config_id: string;
  report_id?: string;
  persona_type: string;
  status: string;
  timestamp: string;
  duration?: number;
  platform?: string;
  location?: string;
  error_type?: string;
  steps_completed?: number;
  total_steps?: number;
  journey_path?: string[];
  goals_achieved?: string[];
  friction_points?: FrictionPoint[];
  metrics?: MetricsData;
}

/**
 * Sankey Node
 * Represents a page in the journey
 */
export interface SankeyNode {
  name: string;
  visits: number;
  errors: number;
}

/**
 * Sankey Link
 * Represents a transition between pages
 */
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

/**
 * Sankey Data
 * Complete sankey diagram data for journey visualization
 */
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Metrics Summary
 * Aggregated metrics across multiple agent runs
 */
export interface MetricsSummary {
  total_runs: number;
  success_count: number;
  error_count: number;
  anomaly_count: number;
  success_rate: number;
  avg_duration: number;
  avg_completion: number;
}

/**
 * Report
 * Aggregated results from multiple agent runs
 */
export interface Report {
  id: string;
  config_id: string;
  name: string;
  description?: string;
  is_baseline: boolean;
  metrics_summary: MetricsSummary;
  journey_sankey: SankeyData;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface CreateReportRequest {
  config_id: string;
  name: string;
  description?: string;
  is_baseline?: boolean;
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
