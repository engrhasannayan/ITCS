import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-receive-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './receive.html',
  styleUrls: ['./receive.css'],  // <— add component-local styles
})
export class ReceivePage {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  itemOptions = ['CPU', 'UPS', 'Monitor', 'Projector', 'Printer'];
  sentByOptions = ['CSE', 'EEE', 'BBA'];
  complainOptions = ['No Power', 'Slow', 'Blue Screen', 'Restarts', 'Blur Projection', 'No Print'];

  form = this.fb.group({
    inventoryId: ['', Validators.required],
    item: ['', Validators.required],
    sentBy: ['', Validators.required],
    complain: ['', Validators.required],
    receiveDate: ['', Validators.required],
    receivedBy: ['', Validators.required],
    itReport: ['', Validators.required],
    deliveredBy: [''],
  });

  get f() { return this.form.controls; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // TODO: call your API
    console.log('Receive New Item payload:', this.form.value);
    alert('Saved (demo).');
    this.router.navigateByUrl('/dashboard/home');
  }
}
