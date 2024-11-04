import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';

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
        //{ path: '**', redirectTo: '/notfound' },
      ],
      { scrollPositionRestoration: 'enabled', enableViewTransitions: true }
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
