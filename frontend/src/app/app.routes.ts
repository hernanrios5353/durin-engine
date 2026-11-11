import { Routes } from '@angular/router';
import { Layout } from './shared/components/layout/layout';
import { Dashboard } from './features/dashboard/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Dashboard },
      {
        path: 'equipment',
        loadComponent: () =>
          import('./features/equipment/equipment-list/equipment-list').then(
            (m) => m.EquipmentList
          ),
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./features/maintenance/maintenance-list/maintenance-list').then(
            (m) => m.MaintenanceList
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history-list/history-list').then(
            (m) => m.HistoryList
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
