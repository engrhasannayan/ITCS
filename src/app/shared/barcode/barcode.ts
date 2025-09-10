import { Component, Input, ElementRef, ViewChild, OnChanges, AfterViewInit } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Component({
  selector: 'app-barcode',
  standalone: true,
  templateUrl: './barcode.html',
  styleUrls: ['./barcode.css'],
})
export class BarcodeComponent implements OnChanges, AfterViewInit {
  @Input() value = '';
  @Input() format: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'EAN5' | 'EAN2' | 'ITF14' | 'MSI' | 'Pharmacode' = 'CODE128';
  @Input() width = 2;
  @Input() height = 60;
  @Input() displayValue = true;

  @ViewChild('svg', { static: true }) svg!: ElementRef<SVGSVGElement>;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  private render() {
    const el = this.svg?.nativeElement;
    if (!el) return;
    try {
      JsBarcode(el, this.value || '-', {
        format: this.format,
        width: this.width,
        height: this.height,
        displayValue: this.displayValue,
        margin: 0,
        fontSize: 14,
      });
    } catch {
      // ignore rendering errors
    }
  }
}
