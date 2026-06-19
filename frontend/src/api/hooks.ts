import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  AuditLog,
  Client,
  Item,
  SalesOrder,
  Schedule,
  TransportType,
} from "./types";

export const useClients = () =>
  useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get<Client[]>("/clients"),
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      document: string;
      authorizedTransportTypeIds?: string[];
    }) => api.post<Client>("/clients", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & Partial<Client> & {
        authorizedTransportTypeIds?: string[];
      }) => api.patch<Client>(`/clients/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useTransportTypes = () =>
  useQuery({
    queryKey: ["transport-types"],
    queryFn: () => api.get<TransportType[]>("/transport-types"),
  });

export const useCreateTransportType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; name: string }) =>
      api.post<TransportType>("/transport-types", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport-types"] }),
  });
};

export const useUpdateTransportType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      active?: boolean;
    }) => api.patch<TransportType>(`/transport-types/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport-types"] }),
  });
};

export const useItems = () =>
  useQuery({ queryKey: ["items"], queryFn: () => api.get<Item[]>("/items") });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sku: string; name: string; unit?: string }) =>
      api.post<Item>("/items", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
};

export interface OrderFilters {
  status?: string;
  clientId?: string;
  transportTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useSalesOrders = (filters: OrderFilters = {}) => {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  ).toString();
  return useQuery({
    queryKey: ["sales-orders", filters],
    queryFn: () => api.get<SalesOrder[]>(`/sales-orders${qs ? `?${qs}` : ""}`),
  });
};

export const useSalesOrder = (id: string | undefined) =>
  useQuery({
    queryKey: ["sales-orders", id],
    queryFn: () => api.get<SalesOrder>(`/sales-orders/${id}`),
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      clientId: string;
      transportTypeId: string;
      items: { itemId: string; quantity: number }[];
    }) => api.post<SalesOrder>("/sales-orders", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useUpdateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch<SalesOrder>(`/sales-orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useChangeTransport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      transportTypeId,
    }: {
      id: string;
      transportTypeId: string;
    }) =>
      api.patch<SalesOrder>(`/sales-orders/${id}/transport`, {
        transportTypeId,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useCreateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      deliveryDate: string;
      windowStart: string;
      windowEnd: string;
    }) => api.post<Schedule>(`/sales-orders/${id}/schedule`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useConfirmSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Schedule>(`/sales-orders/${id}/schedule/confirm`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useReschedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      deliveryDate?: string;
      windowStart?: string;
      windowEnd?: string;
    }) => api.patch<Schedule>(`/sales-orders/${id}/schedule/reschedule`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
};

export const useAuditLogs = (entityId?: string) => {
  const qs = entityId ? `?entity=SalesOrder&entityId=${entityId}` : "";
  return useQuery({
    queryKey: ["audit-logs", entityId],
    queryFn: () => api.get<AuditLog[]>(`/audit-logs${qs}`),
    enabled: !!entityId,
  });
};

export const useAuditTrail = (action?: string) => {
  const qs = action ? `?action=${action}` : "";
  return useQuery({
    queryKey: ["audit-trail", action],
    queryFn: () => api.get<AuditLog[]>(`/audit-logs${qs}`),
  });
};
