import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  menuItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      routerLink: 'home'
    },
    {
      label: 'about',
      icon: 'pi pi-star',
      routerLink: 'about'
    },
    {
      label: 'Projects',
      icon: 'pi pi-search',
    },
    {
      label: 'Contact',
      icon: 'pi pi-envelope',
    },
  ];
}
