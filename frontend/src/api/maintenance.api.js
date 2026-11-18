import api from './axios';

export const maintenanceApi = {
  getTypes: async () => (await api.get('/maintenance/types')).data,
  getByVehicle: async (vehicleId) => (await api.get(`/maintenance/vehicle/${vehicleId}`)).data,
};
