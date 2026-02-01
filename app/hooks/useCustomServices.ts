import { useState, useEffect } from "react";
import { Service } from "@/app/data/services";

const STORAGE_KEY = 'cadence-custom-services';

export function useCustomServices() {
  const [customServices, setCustomServices] = useState<Service[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Save to localStorage whenever custom services change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customServices));
    }
  }, [customServices]);

  const addCustomService = (name: string, url: string) => {
    // Generate a unique ID for the custom service
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newService: Service = {
      id,
      name,
      url,
      category: 'web', // Default category for custom services
    };

    setCustomServices(prev => [...prev, newService]);
    return id;
  };

  const removeCustomService = (serviceId: string) => {
    setCustomServices(prev => prev.filter(s => s.id !== serviceId));
  };

  return {
    customServices,
    addCustomService,
    removeCustomService,
  };
}

