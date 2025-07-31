import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-clear-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-clear-modal.component.html',
  styleUrls: ['./confirm-clear-modal.component.scss']
})
export class ConfirmClearModalComponent {
  @Input() visible = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
