import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface DiagnosticReport {
  _id: string;
  ticketId: string;
  findings: string;
  partsNeeded?: string[];
  estimatedCost?: number;
  estimatedTime?: string;
  preparedBy?: string;
  preparedAt?: string;
  status?: 'proposed' | 'approved' | 'rejected';
}

@Component({
  selector: 'app-diagnostic-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './diagnostic.html',
  styleUrls: ['./diagnostic.css'],
})
export class DiagnosticPage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  me = signal<{ fullName: string; email: string } | null>(null);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  report = signal<DiagnosticReport | null>(null);
  reports = signal<DiagnosticReport[]>([]);

  form = this.fb.group({
    ticketId: ['', [Validators.required, Validators.minLength(6)]],
    findings: ['', [Validators.required, Validators.minLength(5)]],
    partsNeeded: [''],
    estimatedCost: [null as number | null],
    estimatedTime: [''],
  });

  ngOnInit() {
    // current user (used for preparedBy / decidedBy)
    this.auth.me().subscribe({
      next: (res: any) => this.me.set({ fullName: res.user.fullName, email: res.user.email }),
      error: () => this.me.set(null),
    });

    // auto-load diagnostics for typed ticket
    this.form.controls.ticketId.valueChanges.subscribe(val => {
      if (val && val.length >= 6) this.loadDiagnostics(val);
      else this.reports.set([]);
    });
  }

  createDiagnostic() {
    this.message.set(null);
    this.error.set(null);
    if (this.form.invalid) { this.error.set('Please fill in required fields.'); return; }

    this.loading.set(true);
    const v = this.form.value;
    const payload: any = {
      ticketId: v.ticketId,
      findings: v.findings,
      partsNeeded: (v.partsNeeded || '')
        .toString()
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      estimatedCost: v.estimatedCost,
      estimatedTime: v.estimatedTime,
      preparedBy: this.me()?.fullName ?? 'Unknown',
    };

    this.http.post<DiagnosticReport>('/api/diagnose', payload).subscribe({
      next: (report) => {
        this.report.set(report);
        this.message.set('Diagnostic created and ticket set to diagnosing.');
        this.loading.set(false);
        if (report.ticketId) this.loadDiagnostics(report.ticketId);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to create diagnostic.');
        this.loading.set(false);
      },
    });
  }

  decision(decision: 'approve' | 'reject') {
    this.message.set(null);
    this.error.set(null);
    const r = this.report();
    if (!r) { this.error.set('Create or load a diagnostic first.'); return; }

    this.loading.set(true);
    const decidedBy = this.me()?.fullName ?? 'Unknown';

    this.http.post<{ report: DiagnosticReport; ticket: any }>(
      `/api/diagnose/${r._id}/decision`,
      { decision, decidedBy }
    ).subscribe({
      next: (res) => {
        this.report.set(res.report);
        this.message.set(`Diagnostic ${decision}d. Ticket updated.`);
        this.loading.set(false);
        if (res.report.ticketId) this.loadDiagnostics(res.report.ticketId);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to submit decision.');
        this.loading.set(false);
      }
    });
  }

  private loadDiagnostics(ticketId: string) {
    this.http.get<{ items: DiagnosticReport[] }>('/api/diagnose', { params: { ticketId } })
      .subscribe({
        next: (res) => this.reports.set(res?.items || []),
        error: () => this.reports.set([]),
      });
  }
}
