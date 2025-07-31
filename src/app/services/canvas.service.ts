import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Shape, CanvasState } from '../models/shape.model';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  public suppressNextCanvasClick = false;
  private shapes: Shape[] = [];
  private selectedShapeId: string | null = null;
  private stateSubject = new BehaviorSubject<CanvasState>({ shapes: [] });
  private selectedShapeSubject = new BehaviorSubject<string | null>(null);

  state$: Observable<CanvasState> = this.stateSubject.asObservable();
  selectedShape$ = this.selectedShapeSubject.asObservable();

  constructor() {
    this.loadState();
  }

  private saveState() {
    const state: CanvasState = { shapes: this.shapes };
    localStorage.setItem('canvasState', JSON.stringify(state));
    this.stateSubject.next(state);
  }

  private loadState() {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
      const state: CanvasState = JSON.parse(savedState);
      this.shapes = state.shapes;
      this.stateSubject.next(state);
    }
  }

  addShape(type: 'circle' | 'square', x: number, y: number) {
    const newShape: Shape = {
      id: this.generateId(),
      type,
      x,
      y,
      text: `${type} ${this.shapes.length + 1}`,
      width: 100,
      height: 100,
      color: '#FFEB3B' // Default yellow color
    };
    this.shapes.push(newShape);
    this.saveState();
    return newShape;
  }

  updateShapePosition(id: string, x: number, y: number) {
    const shape = this.shapes.find(s => s.id === id);
    if (shape) {
      // Only update if position actually changed
      if (shape.x !== x || shape.y !== y) {
        shape.x = x;
        shape.y = y;
        this.saveState();
      }
      return true;
    }
    return false;
  }

  updateShapeText(shapeId: string, text: string): void {
    const shapeIndex = this.shapes.findIndex(s => s.id === shapeId);
    if (shapeIndex !== -1 && this.shapes[shapeIndex].text !== text) {
      // Create a new array with the updated shape
      const updatedShapes = [...this.shapes];
      updatedShapes[shapeIndex] = {
        ...updatedShapes[shapeIndex],
        text: text
      };
      
      // Update the shapes array
      this.shapes = updatedShapes;
      
      // Update the state
      const currentState = this.stateSubject.getValue();
      this.stateSubject.next({
        ...currentState,
        shapes: updatedShapes
      });
      
      // Save to local storage
      this.saveState();
      
      // Force update all subscribers
      this.shapes = [...updatedShapes];
    }
  }

  updateShapeColor(shapeId: string, color: string): void {
    const shapeIndex = this.shapes.findIndex(s => s.id === shapeId);
    if (shapeIndex !== -1 && this.shapes[shapeIndex].color !== color) {
      // Create a new array with the updated shape
      const updatedShapes = [...this.shapes];
      updatedShapes[shapeIndex] = {
        ...updatedShapes[shapeIndex],
        color: color
      };
      // Update the shapes array
      this.shapes = updatedShapes;
      // Update the state
      const currentState = this.stateSubject.getValue();
      this.stateSubject.next({
        ...currentState,
        shapes: updatedShapes
      });
      // Save to local storage
      this.saveState();
      // Force update all subscribers
      this.shapes = [...updatedShapes];
    }
  }

  deleteShape(id: string) {
    this.shapes = this.shapes.filter(shape => shape.id !== id);
    if (this.selectedShapeId === id) {
      this.selectedShapeId = null;
      this.selectedShapeSubject.next(null);
    }
    this.saveState();
  }

  selectShape(id: string | null) {
    this.selectedShapeId = id;
    this.selectedShapeSubject.next(id);
  }

  getSelectedShapeId(): string | null {
    return this.selectedShapeId;
  }

  replaceAllShapes(shapes: Shape[]): void {
    this.shapes = [...shapes];
    this.saveState();
    this.stateSubject.next({ shapes: this.shapes });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
