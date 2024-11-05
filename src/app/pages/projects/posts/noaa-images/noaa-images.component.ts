import { Component } from '@angular/core';

@Component({
  selector: 'app-noaa-images',
  templateUrl: './noaa-images.component.html',
  styleUrl: './noaa-images.component.css',
})
export class NoaaImagesComponent {
  title: string = 'Receiving images from weather satellites';
  route: string = 'noaa-images';
}
