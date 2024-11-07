import { Component, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { NoaaImagesComponent } from './pages/projects/posts/noaa-images/noaa-images.component';
import { ParticleSimulationComponent } from './pages/projects/posts/particle-simulation/particle-simulation.component';
import { SpoodlComponent } from './pages/projects/posts/spoodl/spoodl.component';
import { NexusComponent } from './pages/projects/posts/nexus/nexus.component';
import { NasaImageDownloaderComponent } from './pages/projects/posts/nasa-image-downloader/nasa-image-downloader.component';
import { CastingAluminumComponentsComponent } from './pages/projects/posts/casting-aluminum-components/casting-aluminum-components.component';
import { DesktopPsuComponent } from './pages/projects/posts/desktop-psu/desktop-psu.component';

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
              path: 'noaa-images',
              component: NoaaImagesComponent,
            },
            {
              path: 'particle-simulation',
              component: ParticleSimulationComponent,
            },
            {
              path: 'spoodl',
              component: SpoodlComponent,
            },
            {
              path: 'nexus',
              component: NexusComponent,
            },
            {
              path: 'nasa-image-downloader',
              component: NasaImageDownloaderComponent,
            },
            {
              path: 'casting-aluminum-components',
              component: CastingAluminumComponentsComponent,
            },
            {
              path: 'desktop-psu',
              component: DesktopPsuComponent,
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
