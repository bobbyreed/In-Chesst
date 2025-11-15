# In-Chesst
A fully functional chess game built with vanilla JavaScript, HTML5, SVG, and CSS3. Features complete chess rule implementation, multiple visual themes, and an SVG-based mesh distortion system for seamless board transformations.

## But, Why?
So, I got this email from Claude, right? It was like here is $250 in credit to use the browser based Claude code, *but* you only have 4 days to use it. So, I'm building random things. This is one of them.

## Features

- **Complete Chess Rules**: All standard chess piece movements, including special moves like pawn promotion
- **Check & Checkmate Detection**: Automatic detection of check and checkmate states
- **Move Validation**: Prevents illegal moves and moves that would put your own king in check
- **Turn-Based Gameplay**: Alternating turns between white and black players
- **Visual Themes**: Three color schemes (Classic, Green, Pink)
- **Move History**: Full undo functionality to take back moves
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Feedback**: Highlighted valid moves, capture indicators, and selected piece highlighting
- **SVG Mesh Distortion**: Seamless board transformations using vertex manipulation
- **Multiple View Modes**: Normal, Perspective, Wave, Dramatic Wave, and Multi-Wave effects
- **Fullscreen Mode**: Press 'F' to toggle fullscreen

## Getting Started

### Playing the Game

1. Open `index.html` in a web browser
2. Click on a piece to select it (highlighted squares show valid moves)
3. Click on a highlighted square to move the piece
   - Green squares indicate valid empty squares
   - Red squares with borders indicate capture moves
4. Use the view selector to switch between distortion effects
5. Use the theme selector to switch between visual styles
6. Use "Undo Move" to take back your last move
7. Use "Reset Game" to start a new game
8. Press 'F' to toggle fullscreen mode

## Project Structure

```
In-Chesst/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and layout
├── chess.js            # Chess game engine and SVG mesh distortion system
├── import/
│   └── chess/          # Chess piece sprites
│       ├── chess/      # Classic theme
│       ├── chess_green/# Green theme
│       └── chess_pink/ # Pink theme
└── README.md           # This file
```

## Architecture Overview

### SVG Mesh Distortion System

The chess board is rendered using an SVG-based mesh distortion system where cells share vertices at their edges. This ensures that when the board is distorted, edges remain perfectly connected and create smooth curves with no gaps or separation.

#### Key Concepts

1. **Vertex Grid (9×9)**: A 9×9 grid of vertices defines the corners of all 8×8 cells
2. **Shared Edges**: Adjacent cells share vertices, ensuring edges stay connected
3. **SVG Polygons**: Each cell is rendered as an SVG polygon defined by 4 vertices
4. **Vertex Manipulation**: Distortions are applied by moving vertices, not individual cells

#### Architecture Components

```
┌─────────┬─────────┐
│ Cell 0,0│ Cell 0,1│  Each cell is a polygon with 4 vertices
├─────────┼─────────┤  Adjacent cells share vertices at edges
│ Cell 1,0│ Cell 1,1│  9×9 vertices define 8×8 cells
└─────────┴─────────┘
```

### ChessGame Class (chess.js)

#### Core Properties
- `board`: 8×8 array representing the chess board state
- `currentPlayer`: Tracks whose turn it is ('white' or 'black')
- `selectedCell`: Currently selected piece position
- `validMoves`: Array of valid moves for the selected piece
- `moveHistory`: Stack of all moves for undo functionality
- `vertexGrid`: 9×9 array of vertices for mesh distortion
- `svgElement`: Reference to the SVG element containing the board
- `pieceContainer`: HTML overlay containing piece images
- `currentView`: The currently active view mode

#### Mesh Distortion Methods

**Vertex Grid Management**
- `initializeVertexGrid()`: Creates the 9×9 vertex grid with original positions
- `resetVertices()`: Resets all vertices to their original positions
- `updateSVGCells()`: Updates SVG polygons based on vertex positions
- `updatePiecePositions()`: Repositions pieces based on distorted cell centers

**Rendering**
- `renderBoard()`: Renders the board as SVG polygons with piece overlay
- `createSVGCell(row, col)`: Creates an SVG polygon for a specific cell

**View Transformations**
- `applyNormalView()`: Resets to standard grid layout
- `applyPerspectiveView()`: Applies vanishing point perspective
- `applyWaveView()`: Applies wave-like distortion
- `applyDramaticWaveView()`: Applies extreme wave distortion with radial effects
- `applyMultiWaveView()`: Applies multiple overlapping wave patterns

## Creating Custom View Transforms

This section is a developer guide for creating new board distortion effects.

### Understanding the Vertex Grid

The vertex grid is a 9×9 array where each vertex has:

