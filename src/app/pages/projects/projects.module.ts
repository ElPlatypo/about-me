import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { PostComponent } from '../../components/post/post.component';
import { ProjectsComponent } from './projects.component';
import { NeuralNetworkVisualizerComponent } from '../../components/neural-network-visualizer/neural-network-visualizer.component';
import { CreatingDigitalNeuronsComponent } from './posts/creating-digital-neurons/creating-digital-neurons.component';
import { PixelCanvasComponent } from '../../components/pixel-canvas/pixel-canvas.component';
import { ChartModule } from 'primeng/chart';

@NgModule({
  imports: [
    CommonModule,
    MenubarModule,
    CardModule,
    AvatarModule,
    ButtonModule,
    NeuralNetworkVisualizerComponent,
    PixelCanvasComponent,
    ChartModule
  ],
  declarations: [ProjectsComponent, PostComponent, CreatingDigitalNeuronsComponent],
  exports: [],
})
export class ProjectsModule {}
