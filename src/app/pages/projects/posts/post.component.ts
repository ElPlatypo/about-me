import { Component, computed } from '@angular/core';

@Component({
  selector: 'app-projects',
  template: 'sus',
  styles: '',
})
export class PostComponent {
  title = 'title';
  route = 'route';
  path = computed(() => './posts/' + this.route + '/' + this.route + '.component.ts');
}
