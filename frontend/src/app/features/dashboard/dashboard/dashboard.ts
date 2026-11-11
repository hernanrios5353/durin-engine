import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummary } from '../../../core/services/dashboard.service';

interface StatCard {
  label: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'secondary';
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly stats = computed<StatCard[]>(() => {
    const s = this.summary();
    return [
      { label: 'Total Equipos', value: s?.totalEquipment ?? 0, color: 'primary', icon: 'equipment' },
      { label: 'Operativos', value: s?.operationalEquipment ?? 0, color: 'success', icon: 'check' },
      { label: 'Requieren Mantenimiento', value: s?.requiresMaintenance ?? 0, color: 'warning', icon: 'warning' },
      { label: 'Mantenimientos', value: s?.totalMaintenanceRecords ?? 0, color: 'secondary', icon: 'maintenance' },
    ];
  });

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo cargar el resumen');
        this.loading.set(false);
      },
    });
  }

  protected iconClass(color: StatCard['color']): string {
    return `stat-icon stat-icon--${color}`;
  }
}