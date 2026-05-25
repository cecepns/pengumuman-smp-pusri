import { api } from "./api";

export async function getRequest(url, params = {}) {
  const { data } = await api.get(url, { params });
  return data;
}

export async function postRequest(url, body = {}) {
  const { data } = await api.post(url, body);
  return data;
}

export async function putRequest(url, body = {}) {
  const { data } = await api.put(url, body);
  return data;
}

export async function deleteRequest(url) {
  const { data } = await api.delete(url);
  return data;
}
