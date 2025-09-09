import { Routes } from '@angular/router';
import { SigninComponent } from './signin/signin';
import { RegistrationComponent } from './registration/registration';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { signedOutGuard } from './guards/signed-out.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'sign-in' },

  // Public routes
  { path: 'sign-in', component: SigninComponent, canActivate: [signedOutGuard], title: 'ITCS – Sign In' },
  { path: 'register', component: RegistrationComponent, title: 'ITCS – Register' },

  // Protected dashboard and its children
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'ITCS – Dashboard',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },

      // Home (already exists)
      {
        path: 'home',
        loadComponent: () => import('./dashboard/pages/home/home').then(m => m.HomePage),
        title: 'ITCS – Dashboard',
      },

      // Receive New Item (already exists)
      {
        path: 'receive',
        loadComponent: () => import('./dashboard/pages/receive/receive').then(m => m.ReceivePage),
        title: 'ITCS – Receive New Item',
      },

      // NEW: Assign Engineer
      {
        path: 'assign',
        loadComponent: () => import('./dashboard/pages/assign/assign').then(m => m.AssignPage),
        title: 'ITCS – Assign Engineer',
      },

      // NEW: Diagnostic Report
      {
        path: 'diagnostic',
        loadComponent: () => import('./dashboard/pages/diagnostic/diagnostic').then(m => m.DiagnosticPage),
        title: 'ITCS – Diagnostic Report',
      },

      // NEW: Deliver Item
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
