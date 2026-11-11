import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService, Maintenance } from '../../../core/services/maintenance.service';
import { EquipmentService, Equipment } from '../../../core/services/equipment.service';

@Component({
  selector: 'app-maintenance-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.scss',
})
export class MaintenanceList implements OnInit {
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly fb = inject(FormBuilder);

  protected readonly maintenances = signal<Maintenance[]>([]);
  protected readonly equipments = signal<Equipment[]>([]);
  protected readonly loading = signal(true);
  
  protected readonly isModalOpen = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly maintenanceForm = this.fb.nonNullable.group({
    equipmentId: ['', [Validators.required]],
    maintenanceType: this.fb.nonNullable.control<'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO'>('PREVENTIVO', [Validators.required]),
    description: ['', [Validators.required]],
    hourmeter: [0, [Validators.required, Validators.min(0)]],
    observations: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    // Cargamos mantenimientos y equipos en paralelo
    this.maintenanceService.findAll().subscribe({
      next: (res) => {
        this.maintenances.set(res.data);
        this.equipmentService.findAll().subscribe({
          next: (eqRes) => {
            this.equipments.set(eqRes.data);
            this.loading.set(false);
          }
        });
      },
      error: () => this.loading.set(false),
    });
  }

  protected openModal(): void {
    this.submitError.set(null);
    this.maintenanceForm.reset({
      maintenanceType: 'PREVENTIVO',
      hourmeter: 0,
    });
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected onSubmit(): void {
    if (this.maintenanceForm.invalid) return;
    
    this.submitError.set(null);
    const data = this.maintenanceForm.getRawValue();

    this.maintenanceService.create(data).subscribe({
      next: () => {
        this.closeModal();
        this.loadData(); // Recarga todo (y actualiza el estado del equipo)
      },
      error: (err) => {
        const msg = err.error?.error || 'Error al registrar mantenimiento';
        this.submitError.set(msg);
      },
    });
  }
}