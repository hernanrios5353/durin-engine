import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/',
      icon: 'dashboard',
    },
    {
      label: 'Equipos',
      path: '/equipment',
      icon: 'equipment',
    },
    {
      label: 'Mantenimientos',
      path: '/maintenance',
      icon: 'maintenance',
    },
    {
      label: 'Historial',
      path: '/history',
      icon: 'history',
    },
  ];
}
