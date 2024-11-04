import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    MenubarModule,
    CardModule,
    AvatarModule,
  ],
  declarations: [AppComponent, HomeComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
