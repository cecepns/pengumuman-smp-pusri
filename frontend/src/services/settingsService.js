import { API_ENDPOINTS } from "@/utils/endpoints";
import { getRequest, putRequest } from "@/utils/request";

export function getSettings() {
  return getRequest(API_ENDPOINTS.SETTINGS.LIST);
}

export function updateSettings(body) {
  return putRequest(API_ENDPOINTS.SETTINGS.UPDATE, body);
}
