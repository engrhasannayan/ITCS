import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // --- Tickets ---
  createTicket(payload: {
    department: string;
    ownerName: string;
    contactPhone?: string;
    deviceType: 'PC' | 'Laptop' | 'Printer' | 'Other';
    deviceBrand?: string;
    deviceModel?: string;
    deviceSerial?: string;
    accessories?: string;
    problemSummary: string;
    receivedBy?: string;
  }): Observable<any> {
    return this.http.post('/api/tickets/receive', payload);
  }

  listTickets(params?: Record<string, any>): Observable<{ items: any[]; total: number; page: number; limit: number }> {
    return this.http.get<{ items: any[]; total: number; page: number; limit: number }>('/api/tickets', { params });
  }

  // --- Assignments ---
  assign(payload: {
    ticketId: string;
    technician: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post('/api/assign', payload);
  }

  // --- Diagnostics ---
  diagnose(payload: {
    ticketId: string;
    findings: string;
    parts?: { name: string; qty: number; estimatedCost?: number }[];
    estimatedCost?: number;
    estimatedTime?: string;
    preparedBy?: string;
  }): Observable<any> {
    return this.http.post('/api/diagnose', payload);
  }

  diagnoseDecision(id: string, decision: 'approve' | 'reject', decidedBy?: string): Observable<any> {
    return this.http.post(`/api/diagnose/${id}/decision`, { decision, decidedBy });
  }
}
