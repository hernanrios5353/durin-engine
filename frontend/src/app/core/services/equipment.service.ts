import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: 'CAMION' | 'EXCAVADORA' | 'PERFORADORA';
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
  status: 'OPERATIVO' | 'REQUIERE_MANTENIMIENTO';
  hoursSinceLastMaintenance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentDto {
  code: string;
  name: string;
  type: 'CAMION' | 'EXCAVADORA' | 'PERFORADORA';
  currentHourmeter: number;
  lastMaintenanceHourmeter: number;
  maintenanceInterval: number;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipment`;

  findAll(): Observable<{ data: Equipment[]; total: number }> {
    return this.http.get<{ data: Equipment[]; total: number }>(this.apiUrl);
  }

  findById(id: string): Observable<{ data: Equipment }> {
    return this.http.get<{ data: Equipment }>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateEquipmentDto): Observable<{ data: Equipment }> {
    return this.http.post<{ data: Equipment }>(this.apiUrl, dto);
  }

  update(id: string, dto: Partial<CreateEquipmentDto>): Observable<{ data: Equipment }> {
    return this.http.put<{ data: Equipment }>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}