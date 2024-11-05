import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ProjectsComponent } from './projects.component';
import { PostPageComponent } from './post-page/post-page.component';
import { PostComponent } from './post/post.component';

@NgModule({
  imports: [
    CommonModule,
    MenubarModule,
    CardModule,
    AvatarModule,
    ButtonModule,
  ],
  declarations: [ProjectsComponent, PostComponent, PostPageComponent],
  exports: [ProjectsComponent, PostComponent, PostPageComponent],
})
export class ProjectsModule {}
