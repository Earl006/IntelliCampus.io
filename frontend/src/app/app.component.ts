import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./learner/navbar/navbar.component";
import { HeroComponent } from "./learner/hero/hero.component";
import { FooterComponent } from "./learner/footer/footer.component";
import { LoadingComponent } from "./global/loading/loading.component";
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, HeroComponent, FooterComponent, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  
  title = 'frontend';
}
