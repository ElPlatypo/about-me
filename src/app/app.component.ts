import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'ph ph-house ph-lg',
      iconStyle: {'color': 'var(--primary-color)'},
      routerLink: 'home'
    },
    {
      label: 'about',
      icon: 'ph ph-identification-card ph-lg',
      iconStyle: {'color': 'var(--primary-color)'},
      routerLink: 'about'
    },
    {
      label: 'Projects',
      icon: 'ph ph-kanban ph-lg',
      iconStyle: {'color': 'var(--primary-color)'},
      routerLink: 'projects/list'
    },
  ];
}
