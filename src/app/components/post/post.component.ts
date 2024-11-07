import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent {
  private router = inject(Router);

  title = input.required<string>();
  date = input.required<string>();
  image = input.required<string>();
  postRoute = input.required<string>();

  navigateToProjectPage(postRoute: string) {
    this.router.navigate(['projects', postRoute])
  }
}
