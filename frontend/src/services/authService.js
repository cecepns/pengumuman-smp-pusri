import { API_ENDPOINTS } from "@/utils/endpoints";
import { getRequest, postRequest } from "@/utils/request";

export function login(credentials) {
  return postRequest(API_ENDPOINTS.AUTH.LOGIN, credentials);
}

export function getMe() {
  return getRequest(API_ENDPOINTS.AUTH.ME);
}
