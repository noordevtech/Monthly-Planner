export function clientApiPaths(clientId: number) {
  const base = `/api/clients/${clientId}`;
  return {
    timeSlots: {
      list: `${base}/time-slots`,
      create: `${base}/time-slots`,
      delete: (id: number) => `${base}/time-slots/${id}`,
      bulkSave: `${base}/time-slots/bulk`,
    },
    tasks: {
      list: `${base}/tasks`,
      create: `${base}/tasks`,
      update: (id: number) => `${base}/tasks/${id}`,
      delete: (id: number) => `${base}/tasks/${id}`,
      report: `${base}/tasks/report`,
    },
    reports: {
      list: `${base}/reports`,
      byDate: `${base}/report-by-date`,
      update: (id: number) => `${base}/reports/${id}`,
      delete: (id: number) => `${base}/reports/${id}`,
    },
  };
}
