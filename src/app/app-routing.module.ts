import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { PostPageComponent } from './pages/projects/post-page/post-page.component';

@NgModule({
  imports: [
    RouterModule.forRoot(
      [
        { path: '', redirectTo: '/home', pathMatch: 'full' },
        {
          path: 'home',
          component: HomeComponent,
        },
        {
          path: 'about',
          component: AboutComponent,
        },
        {
          path: 'projects',
          children: [
            {
              path: 'list',
              component: ProjectsComponent,
            },
            {
              path: ':id',
              component: PostPageComponent,
            },
            { path: '', redirectTo: 'list', pathMatch: 'full' },
          ]
        },
        //{ path: '**', redirectTo: '/notfound' },
      ],
      { scrollPositionRestoration: 'enabled', enableViewTransitions: true }
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
