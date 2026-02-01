import { allServices, Service } from "../data/services";

export function getService(id: string, customServices: Service[] = []): Service | undefined {
  // Check custom services first, then regular services
  return customServices.find(s => s.id === id) || allServices.find(s => s.id === id);
}

export function getAllServices(customServices: Service[] = []): Service[] {
  return [...allServices, ...customServices];
}

