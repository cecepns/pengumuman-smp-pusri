import { API_ENDPOINTS } from "@/utils/endpoints";
import { deleteRequest, getRequest, postRequest, putRequest } from "@/utils/request";

export function getClassOptions() {
  return getRequest(API_ENDPOINTS.CLASSES.OPTIONS);
}

export function getClasses(params) {
  return getRequest(API_ENDPOINTS.CLASSES.LIST, params);
}

export function createClass(body) {
  return postRequest(API_ENDPOINTS.CLASSES.LIST, body);
}

export function updateClass(id, body) {
  return putRequest(API_ENDPOINTS.CLASSES.DETAIL(id), body);
}

export function deleteClass(id) {
  return deleteRequest(API_ENDPOINTS.CLASSES.DETAIL(id));
}
