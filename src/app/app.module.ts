import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';

import { App } from './app';
import { routes } from './app.routes';
import { InMemoryDataService } from './services/in-memory-data.service';

// Optional NgModule wrapper for environments or tooling that prefer modules.
// The live app continues to bootstrap via standalone `bootstrapApplication`,
// so this file does not change UI or behavior unless explicitly used.
@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    // Mirror the in-memory API setup from the standalone config
    HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
      delay: 0,
      passThruUnknownUrl: true
    }),
    // Import the standalone root component
    App
  ],
  bootstrap: [App]
})
export class AppModule {}
