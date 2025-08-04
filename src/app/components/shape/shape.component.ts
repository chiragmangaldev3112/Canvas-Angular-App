import { Component, Input, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy, Renderer2, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Shape } from '../../models/shape.model';
import { CanvasService } from '../../services/canvas.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shape',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shape.component.html',
  styleUrls: ['./shape.component.scss']
})
export class ShapeComponent implements OnChanges, AfterViewInit, OnDestroy {
  // Predefined list of colors for the picker
  readonly colorOptions: string[] = [
    '#FFEB3B', // Yellow
    '#F44336', // Red
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#FFFFFF', // White
    '#000000'  // Black
  ];

  colorPickerOpen = false;

  // Apply color to shape
  get shapeColor(): string {
    return (this.shape && typeof this.shape.color === 'string' && this.shape.color.trim() !== '')
      ? this.shape.color
      : '#FFEB3B'; // Default yellow
  }

  setShapeColor(color: string): void {
    if (this.shape) {
      this.canvasService.updateShapeColor(this.shape.id, color);
      this.colorPickerOpen = false;
    }
  }

  toggleColorPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.colorPickerOpen = !this.colorPickerOpen;
  }

  inputWidth: number = 100; // Default width
  @Input() shape!: Shape;
  editingText = '';
  private originalText = '';
  private documentMouseMoveListener: (() => void) | null = null;
  private documentMouseUpListener: (() => void) | null = null;
  @ViewChild('shapeElement') shapeElement!: ElementRef<HTMLDivElement>;
  @ViewChild('textInput') textInput?: ElementRef<HTMLInputElement>;
  @ViewChild('shapeTextContainer') shapeTextContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('mirrorRef') mirrorRef!: ElementRef<HTMLDivElement>;

 

  adjustHeight() {
    const mirror = this.mirrorRef.nativeElement;
    if(this.textInput!=null){
      const input = this.textInput.nativeElement;
      // Update height
      input.style.height = mirror.offsetHeight + 'px';
    }
   
  }
  @Input() isSelected = false;
  isEditing = false;
  isDragging = false;
  showTooltip = false;
  displayText = '';
  isTextTruncated = false;
  private maxTextLines = 2;
  private maxTextLength = 30; // Initial max length before showing info icon
  private clickOutsideListener: (() => void) | null = null;
  dragOffset = { x: 0, y: 0 };
  private subscription = new Subscription();
  private clickTimeout: any = null;
  private isDoubleClick = false;

  constructor(
    private canvasService: CanvasService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    console.log('ShapeComponent: Constructor called');
    console.log('Shape:', this.shape);
  }

  private originalPosition = { x: 0, y: 0 };
  
  ngAfterViewInit() {
    console.log('ShapeComponent: ngAfterViewInit called');
    console.log('Shape element:', this.shapeElement);
    console.log('Text input element:', this.textInput);
    this.adjustHeight(); // Initial adjustment
    this.updateDisplayText();
    
    this.subscription.add(
      this.canvasService.selectedShape$.subscribe(selectedId => {
        console.log('Selected shape changed:', { selectedId, currentShapeId: this.shape?.id });
        this.isSelected = selectedId === this.shape?.id;
        console.log('Is selected:', this.isSelected);
        
        if (this.isSelected && this.isEditing) {
          console.log('Focusing input...');
          setTimeout(() => this.focusInput());
        } else if (!this.isSelected) {
          console.log('Deselected, turning off edit mode');
          this.isEditing = false;
        }
      })
    );
    
    // Initial check for text truncation
    console.log('Initial text truncation check');
    this.checkTextTruncation();
    
    // Check again after a short delay to ensure the view is fully rendered
    console.log('Scheduling secondary text truncation check');
    setTimeout(() => {
      console.log('Running secondary text truncation check');
      this.checkTextTruncation();
      
      // Log the current state
      console.log('Shape component state after view init:', {
        shape: this.shape,
        isSelected: this.isSelected,
        isEditing: this.isEditing,
        inputWidth: this.inputWidth,
        displayText: this.displayText,
        isTextTruncated: this.isTextTruncated
      });
    }, 100);
  }
  
  private setupDragAndDrop() {
    console.log('Setting up drag and drop for shape:', this.shape?.id);
    // Add drag and drop setup logic here
  }

  private setupTextEditing() {
    console.log('Setting up text editing for shape:', this.shape?.id);
    // Add text editing setup logic here
  }

  ngOnInit() {
    console.log('ShapeComponent: ngOnInit called');
    console.log('Shape in ngOnInit:', this.shape);
    this.setupDragAndDrop();
    this.setupTextEditing();
    this.updateDisplayText();
  }
  
  ngOnChanges(changes: SimpleChanges) {
    console.log('ShapeComponent: ngOnChanges called', changes);
    if (this.shape) {
      console.log('Shape updated:', this.shape);
      this.updateDisplayText();
      this.originalText = this.shape.text;
    } else {
      console.warn('Shape is undefined in ngOnChanges');
    }
  }
  
  private updateDisplayText() {
    if (!this.shape?.text) {
      this.displayText = '';
      this.isTextTruncated = false;
      return;
    }
    
    this.displayText = this.shape.text;
    
    // Force update the view before checking truncation
    this.changeDetectorRef.detectChanges();
    
    // Check truncation after the view is updated
    setTimeout(() => {
      this.checkTextTruncation();
      // Force another change detection after checking truncation
      this.changeDetectorRef.detectChanges();
    }, 0);
  }
  
  private checkTextTruncation() {
    if (!this.shapeTextContainer?.nativeElement) {
      return;
    }
    
    const container = this.shapeTextContainer.nativeElement;
    const textElement = container.querySelector('.text-content') as HTMLElement;
    
    if (!textElement) {
      return;
    }
    
    // // Check if text is truncated by comparing scroll width to client width
    // const isTruncated = textElement.scrollWidth > textElement.clientWidth;
    
    // // Only update if changed to avoid unnecessary change detection
    // if (this.isTextTruncated !== isTruncated) {
    //   this.isTextTruncated = isTruncated;
    //   return true; // Indicate that the value changed
    // }
    
    return false; // No change
  }
  
  showFullText(event: MouseEvent) {
    event.stopPropagation();
    this.showTooltip = true;
    
    // Close tooltip when clicking outside
    if (this.clickOutsideListener) {
      this.clickOutsideListener();
    }
    
    this.clickOutsideListener = this.renderer.listen('document', 'click', (e: Event) => {
      if (!this.elementRef.nativeElement.contains(e.target)) {
        this.hideTooltip();
      }
    });
  }
  
  hideTooltip() {
    this.showTooltip = false;
    if (this.clickOutsideListener) {
      this.clickOutsideListener();
      this.clickOutsideListener = null;
    }
  }

  copyDebugInfo() {
    try {
      const shapeElement = this.shapeElement?.nativeElement;
      const style = shapeElement ? window.getComputedStyle(shapeElement) : null;
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        shape: {
          id: this.shape?.id,
          width: this.shape?.width,
          text: this.shape?.text,
          type: this.shape?.type
        },
        element: shapeElement ? {
          tagName: shapeElement.tagName,
          className: shapeElement.className,
          offsetWidth: shapeElement.offsetWidth,
          clientWidth: shapeElement.clientWidth,
          scrollWidth: shapeElement.scrollWidth,
          computedStyle: style ? {
            width: style.width,
            padding: style.padding,
            border: style.border,
            boxSizing: style.boxSizing,
            display: style.display,
            position: style.position
          } : null
        } : null,
        input: {
          width: this.inputWidth,
          isEditing: this.isEditing,
          editingText: this.editingText
        }
      };
      
      const debugString = JSON.stringify(debugInfo, null, 2);
      navigator.clipboard.writeText(debugString).then(() => {
        console.log('Debug info copied to clipboard');
        console.log(debugString);
      }).catch(err => {
        console.error('Failed to copy debug info:', err);
        console.log('Debug info (copy manually):\n', debugString);
      });
      
    } catch (error) {
      console.error('Error copying debug info:', error);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.hideTooltip();
  }

  private focusInput() {
    if (this.textInput) {
      this.textInput.nativeElement.focus();
      this.textInput.nativeElement.select();
    }
  }

  ngAfterViewChecked() {
    console.log('AfterViewChecked - isEditing:', this.isEditing);
    
    if (this.isEditing) {
      console.log('Shape element exists:', !!this.shapeElement?.nativeElement);
      
      if (this.shapeElement?.nativeElement) {
        try {
          const shapeElement = this.shapeElement.nativeElement;
          const style = window.getComputedStyle(shapeElement);
          
          // Log the computed values for debugging
          const debugInfo = {
            shapeId: this.shape?.id,
            shapeWidth: this.shape?.width,
            element: {
              tagName: shapeElement.tagName,
              className: shapeElement.className,
              offsetWidth: shapeElement.offsetWidth,
              clientWidth: shapeElement.clientWidth,
              scrollWidth: shapeElement.scrollWidth,
              computedWidth: style.width,
              padding: style.padding,
              paddingLeft: style.paddingLeft,
              paddingRight: style.paddingRight,
              borderLeftWidth: style.borderLeftWidth,
              borderRightWidth: style.borderRightWidth,
              boxSizing: style.boxSizing,
              margin: style.margin,
              position: style.position,
              display: style.display
            },
            inputWidth: this.inputWidth
          };
          
          console.log('=== SHAPE DEBUG INFO ===');
          console.log(debugInfo);
          console.log('========================');
          
          // Calculate the content width
          const width = shapeElement.offsetWidth;
          const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          const border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
          const contentWidth = width - padding - border;
          
          console.log('Calculated content width:', contentWidth);
          
          // Set the input width to match the shape's content width
          const newWidth = Math.max(60, contentWidth);
          console.log('Setting input width to:', newWidth);
          
          if (this.inputWidth !== newWidth) {
            this.inputWidth = newWidth;
            this.changeDetectorRef.detectChanges();
          }
          
        } catch (error) {
          console.error('Error in ngAfterViewChecked:', error);
        }
      } else {
        console.warn('Shape element not found in the DOM');
      }
    }
  }

  startEditing(event?: MouseEvent) {
    console.log('[startEditing] Called. isDragging:', this.isDragging, 'isEditing:', this.isEditing);
    if (event) {
      console.log('[startEditing] Mouse:', {x: event.clientX, y: event.clientY});
    }
    if (event) {
      event.stopPropagation();
      event.preventDefault();
      
      // If this was a double-click on the text, prevent the shape's double-click handler from running
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
        this.clickTimeout = null;
      }
    }
    
    if (this.isDragging) {
      this.isDragging = false;
      return;
    }
    
    // Set initial input width
    this.inputWidth = this.shape.width;
    
    // Store the current scroll position
    const container = this.elementRef.nativeElement.closest('.canvas-container');
    const scrollTop = container?.scrollTop || 0;
    const scrollLeft = container?.scrollLeft || 0;
    
    this.originalText = this.shape.text;
    this.editingText = this.shape.text;
    this.isEditing = true;
    this.canvasService.selectShape(this.shape.id);
    
    // Use setTimeout to ensure the input element is in the DOM
    setTimeout(() => {
      this.focusInput();
      
      // Restore scroll position to prevent jumping
      if (container) {
        container.scrollTop = scrollTop;
        container.scrollLeft = scrollLeft;
      }
    });
  }

  saveText() {
    if (this.editingText !== undefined) {
      const newText = this.editingText.trim();
      // Only update if text has changed
      if (newText !== this.originalText) {
        // Update through the service
        this.canvasService.updateShapeText(this.shape.id, newText);
        // Force update the shape reference to trigger change detection
        this.shape = { ...this.shape, text: newText };
        // Force update the display
        this.updateDisplayText();
        // Force change detection
        this.changeDetectorRef.detectChanges();
      }
    }
    this.isEditing = false;
  }

  cancelEditing() {
    this.isEditing = false;
    // Reset to the original text
    this.shape = { ...this.shape, text: this.originalText };
    this.changeDetectorRef.detectChanges();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    console.log('[onMouseDown] Mouse:', {x: event.clientX, y: event.clientY});
    console.log('[onMouseDown] Shape position before drag:', {x: this.shape.x, y: this.shape.y});
    if (this.isEditing) {
      // If editing, do not start dragging
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    // Only allow left mouse button for drag
    if (event.button !== 0) {
      return;
    }
    // Prevent text selection during drag and stop propagation
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
    this.canvasService.selectShape(this.shape.id);
    this.canvasService.bringShapeToFront(this.shape.id); // bring to front

    // Get the canvas container to handle scroll position
    const container = this.elementRef.nativeElement.closest('.canvas-container');
    const containerRect = container.getBoundingClientRect();

    // Calculate initial offset relative to the shape's top-left corner
    const rect = this.shapeElement.nativeElement.getBoundingClientRect();
    // Calculate dragOffset relative to the shape's position in the canvas
    this.dragOffset = {
      x: event.clientX - (containerRect.left + this.shape.x),
      y: event.clientY - (containerRect.top + this.shape.y)
    };
    console.log('[onMouseDown] FIXED dragOffset:', this.dragOffset);
    console.log('[onMouseDown] shape.x/y:', {x: this.shape.x, y: this.shape.y});
    console.log('[onMouseDown] containerRect.left/top:', {left: containerRect.left, top: containerRect.top});

    this.setShapeDraggingClass(true);

    // Store initial position for potential revert
    this.originalPosition = { x: this.shape.x, y: this.shape.y };

    // Set up document event listeners
    this.renderer.setStyle(document.body, 'cursor', 'grabbing');
    this.renderer.setStyle(document.body, 'user-select', 'none');

    // Use capture phase to ensure we get the mouseup event
    this.documentMouseMoveListener = this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
    this.documentMouseUpListener = this.renderer.listen('document', 'mouseup', this.onMouseUp.bind(this), { capture: true });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    console.log('[onMouseMove] Mouse:', {x: event.clientX, y: event.clientY});
    if (!this.isDragging) return;
    
    event.preventDefault();
    
    // Get the canvas container to handle scroll position
    const container = this.elementRef.nativeElement.closest('.canvas-container');
    
    // Calculate new position relative to the container
    // Calculate new position relative to the canvas container
    const containerRect = container.getBoundingClientRect();
    const newX = event.clientX - containerRect.left - this.dragOffset.x;
    const newY = event.clientY - containerRect.top - this.dragOffset.y;
    console.log('[onMouseMove] Calculated newX/newY:', {newX, newY});
    // Update position
    this.canvasService.updateShapePosition(this.shape.id, newX, newY);
    console.log('[onMouseMove] Shape position updated:', {id: this.shape.id, newX, newY});
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    console.log('[onMouseUp] isDragging:', this.isDragging);
    console.log('[onMouseUp] Mouse:', {x: event.clientX, y: event.clientY});
    if (this.isDragging) {
      this.isDragging = false;
      this.setShapeDraggingClass(false);
      // Always stop propagation to prevent accidental canvas click
      event.stopPropagation();
      event.preventDefault();
      // Suppress the next canvas click to prevent accidental shape creation after drag
      this.canvasService.suppressNextCanvasClick = true;
    }
    // Remove global drag listeners and reset cursor
    this.renderer.setStyle(document.body, 'cursor', '');
    this.renderer.setStyle(document.body, 'user-select', '');
    if (this.documentMouseMoveListener) {
      this.documentMouseMoveListener();
      this.documentMouseMoveListener = null;
    }
    if (this.documentMouseUpListener) {
      this.documentMouseUpListener();
      this.documentMouseUpListener = null;
    }
    // Small delay to prevent accidental text editing after dragging
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  // Optionally, bring to front on click as well
  onShapeClick(event: MouseEvent) {
    this.canvasService.bringShapeToFront(this.shape.id);
  }

  // Utility to toggle is-dragging class on shape-root
  private setShapeDraggingClass(isDragging: boolean) {
    const root = this.shapeElement?.nativeElement;
    if (root) {
      if (isDragging) {
        this.renderer.addClass(root, 'is-dragging');
      } else {
        this.renderer.removeClass(root, 'is-dragging');
      }
    }
  }

  // --- DRAG LOGIC FOR TEXT/EDIT CONTAINERS ---
  private isTextDragging = false;
  private textDragOffset = { x: 0, y: 0 };

  onTextContainerMouseDown(event: MouseEvent) {
    event.stopPropagation();
    if (this.isEditing) return; // Don't drag text container while editing
    this.isTextDragging = true;
    this.canvasService.bringShapeToFront(this.shape.id); // bring to front
    this.setShapeDraggingClass(true);
    const container = this.shapeTextContainer?.nativeElement;
    const rect = container.getBoundingClientRect();
    this.textDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    document.addEventListener('mousemove', this.onTextContainerMouseMove);
    document.addEventListener('mouseup', this.onTextContainerMouseUp);
  }

  onEditContainerMouseDown(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isEditing) return;
    this.isTextDragging = true;
    this.canvasService.bringShapeToFront(this.shape.id); // bring to front
    this.setShapeDraggingClass(true);
    const container = (event.target as HTMLElement).closest('.editing-container') as HTMLElement;
    const rect = container.getBoundingClientRect();
    this.textDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    document.addEventListener('mousemove', this.onTextContainerMouseMove);
    document.addEventListener('mouseup', this.onTextContainerMouseUp);
  }

  onTextContainerMouseMove = (event: MouseEvent) => {
    if (!this.isTextDragging) return;
    // Use the correct parent for bounding rect
    const parentRect = this.shapeElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - parentRect.left - this.textDragOffset.x;
    const y = event.clientY - parentRect.top - this.textDragOffset.y;
    this.shape.textPosition = { x, y };
    this.changeDetectorRef.detectChanges();
  };

  onTextContainerMouseUp = (event: MouseEvent) => {
    if (!this.isTextDragging) return;
    this.isTextDragging = false;
    this.setShapeDraggingClass(false);
    document.removeEventListener('mousemove', this.onTextContainerMouseMove);
    document.removeEventListener('mouseup', this.onTextContainerMouseUp);
    // Save position to shape JSON/service
    this.canvasService.updateShape(this.shape.id, { textPosition: this.shape.textPosition });
  };

}
