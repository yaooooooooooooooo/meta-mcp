import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AuthManager } from "../utils/auth.js";
import {
  SearchInterestsSchema,
  GetInterestSuggestionsSchema,
  SearchBehaviorsSchema,
  SearchDemographicsSchema,
  SearchGeoLocationsSchema,
  CreateBudgetScheduleSchema,
  ListBudgetSchedulesSchema,
  DeleteBudgetScheduleSchema,
} from "../types/mcp-tools.js";

interface TargetingResult {
  id: string;
  name: string;
  audience_size_lower_bound?: number;
  audience_size_upper_bound?: number;
  path?: string[];
  description?: string;
  type?: string;
}

interface GeoLocationResult {
  key: string;
  name: string;
  type: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  region_id?: number;
  supports_region?: boolean;
  supports_city?: boolean;
}

interface BudgetSchedule {
  id: string;
  budget_value: string;
  budget_value_type: string;
  time_start: string;
  time_end: string;
  status?: string;
}

export function registerTargetingTools(server: McpServer, auth: AuthManager) {
  // Search Interests Tool
  server.tool(
    "search_interests",
    "Search for targetable interests by keyword. Returns interest IDs, names, audience sizes, and category paths. Use these IDs in ad set targeting.",
    SearchInterestsSchema.shape,
    async ({ query, limit = 25, locale = "en_US" }) => {
      try {
        const params = new URLSearchParams({
          type: "adinterest",
          q: query,
          limit: String(limit),
          locale,
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error }, null, 2) }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: TargetingResult[] };
        const results: TargetingResult[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              query,
              count: results.length,
              interests: results.map((r) => ({
                id: r.id,
                name: r.name,
                audience_size_lower_bound: r.audience_size_lower_bound,
                audience_size_upper_bound: r.audience_size_upper_bound,
                path: r.path,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
          isError: true,
        };
      }
    }
  );

  // Get Interest Suggestions Tool
  server.tool(
    "get_interest_suggestions",
    "Get suggested interests based on a list of seed interests. Useful for expanding targeting options and finding related audiences.",
    GetInterestSuggestionsSchema.shape,
    async ({ interest_list, limit = 25, locale = "en_US" }) => {
      try {
        const params = new URLSearchParams({
          type: "adinterestsuggestion",
          interest_list: JSON.stringify(interest_list),
          limit: String(limit),
          locale,
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error }, null, 2) }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: TargetingResult[] };
        const results: TargetingResult[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              seed_interests: interest_list,
              count: results.length,
              suggestions: results.map((r) => ({
                id: r.id,
                name: r.name,
                audience_size_lower_bound: r.audience_size_lower_bound,
                audience_size_upper_bound: r.audience_size_upper_bound,
                description: r.description,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
          isError: true,
        };
      }
    }
  );

  // Search Behaviors Tool
  server.tool(
    "search_behaviors",
    "Get all available behavior targeting options. Behaviors include purchase behaviors, device usage, travel patterns, digital activities, and more.",
    SearchBehaviorsSchema.shape,
    async ({ limit = 50, locale = "en_US" }) => {
      try {
        const params = new URLSearchParams({
          type: "adTargetingCategory",
          class: "behaviors",
          limit: String(limit),
          locale,
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error }, null, 2) }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: TargetingResult[] };
        const results: TargetingResult[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: results.length,
              behaviors: results.map((r) => ({
                id: r.id,
                name: r.name,
                audience_size_lower_bound: r.audience_size_lower_bound,
                audience_size_upper_bound: r.audience_size_upper_bound,
                description: r.description,
                path: r.path,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
          isError: true,
        };
      }
    }
  );

  // Search Demographics Tool
  server.tool(
    "search_demographics",
    "Get available demographic targeting options by category. Categories include life events, industries, income levels, family status, work employers, and job positions.",
    SearchDemographicsSchema.shape,
    async ({ demographic_class = "demographics", limit = 50, locale = "en_US" }) => {
      try {
        const params = new URLSearchParams({
          type: "adTargetingCategory",
          class: demographic_class,
          limit: String(limit),
          locale,
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error }, null, 2) }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: TargetingResult[] };
        const results: TargetingResult[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              demographic_class,
              count: results.length,
              options: results.map((r) => ({
                id: r.id,
                name: r.name,
                audience_size_lower_bound: r.audience_size_lower_bound,
                audience_size_upper_bound: r.audience_size_upper_bound,
                description: r.description,
                type: r.type,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
          isError: true,
        };
      }
    }
  );

  // Search Geo Locations Tool
  server.tool(
    "search_geo_locations",
    "Search for geographic locations to target in ads. Find countries, regions, cities, zip codes, DMAs (Designated Market Areas), and electoral districts.",
    SearchGeoLocationsSchema.shape,
    async ({ query, location_types, limit = 25, locale = "en_US" }) => {
      try {
        const params = new URLSearchParams({
          type: "adgeolocation",
          q: query,
          limit: String(limit),
          locale,
          access_token: auth.getAccessToken(),
        });

        if (location_types && location_types.length > 0) {
          params.set("location_types", JSON.stringify(location_types));
        }

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/search?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error }, null, 2) }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: GeoLocationResult[] };
        const results: GeoLocationResult[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              query,
              count: results.length,
              locations: results.map((r) => ({
                key: r.key,
                name: r.name,
                type: r.type,
                country_code: r.country_code,
                country_name: r.country_name,
                region: r.region,
                region_id: r.region_id,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }],
          isError: true,
        };
      }
    }
  );

  // Create Budget Schedule Tool
  server.tool(
    "create_budget_schedule",
    "Schedule a temporary budget change for a campaign. Useful for flash sales, holidays, or promotional periods. The budget will automatically revert after the scheduled period.",
    CreateBudgetScheduleSchema.shape,
    async ({ campaign_id, budget_value, budget_value_type, time_start, time_end }) => {
      try {
        // Validate time range
        if (time_end <= time_start) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "time_end must be after time_start",
              }, null, 2),
            }],
            isError: true,
          };
        }

        const now = Math.floor(Date.now() / 1000);
        if (time_start < now) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "time_start must be in the future",
              }, null, 2),
            }],
            isError: true,
          };
        }

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/${campaign_id}/budget_schedules`;

        const body = new URLSearchParams({
          budget_value,
          budget_value_type,
          time_start: String(time_start),
          time_end: String(time_end),
          access_token: auth.getAccessToken(),
        });

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                campaign_id,
                error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const data = await response.json() as { id?: string };

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Budget schedule created successfully",
              campaign_id,
              schedule_id: data.id,
              budget_value,
              budget_value_type,
              time_start: new Date(time_start * 1000).toISOString(),
              time_end: new Date(time_end * 1000).toISOString(),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              campaign_id,
              error: errorMessage,
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // List Budget Schedules Tool
  server.tool(
    "list_budget_schedules",
    "List all budget schedules for a campaign, including active, completed, and pending schedules.",
    ListBudgetSchedulesSchema.shape,
    async ({ campaign_id }) => {
      try {
        const params = new URLSearchParams({
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/${campaign_id}/budget_schedules?${params}`;

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                campaign_id,
                error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const data = await response.json() as { data?: BudgetSchedule[] };
        const schedules: BudgetSchedule[] = data.data || [];

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              campaign_id,
              count: schedules.length,
              schedules: schedules.map((s) => ({
                id: s.id,
                budget_value: s.budget_value,
                budget_value_type: s.budget_value_type,
                time_start: s.time_start,
                time_end: s.time_end,
                status: s.status,
              })),
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              campaign_id,
              error: errorMessage,
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // Delete Budget Schedule Tool
  server.tool(
    "delete_budget_schedule",
    "Delete a budget schedule. Only pending (not yet started) schedules can be deleted.",
    DeleteBudgetScheduleSchema.shape,
    async ({ budget_schedule_id }) => {
      try {
        const params = new URLSearchParams({
          access_token: auth.getAccessToken(),
        });

        const url = `${auth.getBaseUrl()}/${auth.getApiVersion()}/${budget_schedule_id}?${params}`;

        const response = await fetch(url, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                budget_schedule_id,
                error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Budget schedule deleted successfully",
              budget_schedule_id,
            }, null, 2),
          }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              budget_schedule_id,
              error: errorMessage,
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
