import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BarcodeComponent } from '../../../shared/barcode/barcode';

@Component({
  selector: 'app-receive-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BarcodeComponent],
  templateUrl: './receive.html',
  styleUrls: ['./receive.css'],
})
export class ReceivePage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  @ViewChild('slip', { static: false }) slip!: ElementRef<HTMLDivElement>;

  // Department dropdown options
  departments = [
    'Physics','Chemistry','Mathematics','Computer Science',
    'Administration','HR','Accounts','Library','Registrar',
    'Maintenance','IT','Other'
  ];

  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  created = signal<any | null>(null);

  form = this.fb.group({
    customer: this.fb.group({
      name: [''],                 // Item User
      department: [''],
      phone: [''],
      email: ['', [Validators.email]],
    }),
    device: this.fb.group({
      type: ['Laptop', Validators.required],  // Item
      inventoryId: ['', Validators.required], // required
      brand: [''],
      model: [''],
      serial: [''],
      accessories: [''],
    }),
    problemSummary: ['', [Validators.required, Validators.minLength(5)]],
    receivedBy: ['desk'],
  });

  submit() {
    this.message.set(null);
    this.error.set(null);
    this.created.set(null);

    if (this.form.invalid) {
      this.error.set('Please fill in required fields (Item, Inventory ID, Problem Summary).');
      return;
    }

    this.loading.set(true);
    this.http.post('/api/tickets/receive', this.form.value).subscribe({
      next: (ticket: any) => {
        this.created.set(ticket);
        this.message.set('Item received successfully.');
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message || 'Failed to receive item.');
        this.loading.set(false);
      },
    });
  }

  printSlip() {
    const el = this.slip?.nativeElement;
    if (!el) return;

    const title = `Receive Slip - ${this.created()?.ticketNo || ''}`;
    const styles = `
      <style>
        @page { size: A5; margin: 12mm; }
        body { font-family: Arial, Helvetica, sans-serif; color:#111; }
        .slip { width: 100%; }
        .hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .brand { font-weight: 800; font-size: 18px; letter-spacing: .3px; }
        .meta { font-size: 12px; color:#444; }
        .row { display:grid; grid-template-columns: 140px 1fr; gap: 4px 12px; font-size: 14px; margin: 6px 0; }
        .section { margin-top: 8px; }
        .barcode { margin-top: 8px; }
        hr { border:none; border-top:1px solid #e5e7eb; margin:10px 0; }
        .muted { color:#555; font-size: 12px; margin-top: 8px; }
      </style>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.open();
    win.document.write(`<html><head><title>${title}</title>${styles}</head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    // give the SVG barcode a moment to render in the new doc
    setTimeout(() => { win.print(); win.close(); }, 250);
  }
}
