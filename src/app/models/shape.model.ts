export interface Shape {
  id: string;
  type: 'circle' | 'square';
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  color?: string; // Optional color property
  // Added for draggable containers
  textPosition?: { x: number; y: number };
  zIndex?: number;
}

export interface CanvasState {
  shapes: Shape[];
}
