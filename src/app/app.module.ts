import { BrowserModule }           from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule }             from '@angular/forms';
import { NgModule }                from '@angular/core';
import { HttpClientModule }        from '@angular/common/http';

import { AppRoutingModule }        from './app-routing.module';
import { AppComponent }            from './app.component';
import { CookieService }           from 'ngx-cookie-service';
import { SpacerComponent }         from './spacer/spacer.component';

@NgModule({
  declarations: [
    AppComponent,
    SpacerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
