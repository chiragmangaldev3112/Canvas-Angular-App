export interface ShapePaletteItem {
  type: 'circle' | 'square';
  label: string;
  icon: string; // Bootstrap icon class
  color: string;
  width: number;
  height: number;
}

export const SHAPE_PALETTE: ShapePaletteItem[] = [
    {
      type: 'circle',
      label: 'Surgeon',
      icon: 'bi-circle',
      color: '#FFEB3B', // Yellow
      width: 100,
      height: 100
    },
    {
      type: 'square',
      label: 'Nurse',
      icon: 'bi-square',
      color: '#4CAF50', // Green
      width: 100,
      height: 100
    },
    {
      type: 'circle',
      label: 'Anesthetist',
      icon: 'bi-circle',
      color: '#F44336', // Red
      width: 100,
      height: 100
    },
    {
      type: 'square',
      label: 'Technician',
      icon: 'bi-square',
      color: '#2196F3', // Blue
      width: 100,
      height: 100
    },
    {
      type: 'circle',
      label: 'Patient',
      icon: 'bi-circle',
      color: '#9C27B0', // Purple
      width: 100,
      height: 100
    },
    {
      type: 'square',
      label: 'Equipment 1',
      icon: 'bi-square',
      color: '#FF9800', // Orange
      width: 100,
      height: 100
    },
    {
      type: 'circle',
      label: 'Equipment 2',
      icon: 'bi-circle',
      color: '#00BCD4', // Cyan
      width: 100,
      height: 100
    },
    {
      type: 'square',
      label: 'Bed',
      icon: 'bi-square',
      color: '#795548', // Brown
      width: 100,
      height: 100
    }
  ];
  
