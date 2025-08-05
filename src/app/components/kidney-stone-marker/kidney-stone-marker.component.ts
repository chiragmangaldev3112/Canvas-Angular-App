import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StoneMarker {
  id: string;
  x: number; // Relative position (0-1)
  y: number; // Relative position (0-1)
  radius: number; // Relative size (0-1)
  color: string; // hex color code
  colorIndex: number; // index in color palette
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  activeStoneId: string | null;
  startX: number;
  startY: number;
  startRadius: number;
}

@Component({
  selector: 'app-kidney-stone-marker',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid py-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <button 
                class="btn btn-outline-secondary me-3" 
                routerLink="/canvas">
                <i class="bi bi-arrow-left"></i> Back to Canvas
              </button>
              <h2 class="d-inline-block mb-0">Kidney Stone Marker</h2>
            </div>
            <div class="stone-count">
              Stones: {{stones.length}}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="button-group">
            <button class="btn btn-primary" (click)="addStone()">
              <i class="bi bi-plus-circle"></i> Add Stone
            </button>
            <button class="btn btn-success" (click)="saveStones()">
              <i class="bi bi-download"></i> Export JSON
            </button>
            <button class="btn btn-info" (click)="triggerFileUpload()">
              <i class="bi bi-upload"></i> Import JSON
            </button>
            <button class="btn btn-danger" (click)="clearAll()">
              <i class="bi bi-trash"></i> Clear All
            </button>
            <input 
              #fileInput 
              type="file" 
              accept=".json" 
              style="display: none" 
              (change)="loadStones($event)">
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-8 col-md-7">
          <!-- Kidney image container -->
          <div class="image-container" #imageContainer>
            <img 
              #kidneyImage
              src="assets/images/kidney-detailed.svg" 
              alt="Kidney Image"
              class="kidney-image"
              (load)="onImageLoad()"
              (error)="onImageError($event)"
              draggable="false">
            
            <!-- Fallback if image fails to load -->
            <div *ngIf="!imageLoaded && imageError" class="fallback-kidney">
              <svg width="600" height="400" viewBox="0 0 600 400">
                <rect width="600" height="400" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
                <path d="M200 100 C 150 100, 120 130, 120 170 C 120 200, 130 230, 150 250 C 170 270, 200 280, 230 280 C 260 280, 290 270, 310 250 C 330 230, 340 200, 340 170 C 340 140, 320 120, 290 110 C 270 105, 250 108, 235 115 C 225 120, 220 125, 215 130 C 210 125, 205 120, 200 115 C 195 110, 190 105, 185 102 C 175 100, 165 100, 155 102 L 200 100 Z" fill="#d4a574" stroke="#8b4513" stroke-width="3"/>
                <ellipse cx="230" cy="180" rx="60" ry="80" fill="#c4956a" opacity="0.7"/>
                <text x="300" y="50" font-family="Arial" font-size="20" fill="#2c3e50" text-anchor="middle">Kidney Stone Marker</text>
                <text x="300" y="350" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">Click "Add Stone" to place markers</text>
              </svg>
            </div>
            
            <!-- Stone markers -->
            <div 
              *ngFor="let stone of stones; trackBy: trackByStoneId"
              class="stone-marker"
              [class.active]="dragState.activeStoneId === stone.id"
              [style.left.%]="stone.x * 100"
              [style.top.%]="stone.y * 100"
              [style.width.px]="getCircleSize(stone.radius)"
              [style.height.px]="getCircleSize(stone.radius)"
              (mousedown)="startDrag($event, stone.id)"
              (touchstart)="startDrag($event, stone.id)">
              
              <!-- Stone circle -->
              <div 
                class="stone-circle"
                [style.border-color]="stone.color"
                [style.background-color]="hexToRgba(stone.color, 0.25)"></div>
              
              <!-- Resize handle -->
              <div 
                class="resize-handle"
                (mousedown)="startResize($event, stone.id)"
                (touchstart)="startResize($event, stone.id)">
              </div>
              
              <!-- Delete button -->
              <button 
                class="delete-btn"
                (click)="deleteStone(stone.id)"
                title="Delete stone">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Stone List Panel -->
        <div class="col-lg-4 col-md-5">
          <div class="stone-list-panel">
            <h4 class="mb-3">
              <i class="bi bi-list-ul"></i> Stone List
              <span class="badge bg-primary ms-2">{{stones.length}}</span>
            </h4>
            
            <div *ngIf="stones.length === 0" class="text-muted text-center py-4">
              <i class="bi bi-info-circle"></i>
              <p class="mb-0 mt-2">No stones added yet</p>
              <small>Click "Add Stone" to get started</small>
            </div>
            
            <div *ngIf="stones.length > 0" class="stone-items">
              <div 
                *ngFor="let stone of stones; let i = index" 
                class="stone-item"
                [class.active]="dragState.activeStoneId === stone.id"
                (click)="selectStone(stone.id)">
                
                <div class="stone-preview">
                  <div 
                    class="stone-color-circle"
                    [style.background-color]="stone.color">
                  </div>
                </div>
                
                <div class="stone-details">
                  <div class="stone-name">{{stone.id}}</div>
                  <div class="stone-coords">
                    <small class="text-muted">
                      X: {{(stone.x * 100).toFixed(1)}}% | 
                      Y: {{(stone.y * 100).toFixed(1)}}% | 
                      Size: {{(stone.radius * 100).toFixed(1)}}%
                    </small>
                  </div>
                  <div class="stone-color-info">
                    <small class="text-muted">Color: {{stone.color}}</small>
                  </div>
                </div>
                
                <div class="stone-actions">
                  <div class="size-controls">
                    <button 
                      class="btn btn-sm btn-outline-success"
                      (click)="increaseStoneSize(stone.id); $event.stopPropagation()"
                      [disabled]="stone.radius >= 0.15"
                      title="Increase size">
                      <i class="bi bi-arrow-up"></i>
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-warning"
                      (click)="decreaseStoneSize(stone.id); $event.stopPropagation()"
                      [disabled]="stone.radius <= 0.02"
                      title="Decrease size">
                      <i class="bi bi-arrow-down"></i>
                    </button>
                  </div>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    (click)="deleteStone(stone.id); $event.stopPropagation()"
                    title="Delete stone">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kidney-marker-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .title {
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
    }

    .button-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2980b9;
    }

    .btn-success {
      background-color: #27ae60;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #229954;
    }

    .btn-info {
      background-color: #17a2b8;
      color: white;
    }

    .btn-info:hover:not(:disabled) {
      background-color: #138496;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #c82333;
    }

    .btn-warning {
      background-color: #f39c12;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background-color: #e67e22;
    }

    .image-container {
      position: relative;
      display: inline-block;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      background: #f8f9fa;
    }

    .kidney-image {
      display: block;
      max-width: 100%;
      height: auto;
      user-select: none;
    }

    .fallback-kidney {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .fallback-kidney svg {
      max-width: 100%;
      height: auto;
    }

    .stone-marker {
      position: absolute;
      cursor: move;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      user-select: none;
      touch-action: none;
      transition: transform 0.1s ease;
      background: transparent;
    }

    .stone-marker.active {
      z-index: 20;
    }

    .stone-circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid #ff6384; /* Default color, will be overridden by inline style */
      background-color: rgba(255, 99, 132, 0.25); /* Default color, will be overridden by inline style */
      pointer-events: none;
      box-sizing: border-box;
    }

    .stone-marker:hover .stone-circle {
      border-color: #c0392b;
      background-color: rgba(231, 76, 60, 0.5);
    }

    .stone-marker.active .stone-circle {
      border-color: #a93226;
      background-color: rgba(231, 76, 60, 0.6);
      box-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
    }

    .resize-handle {
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 12px;
      height: 12px;
      background-color: #3498db;
      border: 2px solid white;
      border-radius: 50%;
      cursor: se-resize;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .stone-marker:hover .resize-handle,
    .stone-marker.active .resize-handle {
      opacity: 1;
    }

    .delete-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.2s ease;
    }

    .stone-marker:hover .delete-btn,
    .stone-marker.active .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      background-color: #c0392b;
      transform: scale(1.1);
    }

    .stone-list-panel {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      height: fit-content;
      max-height: 600px;
      overflow-y: auto;
    }

    .stone-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stone-item {
      display: flex;
      align-items: center;
      padding: 12px;
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .stone-item:hover {
      border-color: #007bff;
      box-shadow: 0 2px 4px rgba(0,123,255,0.1);
    }

    .stone-item.active {
      border-color: #007bff;
      background-color: #e7f3ff;
      box-shadow: 0 2px 8px rgba(0,123,255,0.2);
    }

    .stone-preview {
      margin-right: 12px;
    }

    .stone-color-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .stone-details {
      flex: 1;
    }

    .stone-name {
      font-weight: 600;
      color: #495057;
      margin-bottom: 4px;
    }

    .stone-coords {
      margin-bottom: 2px;
    }

    .stone-color-info {
      font-family: monospace;
    }

    .stone-actions {
      margin-left: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .size-controls {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .size-controls .btn {
      padding: 2px 6px;
      font-size: 12px;
      line-height: 1;
      min-width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-outline-success {
      border-color: #28a745;
      color: #28a745;
    }

    .btn-outline-success:hover:not(:disabled) {
      background-color: #28a745;
      color: white;
    }

    .btn-outline-warning {
      border-color: #ffc107;
      color: #856404;
    }

    .btn-outline-warning:hover:not(:disabled) {
      background-color: #ffc107;
      color: #212529;
    }

    .btn-outline-danger {
      border-color: #dc3545;
      color: #dc3545;
    }

    .btn-outline-danger:hover:not(:disabled) {
      background-color: #dc3545;
      color: white;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .kidney-marker-container {
        padding: 15px;
      }

      .header-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .button-group {
        justify-content: center;
      }

      .btn {
        flex: 1;
        min-width: 0;
      }

      .stone-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .resize-handle {
        width: 16px;
        height: 16px;
        bottom: -8px;
        right: -8px;
      }

      .delete-btn {
        width: 24px;
        height: 24px;
        top: -12px;
        right: -12px;
      }
    }

    /* Touch device optimizations */
    @media (hover: none) and (pointer: coarse) {
      .resize-handle,
      .delete-btn {
        opacity: 1;
      }
    }
  `]
})
export class KidneyStoneMarkerComponent implements OnInit {
  @ViewChild('imageContainer', { static: false }) imageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('kidneyImage', { static: false }) kidneyImage!: ElementRef<HTMLImageElement>;

  stones: StoneMarker[] = [];
  containerWidth = 0;
  containerHeight = 0;
  imageLoaded = false;
  imageError = false;
  
  // Color palette for stones (100 colors)
  colorPalette: string[] = [
    // Reds (1-10)
    '#FF6B6B', '#E74C3C', '#C0392B', '#FF3838', '#EE5A24', '#FF7675', '#F1948A', '#EC7063', '#CD6155', '#E55039',
    // Oranges (11-20)
    '#FF9500', '#F39C12', '#E67E22', '#D35400', '#FF9F43', '#FAB1A0', '#F8C471', '#F7DC6F', '#F4D03F', '#F1C40F',
    // Yellows (21-30)
    '#FFD32A', '#FFEAA7', '#FDCB6E', '#F9E79F', '#F7DC6F', '#F4D03F', '#F1C40F', '#D4AC0D', '#B7950B', '#F39801',
    // Greens (31-40)
    '#8CC152', '#2ECC71', '#27AE60', '#58D68D', '#82E0AA', '#A9DFBF', '#00B894', '#00CEC9', '#1ABC9C', '#16A085',
    // Teals/Cyans (41-50)
    '#4ECDC4', '#37D5D3', '#81ECEC', '#00D2D3', '#0ABDE3', '#74B9FF', '#00CEC9', '#48CAE4', '#00B4D8', '#0077B6',
    // Blues (51-60)
    '#45B7D1', '#3498DB', '#2980B9', '#5DADE2', '#85C1E9', '#AED6F1', '#54A0FF', '#0984E3', '#74B9FF', '#006BA6',
    // Purples (61-70)
    '#9B59B6', '#8E44AD', '#6C5CE7', '#5F27CD', '#A29BFE', '#BB8FCE', '#D7BDE2', '#AF7AC5', '#C44569', '#8E44AD',
    // Pinks (71-80)
    '#DDA0DD', '#FD79A8', '#FF9FF3', '#F8B500', '#D5A6BD', '#E91E63', '#AD1457', '#880E4F', '#C2185B', '#E91E63',
    // Browns/Grays (81-90)
    '#96CEB4', '#95A5A6', '#7F8C8D', '#BDC3C7', '#ECF0F1', '#AEB6BF', '#85929E', '#5D6D7E', '#34495E', '#2C3E50',
    // Special/Mixed (91-100)
    '#636E72', '#B2BEC3', '#DDD', '#55A3FF', '#3742FA', '#2F3542', '#98D8C8', '#A3E4D7', '#FAD7A0', '#2D3436'
  ];

  dragState: DragState = {
    isDragging: false,
    isResizing: false,
    activeStoneId: null,
    startX: 0,
    startY: 0,
    startRadius: 0
  };

  private stoneCounter = 0;

  ngOnInit() {
    // Load saved stones from localStorage
    this.loadSavedStones();
  }

  onImageLoad() {
    this.imageLoaded = true;
    this.imageError = false;
    this.updateContainerDimensions();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('kidney-detailed.svg')) {
      // Try the simple version first
      console.warn('Detailed kidney image failed, trying simple version');
      img.src = 'assets/images/kidney-simple.svg';
    } else {
      // If simple version also fails, show inline fallback
      console.warn('All kidney images failed, using inline fallback');
      this.imageError = true;
      this.imageLoaded = false;
      // Still update dimensions for the fallback SVG
      setTimeout(() => this.updateContainerDimensions(), 100);
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.imageLoaded) {
      this.updateContainerDimensions();
    }
  }

  private updateContainerDimensions() {
    if (this.imageContainer && this.kidneyImage) {
      const rect = this.imageContainer.nativeElement.getBoundingClientRect();
      this.containerWidth = rect.width;
      this.containerHeight = rect.height;
    }
  }

  addStone() {
    // Allow up to 100 stones
    if (this.stones.length >= 100) return;

    this.stoneCounter++;
    const colorIndex = (this.stones.length) % this.colorPalette.length;
    const newStone: StoneMarker = {
      id: `stone${this.stoneCounter}`,
      x: 0.5, // Center horizontally
      y: 0.5, // Center vertically
      radius: 0.05, // 5% of container size
      color: this.colorPalette[colorIndex],
      colorIndex: colorIndex
    };

    this.stones.push(newStone);
    this.saveToLocalStorage();
  }

  deleteStone(stoneId: string) {
    this.stones = this.stones.filter(stone => stone.id !== stoneId);
    this.saveToLocalStorage();
  }

  selectStone(stoneId: string) {
    // Highlight the selected stone
    this.dragState.activeStoneId = stoneId;
  }

  hexToRgba(hex: string, alpha: number): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getCircleSize(radius: number): number {
    // Use the smaller dimension to ensure perfect circles
    const minDimension = Math.min(this.containerWidth, this.containerHeight);
    return radius * minDimension * 2;
  }

  triggerFileUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  loadStones(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Validate the JSON structure
        if (this.validateStonesData(jsonData)) {
          this.stones = jsonData.map((stone: any, index: number) => ({
            ...stone,
            // Ensure color properties exist, assign if missing
            color: stone.color || this.colorPalette[index % this.colorPalette.length],
            colorIndex: stone.colorIndex !== undefined ? stone.colorIndex : index
          }));
          
          this.saveToLocalStorage();
          console.log('Stones loaded successfully:', this.stones.length, 'stones');
        } else {
          alert('Invalid JSON format. Please ensure the file contains valid stone marker data.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error reading JSON file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    input.value = '';
  }

  validateStonesData(data: any): boolean {
    if (!Array.isArray(data)) return false;
    
    return data.every(stone => 
      typeof stone.id === 'string' &&
      typeof stone.x === 'number' &&
      typeof stone.y === 'number' &&
      typeof stone.radius === 'number' &&
      stone.x >= 0 && stone.x <= 1 &&
      stone.y >= 0 && stone.y <= 1 &&
      stone.radius > 0 && stone.radius <= 1
    );
  }

  increaseStoneSize(stoneId: string) {
    const stone = this.stones.find(s => s.id === stoneId);
    if (stone && stone.radius < 0.15) {
      stone.radius = Math.min(0.15, stone.radius + 0.01);
      this.saveToLocalStorage();
    }
  }

  decreaseStoneSize(stoneId: string) {
    const stone = this.stones.find(s => s.id === stoneId);
    if (stone && stone.radius > 0.02) {
      stone.radius = Math.max(0.02, stone.radius - 0.01);
      this.saveToLocalStorage();
    }
  }

  clearAll() {
    this.stones = [];
    this.saveToLocalStorage();
  }

  startDrag(event: MouseEvent | TouchEvent, stoneId: string) {
    event.preventDefault();
    event.stopPropagation();

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    this.dragState = {
      isDragging: true,
      isResizing: false,
      activeStoneId: stoneId,
      startX: clientX,
      startY: clientY,
      startRadius: 0
    };

    this.updateContainerDimensions();
  }

  startResize(event: MouseEvent | TouchEvent, stoneId: string) {
    event.preventDefault();
    event.stopPropagation();

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const stone = this.stones.find(s => s.id === stoneId);
    if (!stone) return;

    this.dragState = {
      isDragging: false,
      isResizing: true,
      activeStoneId: stoneId,
      startX: clientX,
      startY: clientY,
      startRadius: stone.radius
    };

    this.updateContainerDimensions();
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent) {
    if (!this.dragState.activeStoneId || (!this.dragState.isDragging && !this.dragState.isResizing)) {
      return;
    }

    event.preventDefault();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const stone = this.stones.find(s => s.id === this.dragState.activeStoneId);
    if (!stone || !this.imageContainer) return;

    const containerRect = this.imageContainer.nativeElement.getBoundingClientRect();

    if (this.dragState.isDragging) {
      // Calculate new position
      const deltaX = clientX - this.dragState.startX;
      const deltaY = clientY - this.dragState.startY;

      const newX = stone.x + (deltaX / containerRect.width);
      const newY = stone.y + (deltaY / containerRect.height);

      // Constrain to image boundaries
      stone.x = Math.max(0.05, Math.min(0.95, newX));
      stone.y = Math.max(0.05, Math.min(0.95, newY));

      this.dragState.startX = clientX;
      this.dragState.startY = clientY;
    } else if (this.dragState.isResizing) {
      // Calculate new radius based on distance from stone center
      const deltaX = clientX - this.dragState.startX;
      const deltaY = clientY - this.dragState.startY;
      
      // Get stone center position in screen coordinates
      const stoneCenterX = containerRect.left + (stone.x * containerRect.width);
      const stoneCenterY = containerRect.top + (stone.y * containerRect.height);
      
      // Calculate current distance from stone center
      const currentDistance = Math.sqrt(
        Math.pow(clientX - stoneCenterX, 2) + 
        Math.pow(clientY - stoneCenterY, 2)
      );
      
      // Calculate initial distance when resize started
      const initialDistance = Math.sqrt(
        Math.pow(this.dragState.startX - stoneCenterX, 2) + 
        Math.pow(this.dragState.startY - stoneCenterY, 2)
      );
      
      // Calculate radius based on the ratio of distances
      const distanceRatio = currentDistance / initialDistance;
      const newRadius = this.dragState.startRadius * distanceRatio;

      // Constrain radius
      stone.radius = Math.max(0.02, Math.min(0.15, newRadius));
    }
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onMouseUp(event: MouseEvent | TouchEvent) {
    if (this.dragState.activeStoneId && (this.dragState.isDragging || this.dragState.isResizing)) {
      this.saveToLocalStorage();
    }

    this.dragState = {
      isDragging: false,
      isResizing: false,
      activeStoneId: null,
      startX: 0,
      startY: 0,
      startRadius: 0
    };
  }

  saveStones() {
    const exportData = this.stones.map(stone => ({
      id: stone.id,
      x: Math.round(stone.x * 1000) / 1000, // Round to 3 decimal places
      y: Math.round(stone.y * 1000) / 1000,
      radius: Math.round(stone.radius * 1000) / 1000
    }));

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kidney-stones-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also log to console for debugging
    console.log('Exported stone data:', exportData);
  }

  private saveToLocalStorage() {
    localStorage.setItem('kidney-stones', JSON.stringify(this.stones));
  }

  private loadSavedStones() {
    const saved = localStorage.getItem('kidney-stones');
    if (saved) {
      try {
        this.stones = JSON.parse(saved);
        // Update counter to avoid ID conflicts
        this.stoneCounter = this.stones.length;
      } catch (error) {
        console.error('Error loading saved stones:', error);
        this.stones = [];
      }
    }
  }

  trackByStoneId(index: number, stone: StoneMarker): string {
    return stone.id;
  }
}
