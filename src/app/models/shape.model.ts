export interface Shape {
  id: string;
  type: 'circle' | 'square';
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  color?: string; // Optional color property
}

export interface CanvasState {
  shapes: Shape[];
}
