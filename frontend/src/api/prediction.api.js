import api from './axios';

export const predictionApi = {
  getPrediction: async (vehicleId) => (await api.get(`/vehicles/${vehicleId}/prediction`)).data,
};
