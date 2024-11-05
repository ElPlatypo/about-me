import { Component, input } from '@angular/core';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent {
  title = input.required<string>();
  date = input.required<string>();
  image = input.required<string>();
}
