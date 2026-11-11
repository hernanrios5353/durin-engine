import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  totalEquipment: number;
  operationalEquipment: number;
  requiresMaintenance: number;
  totalMaintenanceRecords: number;
  byType: Record<string, number>;
  recentMaintenances: {
    id: string;
    description: string;
    maintenanceDate: string;
    maintenanceType: string;
    equipment: { code: string; name: string; type: string };
  }[];
}

export interface MaintenanceStatusItem {
  id: string;
  code: string;
  name: string;
  type: string;
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
  hoursSinceLastMaintenance: number;
  remainingHours: number;
  status: 'OPERATIVO' | 'REQUIERE_MANTENIMIENTO';
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<{ data: DashboardSummary }> {
    return this.http.get<{ data: DashboardSummary }>(`${this.apiUrl}/summary`);
  }

  getMaintenanceStatus(): Observable<{ data: MaintenanceStatusItem[] }> {
    return this.http.get<{ data: MaintenanceStatusItem[] }>(
      `${this.apiUrl}/maintenance-status`
    );
  }
}