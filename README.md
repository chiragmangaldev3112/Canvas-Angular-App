# Canvas App

A modern interactive canvas editor built with Angular. This app allows users to add, move, edit, and customize various shapes on a canvas. It is ideal for quick prototyping, diagramming, or educational demonstrations.

## Features

- **Add Shapes:** Supports adding circles, squares, rectangles, diamonds, triangles, and cylinders.
- **Drag and Move:** Click and drag shapes to reposition them anywhere on the canvas.
- **Edit Text:** Double-click a shape to edit its label or text.
- **Color Picker:** Change the color of any shape using an integrated color picker.
- **Shape Selection:** Select a shape to edit or delete it.
- **Delete Shapes:** Remove selected shapes from the canvas.
- **Save/Export:** Save the current canvas state to local storage or export as JSON.
- **Responsive UI:** Modern, accessible, and responsive interface using Bootstrap for layout and icons.

## How It Works

- The app uses Angular components to separate the canvas, shape, and control logic.
- All shapes are stored in the app's state and rendered via an `*ngFor` loop.
- Each shape type has its own CSS for accurate visual representation.
- Drag-and-drop, editing, and color changes are handled via Angular event bindings and services.
- The canvas state is persisted in local storage, so your work is not lost on reload.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Setup
```bash
npm install
```

### Running the App
```bash
npm start
# or
ng serve
```
Visit [http://localhost:4200](http://localhost:4200) in your browser.

## Usage
1. **Select a shape** from the toolbar (circle, square, rectangle, diamond, triangle, or cylinder).
2. **Click on the canvas** to add the selected shape at the clicked position.
3. **Drag shapes** to move them.
4. **Double-click** a shape to edit its text.
5. **Click the color palette** on a shape to change its color.
6. **Select a shape** and click the delete button to remove it.
7. **Save** your work using the Save button; the state is stored in your browser.

## Extending the App
- To add new shapes, update the shape model, service, component template, and SCSS with the new shape logic and styles.
- The structure is modular and easy to extend.

## Project Structure
- `src/app/components/shape/` — Shape rendering and interaction logic
- `src/app/canvas/` — Canvas container and toolbar
- `src/app/services/` — Canvas state management
- `src/app/models/` — Shape and state interfaces

## License
MIT

---

*This project was bootstrapped with Angular CLI. For advanced Angular usage, see the official [Angular documentation](https://angular.dev/).*