```javascript
{
    x: Number,           // Current X position (percentage, 0-100)
    y: Number,           // Current Y position (percentage, 0-100)
    originalX: Number,   // Original X position (percentage, 0-100)
    originalY: Number    // Original Y position (percentage, 0-100)
}
```

**Important:** Coordinates are in percentage units (0-100) for responsiveness.

### Step-by-Step: Creating a New View Transform

#### 1. Add View Option to HTML

Edit `index.html` to add your new view option:

```html
<select id="view">
    <option value="normal">Normal</option>
    <option value="perspective">Perspective 3D</option>
    <option value="wave">Wave Effect</option>
    <option value="dramatic-wave">Dramatic Wave</option>
    <option value="multi-wave">Multiple Waves</option>
    <option value="your-view">Your Custom View</option> <!-- Add this -->
</select>
```

#### 2. Add Case to changeView() Method

In `chess.js`, add a case in the `changeView()` method:

```javascript
changeView(view) {
    this.currentView = view;
    this.applyNormalView();

    switch(view) {
        case 'perspective':
            this.applyPerspectiveView();
            break;
        case 'wave':
            this.applyWaveView();
            break;
        case 'dramatic-wave':
            this.applyDramaticWaveView();
            break;
        case 'multi-wave':
            this.applyMultiWaveView();
            break;
        case 'your-view':              // Add this case
            this.applyYourView();      // Add this
            break;                      // Add this
        case 'normal':
        default:
            break;
    }

    this.updateStatus(`View changed to: ${view}`);
}
```

#### 3. Implement Your Transform Method

Create a new method that manipulates vertices:

```javascript
applyYourView() {
    this.resetVertices();  // Always start by resetting vertices

    // Loop through all vertices
    for (let row = 0; row <= 8; row++) {
        for (let col = 0; col <= 8; col++) {
            const vertex = this.vertexGrid[row][col];

            // Calculate distortion for this vertex
            const offsetX = /* your X displacement calculation */;
            const offsetY = /* your Y displacement calculation */;

            // Apply distortion
            vertex.x = vertex.originalX + offsetX;
            vertex.y = vertex.originalY + offsetY;
        }
    }

    this.updateSVGCells();  // Always end by updating the SVG
}
```

### Example Transforms

#### Example 1: Simple Ripple Effect

```javascript
applyRippleView() {
    this.resetVertices();

    const centerRow = 4.5;  // Center of 9×9 grid
    const centerCol = 4.5;

    for (let row = 0; row <= 8; row++) {
        for (let col = 0; col <= 8; col++) {
            const vertex = this.vertexGrid[row][col];

            // Calculate distance from center
            const dx = col - centerCol;
            const dy = row - centerRow;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Create ripple based on distance
            const ripple = Math.sin(distance * Math.PI / 2) * 5;

            // Apply ripple displacement
            const angle = Math.atan2(dy, dx);
            vertex.x = vertex.originalX + ripple * Math.cos(angle);
            vertex.y = vertex.originalY + ripple * Math.sin(angle);
        }
    }

    this.updateSVGCells();
}
```

#### Example 2: Barrel Distortion

```javascript
applyBarrelView() {
    this.resetVertices();

    const centerRow = 4.5;
    const centerCol = 4.5;
    const strength = 0.3;  // Distortion strength

    for (let row = 0; row <= 8; row++) {
        for (let col = 0; col <= 8; col++) {
            const vertex = this.vertexGrid[row][col];

            // Calculate normalized position from center (-1 to 1)
            const normX = (col - centerCol) / centerCol;
            const normY = (row - centerRow) / centerRow;

            // Calculate distance from center
            const distance = Math.sqrt(normX * normX + normY * normY);

            // Apply barrel distortion
            const distortionFactor = 1 + strength * distance * distance;

            // Calculate new position
            const newX = centerCol + normX * centerCol * distortionFactor;
            const newY = centerRow + normY * centerRow * distortionFactor;

            vertex.x = newX * (100 / 8);  // Convert to percentage
            vertex.y = newY * (100 / 8);
        }
    }

    this.updateSVGCells();
}
```

#### Example 3: Twist Effect

```javascript
applyTwistView() {
    this.resetVertices();

    const centerRow = 4.5;
    const centerCol = 4.5;

    for (let row = 0; row <= 8; row++) {
        for (let col = 0; col <= 8; col++) {
            const vertex = this.vertexGrid[row][col];

            // Calculate distance from center
            const dx = col - centerCol;
            const dy = row - centerRow;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate rotation based on distance
            const angle = Math.atan2(dy, dx);
            const rotation = distance * 0.3;  // Rotation increases with distance

            // Apply rotation
            const newAngle = angle + rotation;
            const newX = centerCol + distance * Math.cos(newAngle);
            const newY = centerRow + distance * Math.sin(newAngle);

            vertex.x = newX * (100 / 8);  // Convert to percentage
            vertex.y = newY * (100 / 8);
        }
    }

    this.updateSVGCells();
}
```

