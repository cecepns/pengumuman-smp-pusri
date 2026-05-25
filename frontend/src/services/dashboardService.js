import { API_ENDPOINTS } from "@/utils/endpoints";
import { getRequest } from "@/utils/request";

export function getDashboardStats() {
  return getRequest(API_ENDPOINTS.DASHBOARD.STATS);
}
