import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipmentService, Equipment } from '../../../core/services/equipment.service';

@Component({
  selector: 'app-equipment-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './equipment-list.html',
  styleUrl: './equipment-list.scss',
})
export class EquipmentList implements OnInit {
  private readonly equipmentService = inject(EquipmentService);
  private readonly fb = inject(FormBuilder);

  protected readonly equipments = signal<Equipment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  
  // Estado del modal
  protected readonly isModalOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);

  // Filtros
  protected readonly searchCode = signal('');
  protected readonly filterType = signal('');
  protected readonly filterStatus = signal('');

  // Filtrado local (rápido para esta escala)
  protected readonly filteredEquipments = computed(() => {
    let result = this.equipments();
    const search = this.searchCode().toLowerCase();
    const type = this.filterType();
    const status = this.filterStatus();

    if (search) result = result.filter(e => e.code.toLowerCase().includes(search));
    if (type) result = result.filter(e => e.type === type);
    if (status) result = result.filter(e => e.status === status);

    return result;
  });

protected readonly equipmentForm = this.fb.nonNullable.group({
  code: ['', [Validators.required]],
  name: ['', [Validators.required]],
  type: this.fb.nonNullable.control<'CAMION' | 'EXCAVADORA' | 'PERFORADORA'>('CAMION', [Validators.required]),
  currentHourmeter: [0, [Validators.required, Validators.min(0)]],
  lastMaintenanceHourmeter: [0, [Validators.required, Validators.min(0)]],
  maintenanceInterval: [250, [Validators.required, Validators.min(1)]],
});

  ngOnInit(): void {
    this.loadEquipments();
  }

  private loadEquipments(): void {
    this.loading.set(true);
    this.equipmentService.findAll().subscribe({
      next: (res) => {
        this.equipments.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar equipos');
        this.loading.set(false);
      },
    });
  }

  protected openModal(equipment?: Equipment): void {
    this.submitError.set(null);
    if (equipment) {
      this.editingId.set(equipment.id);
      this.equipmentForm.patchValue({
        code: equipment.code,
        name: equipment.name,
        type: equipment.type,
        currentHourmeter: equipment.currentHourmeter,
        lastMaintenanceHourmeter: equipment.lastMaintenanceHourmeter,
        maintenanceInterval: equipment.maintenanceInterval,
      });
    } else {
      this.editingId.set(null);
      this.equipmentForm.reset({
        type: 'CAMION',
        currentHourmeter: 0,
        lastMaintenanceHourmeter: 0,
        maintenanceInterval: 250,
      });
    }
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected onSubmit(): void {
    if (this.equipmentForm.invalid) return;
    
    this.submitError.set(null);
    const data = this.equipmentForm.getRawValue();
    const id = this.editingId();

    const request = id
      ? this.equipmentService.update(id, data)
      : this.equipmentService.create(data);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadEquipments();
      },
      error: (err) => {
        const msg = err.error?.error || 'Error al guardar';
        this.submitError.set(msg);
      },
    });
  }

  protected onDelete(id: string, code: string): void {
    if (confirm(`¿Seguro que deseas eliminar el equipo ${code}? Se borrarán también sus mantenimientos.`)) {
      this.equipmentService.delete(id).subscribe({
        next: () => this.loadEquipments(),
        error: () => alert('Error al eliminar'),
      });
    }
  }
}