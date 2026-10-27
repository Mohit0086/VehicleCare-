import api from './axios';
export const reminderApi = {
  list: async () => (await api.get('/reminders')).data,
  markRead: async (id) => (await api.patch(`/reminders/${id}/read`)).data,
};
