import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Maintenance {
  id: string;
  equipmentId: string;
  maintenanceType: 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
  description: string;
  hourmeter: number;
  maintenanceDate: string;
  observations: string | null;
  createdAt: string;
  equipment?: {
    code: string;
    name: string;
    type: string;
  };
}

export interface CreateMaintenanceDto {
  equipmentId: string;
  maintenanceType: 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
  description: string;
  hourmeter: number;
  maintenanceDate?: string;
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/maintenance`;

  findAll(): Observable<{ data: Maintenance[]; total: number }> {
    return this.http.get<{ data: Maintenance[]; total: number }>(this.apiUrl);
  }

  findByEquipment(equipmentId: string): Observable<{ data: Maintenance[]; total: number }> {
    return this.http.get<{ data: Maintenance[]; total: number }>(
      `${environment.apiUrl}/equipment/${equipmentId}/maintenance`
    );
  }

  create(dto: CreateMaintenanceDto): Observable<{ data: Maintenance }> {
    return this.http.post<{ data: Maintenance }>(this.apiUrl, dto);
  }
}