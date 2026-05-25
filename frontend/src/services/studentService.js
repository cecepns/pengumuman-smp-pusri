import { API_ENDPOINTS } from "@/utils/endpoints";
import { postRequest, deleteRequest, getRequest, putRequest } from "@/utils/request";

export function checkGraduation(params) {
  return getRequest(API_ENDPOINTS.STUDENTS.CHECK, params);
}

export function getStudents(params) {
  return getRequest(API_ENDPOINTS.STUDENTS.LIST, params);
}

export function getStudent(id) {
  return getRequest(API_ENDPOINTS.STUDENTS.DETAIL(id));
}

export function createStudent(body) {
  return postRequest(API_ENDPOINTS.STUDENTS.LIST, body);
}

export function updateStudent(id, body) {
  return putRequest(API_ENDPOINTS.STUDENTS.DETAIL(id), body);
}

export function deleteStudent(id) {
  return deleteRequest(API_ENDPOINTS.STUDENTS.DETAIL(id));
}

/** Kirim data siswa yang sudah diparse dari Excel di frontend */
export function importStudentsBulk(students) {
  return postRequest(API_ENDPOINTS.STUDENTS.IMPORT, { students });
}
