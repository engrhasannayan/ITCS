import { Routes } from '@angular/router';
import { SigninComponent } from './signin/signin';
import { RegistrationComponent } from './registration/registration';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { signedOutGuard } from './guards/signed-out.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },

  // Public
  { path: 'sign-in', component: SigninComponent, canActivate: [signedOutGuard], title: 'ITCS – Sign In' },
  { path: 'register', component: RegistrationComponent, title: 'ITCS – Register' },

  // Protected
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'receive' },

      {
        path: 'receive',
        loadComponent: () => import('./dashboard/pages/receive/receive').then(m => m.ReceivePage),
        title: 'ITCS – Receive Item',
      },
      {
        path: 'assign',
        loadComponent: () => import('./dashboard/pages/assign/assign').then(m => m.AssignPage),
        title: 'ITCS – Assign',
      },
      // ✅ Route name = 'diagnostic'
      {
        path: 'diagnostic',
        loadComponent: () => import('./dashboard/pages/diagnostic/diagnostic').then(m => m.DiagnosticPage),
        title: 'ITCS – Diagnostic',
      },
      {
        path: 'deliver',
        loadComponent: () => import('./dashboard/pages/deliver/deliver').then(m => m.DeliverPage),
        title: 'ITCS – Deliver Item',
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'sign-in' },
];
