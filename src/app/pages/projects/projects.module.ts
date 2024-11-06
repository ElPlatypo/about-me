import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { PostComponent } from './post/post.component';
import { ProjectsComponent } from './projects.component';

@NgModule({
  imports: [
    CommonModule,
    MenubarModule,
    CardModule,
    AvatarModule,
    ButtonModule,
  ],
  declarations: [ProjectsComponent, PostComponent],
  exports: [],
})
export class ProjectsModule {}
