import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CanvasService } from '../services/canvas.service';
import { Shape, CanvasState } from '../models/shape.model';
import { SHAPE_PALETTE, ShapePaletteItem } from '../models/shape-palette';
import { ShapeComponent } from '../components/shape/shape.component';
import { ConfirmClearModalComponent } from './confirm-clear-modal.component';
import { MediaCaptureModalComponent, CaptureMode } from '../components/media-capture-modal/media-capture-modal.component';
import { MediaCaptureResult } from '../services/media-capture.service';

type ShapeType = 'circle' | 'square';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, RouterLink, ShapeComponent, ConfirmClearModalComponent, MediaCaptureModalComponent],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit {
  shapePalette: ShapePaletteItem[] = SHAPE_PALETTE;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLDivElement>;
  selectedShapeType: ShapeType | null = null;
  shapes: Shape[] = [];
  selectedShapeId: string | null = null;
  showClearModal = false;
  
  // Media capture properties
  showMediaCaptureModal = false;
  mediaCaptureMode: CaptureMode = 'image';
  
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

    // Add a new shape with default label and color
    this.canvasService.addShape(this.selectedShapeType, x, y);
  }
  
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    // Right-click on canvas clears selection
    if (!(event.target as HTMLElement).closest('.shape')) {
      this.canvasService.selectShape(null);
    }
  }

  // Drag-and-drop handlers for palette to canvas
  onShapePaletteDragStart(event: DragEvent, item: ShapePaletteItem) {
    event.dataTransfer?.setData('application/json', JSON.stringify(item));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onCanvasDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  onCanvasDrop(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('application/json');
    if (!data) return;
    let item: ShapePaletteItem;
    try {
      item = JSON.parse(data);
    } catch {
      return;
    }
    // Get drop position relative to canvas
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - item.width / 2;
    const y = event.clientY - rect.top - item.height / 2;
    // Add shape to canvas with all palette properties
    this.canvasService.addShape(item, x, y);
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

  // Media capture methods
  openMediaCapture(mode: CaptureMode) {
    this.mediaCaptureMode = mode;
    this.showMediaCaptureModal = true;
  }

  handleMediaCapture(result: MediaCaptureResult) {
    console.log(`${result.type} captured:`, result.path);
    console.log('Media file URL:', result.url);
    console.log('Media file size:', result.blob.size, 'bytes');
    
    // Here you can save the media file or send it to your backend
    // For now, we'll just log the information
    alert(`${result.type} captured successfully! Check console for details.`);
    
    this.showMediaCaptureModal = false;
  }

  handleMediaCaptureCancel() {
    this.showMediaCaptureModal = false;
  }
}