#### Example 4: Cylindrical Projection

```javascript
applyCylindricalView() {
    this.resetVertices();

    const radius = 15;  // Cylinder radius

    for (let row = 0; row <= 8; row++) {
        for (let col = 0; col <= 8; col++) {
            const vertex = this.vertexGrid[row][col];

            // Map column to angle
            const angle = (col / 8 - 0.5) * Math.PI;

            // Project onto cylinder
            const x = 50 + radius * Math.sin(angle);  // Wrap around
            const z = radius * (1 - Math.cos(angle)); // Depth

            // Apply perspective based on depth
            const scale = 1 / (1 + z / 100);

            vertex.x = x;
            vertex.y = 50 + (vertex.originalY - 50) * scale;  // Scale Y by depth
        }
    }

    this.updateSVGCells();
}
```

### Mathematical Functions Reference

Useful functions for creating distortions:

```javascript
// Sine wave: Creates smooth oscillation
Math.sin(value * Math.PI / wavelength) * amplitude

// Cosine wave: Sine shifted by 90°
Math.cos(value * Math.PI / wavelength) * amplitude

// Distance from point: Radial effects
Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

// Angle to point: Directional effects
Math.atan2(y2 - y1, x2 - x1)

// Damping: Reduce effect with distance
effect / (1 + distance * dampingFactor)

// Easing: Non-linear interpolation
Math.pow(value, power)  // Exponential
Math.sqrt(value)        // Square root
```

### Tips for Great Transforms

1. **Always reset vertices first**: Call `this.resetVertices()` at the start
2. **Always update SVG at the end**: Call `this.updateSVGCells()` at the end
3. **Use percentage coordinates**: Vertex positions are 0-100, not pixels
4. **Keep displacement reasonable**: Large displacements (>15-20) can be chaotic
5. **Center is at (4.5, 4.5)**: The middle of the 9×9 vertex grid
6. **Test edge vertices**: Make sure corners (0,0), (8,8), etc. look good
7. **Combine multiple effects**: Layer sine waves, radial effects, etc.
8. **Consider symmetry**: Symmetric patterns often look cleaner
9. **Use smooth functions**: Sine/cosine create smoother curves than linear
10. **Preserve general shape**: Keep the board recognizable

### Debugging Transforms

Access the game instance in the browser console:

```javascript
// Get the game instance
const game = window.chessGame;

// Inspect vertex grid
console.log(game.vertexGrid);

// Get specific vertex
console.log(game.vertexGrid[4][4]);  // Center vertex

// Test your transform
game.applyYourView();

// Reset to normal
game.applyNormalView();

// Check current view
console.log(game.currentView);
```

### Performance Considerations

- Vertex updates are lightweight (9×9 = 81 vertices)
- SVG polygons update automatically when points change
- Piece positions recalculate based on cell centers
- No performance issues with real-time updates or animations

### Animating Transforms

To animate a transform, use `requestAnimationFrame`:

```javascript
applyAnimatedWave() {
    let time = 0;

    const animate = () => {
        this.resetVertices();

        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                const vertex = this.vertexGrid[row][col];

                // Animated wave using time parameter
                const waveX = Math.sin((row + col + time) * Math.PI / 4) * 3;
                const waveY = Math.cos((row - col + time) * Math.PI / 4) * 3;

                vertex.x = vertex.originalX + waveX;
                vertex.y = vertex.originalY + waveY;
            }
        }

        this.updateSVGCells();

        time += 0.1;
        requestAnimationFrame(animate);
    };

    animate();
}
```

**Note:** Remember to stop the animation when switching views!

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- Mobile browsers: Full support with touch events

## Credits

Chess piece sprites sourced from the assets in `import/chess/`. See `docs/credits.md` for attribution.

## License

See `import/chess/License.txt` for sprite licensing information.

## Development

The game is built with pure vanilla JavaScript - no frameworks or build tools required. Simply edit the files and refresh the browser to see changes.

**Global Access:**
The game instance is available globally as `window.chessGame` for debugging and experimentation in the browser console.

**Console Commands:**
```javascript
// Access the game
const game = window.chessGame;

// Inspect vertex grid
console.log(game.vertexGrid);

// Check board state
console.log(game.board);

// Check current player
console.log(game.currentPlayer);

// Get move history
console.log(game.moveHistory);

// Change views programmatically
game.changeView('wave');
game.changeView('dramatic-wave');
game.changeView('normal');
```

---

Built with vanilla JavaScript, HTML5, SVG, and CSS3.
