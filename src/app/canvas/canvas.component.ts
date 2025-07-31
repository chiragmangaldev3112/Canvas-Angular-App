import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../services/canvas.service';
import { Shape, CanvasState } from '../models/shape.model';
import { ShapeComponent } from '../components/shape/shape.component';
import { ConfirmClearModalComponent } from './confirm-clear-modal.component';

type ShapeType = 'circle' | 'square';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, ShapeComponent, ConfirmClearModalComponent],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  selectedShapeType: ShapeType | null = null;
  shapes: Shape[] = [];
  selectedShapeId: string | null = null;
  showClearModal = false;
  
  constructor(private canvasService: CanvasService) {}
  
  ngOnInit() {
    console.log('CanvasComponent: ngOnInit called');
    
    this.canvasService.state$.subscribe((state: CanvasState) => {
      console.log('Canvas state updated:', state);
      this.shapes = [...state.shapes];
      console.log('Shapes array updated:', this.shapes);
      
      // Log each shape's properties
      this.shapes.forEach((shape, index) => {
        console.log(`Shape ${index + 1}:`, {
          id: shape.id,
          type: shape.type,
          text: shape.text,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height
        });
      });

      this.setSelectedShape(this.selectedShapeType ?? 'circle');
    });
    
    this.canvasService.selectedShape$.subscribe((shapeId: string | null) => {
      console.log('Selected shape changed:', shapeId);
      this.selectedShapeId = shapeId;
    });
  }
  
  setSelectedShape(type: ShapeType) {
    this.selectedShapeType = type;
    this.canvasService.selectShape(null);
  }
  
  onCanvasClick(event: MouseEvent) {
    // Suppress accidental click after drag
    if (this.canvasService.suppressNextCanvasClick) {
      this.canvasService.suppressNextCanvasClick = false;
      return;
    }
    // Don't add a new shape if we're clicking on an existing shape or its text
    const target = event.target as HTMLElement;
    if (target.closest('app-shape')) {
      return;
    }

    if (!this.selectedShapeType) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    const x = event.clientX - rect.left - 50; // Center the shape on cursor
    const y = event.clientY - rect.top - 50;

    // Add a new shape with default text and size
    this.canvasService.addShape(this.selectedShapeType, x, y);
  }
  
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    
    // Right-click on canvas clears selection
    if (!(event.target as HTMLElement).closest('.shape')) {
      this.canvasService.selectShape(null);
    }
  }
  
  // setSelectedShape is already defined above
  
  deleteSelectedShape() {
    if (this.selectedShapeId) {
      this.canvasService.deleteShape(this.selectedShapeId);
    }
  }
  
  saveCanvas() {
    // Print the current shapes as JSON for backend/server use
    const shapesJson = JSON.stringify(this.shapes, null, 2);
    console.log('Shapes JSON:', shapesJson);
    alert('Canvas saved! JSON printed to console.');
  }

  loadCanvasFromJson(json: string) {
    function isValidShape(obj: any): obj is Shape {
      return obj &&
        typeof obj.id === 'string' &&
        (obj.type === 'circle' || obj.type === 'square') &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number' &&
        typeof obj.text === 'string' &&
        typeof obj.width === 'number' &&
        typeof obj.height === 'number' &&
        typeof obj.color === 'string';
    }
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('JSON is not an array');
      const shapes: Shape[] = parsed.filter(isValidShape);
      if (shapes.length === 0) {
        alert('No valid shapes found in JSON.');
        return;
      }
      this.shapes = [...shapes];
      this.canvasService.replaceAllShapes(shapes);
      alert('Shapes loaded from JSON!');
    } catch (e) {
      alert('Invalid JSON: ' + e);
    }
  }
  
  openClearCanvasModal() {
    this.showClearModal = true;
  }

  handleClearConfirm() {
    // Clear all shapes
    this.shapes.forEach(shape => {
      this.canvasService.deleteShape(shape.id);
    });
    this.selectedShapeType = null;
    this.canvasService.selectShape(null);
    this.showClearModal = false;
  }

  handleClearCancel() {
    this.showClearModal = false;
  }
}
