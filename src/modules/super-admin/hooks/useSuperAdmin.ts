import { useState, useEffect, useCallback } from "react";
import { superAdminService } from "../services/super-admin.service";
import type { Church, DashboardStats, ChurchFormValues } from "../types/super-admin.types";

export function useSuperAdmin() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await superAdminService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al obtener estadísticas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChurches = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await superAdminService.getChurches();
      setChurches(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al obtener iglesias");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChurch = useCallback(async (formData: ChurchFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      const newChurch = await superAdminService.createChurch(formData);
      setChurches((prev) => [newChurch, ...prev]);
      return newChurch;
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al crear la iglesia";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateChurchStatus = useCallback(async (id: number, status: string) => {
    try {
      await superAdminService.updateChurch(id, { status } as any);
      setChurches((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: status as any } : c))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al actualizar");
      throw err;
    }
  }, []);

  return {
    stats,
    churches,
    isLoading,
    error,
    loadStats,
    loadChurches,
    createChurch,
    updateChurchStatus,
    setError,
  };
}
