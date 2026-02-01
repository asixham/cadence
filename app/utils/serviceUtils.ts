import { allServices, Service } from "../data/services";

export function getService(id: string): Service | undefined {
  return allServices.find(s => s.id === id);
}

