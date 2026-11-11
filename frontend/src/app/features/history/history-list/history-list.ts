import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceService, Maintenance } from '../../../core/services/maintenance.service';

@Component({
  selector: 'app-history-list',
  imports: [CommonModule],
  templateUrl: './history-list.html',
  styleUrl: './history-list.scss',
})
export class HistoryList implements OnInit {
  private readonly maintenanceService = inject(MaintenanceService);

  protected readonly maintenances = signal<Maintenance[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchTerm = signal('');

  protected readonly filteredMaintenances = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.maintenances();
    
    return this.maintenances().filter(m => 
      m.equipment?.code.toLowerCase().includes(term) ||
      m.description.toLowerCase().includes(term) ||
      m.maintenanceType.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.maintenanceService.findAll().subscribe({
      next: (res) => {
        this.maintenances.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}