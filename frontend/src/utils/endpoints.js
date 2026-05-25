export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ME: "/auth/me",
  },
  SETTINGS: {
    LIST: "/settings",
    UPDATE: "/settings",
  },
  DASHBOARD: {
    STATS: "/dashboard/stats",
  },
  CLASSES: {
    LIST: "/classes",
    OPTIONS: "/classes/options",
    DETAIL: (id) => `/classes/${id}`,
  },
  STUDENTS: {
    LIST: "/students",
    CHECK: "/students/check",
    DETAIL: (id) => `/students/${id}`,
    IMPORT: "/students/import",
  },
};
