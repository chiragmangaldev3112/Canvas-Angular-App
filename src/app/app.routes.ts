import { Routes } from '@angular/router';
import { CanvasComponent } from './canvas/canvas.component';
import { KidneyStoneMarkerComponent } from './components/kidney-stone-marker/kidney-stone-marker.component';

export const routes: Routes = [
  { path: '', component: CanvasComponent, pathMatch: 'full' },
  { path: 'kidney-marker', component: KidneyStoneMarkerComponent },
  { path: '**', redirectTo: '' }
];
