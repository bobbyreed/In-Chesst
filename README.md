# In-Chesst

A fully functional chess game built with vanilla JavaScript, HTML5, and CSS3. Features complete chess rule implementation, multiple visual themes, and prepared infrastructure for advanced cell corner manipulation.

## Features

- **Complete Chess Rules**: All standard chess piece movements, including special moves like pawn promotion
- **Check & Checkmate Detection**: Automatic detection of check and checkmate states
- **Move Validation**: Prevents illegal moves and moves that would put your own king in check
- **Turn-Based Gameplay**: Alternating turns between white and black players
- **Visual Themes**: Three color schemes (Classic, Green, Pink)
- **Move History**: Full undo functionality to take back moves
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Feedback**: Highlighted valid moves, capture indicators, and selected piece highlighting

## Getting Started

### Playing the Game

1. Open `index.html` in a web browser
2. Click on a piece to select it (highlighted squares show valid moves)
3. Click on a highlighted square to move the piece
   - Green dots indicate valid empty squares
   - Red rings indicate capture moves
4. Use the theme selector to switch between visual styles
5. Use "Undo Move" to take back your last move
6. Use "Reset Game" to start a new game

## Project Structure

```
In-Chesst/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and layout
├── chess.js            # Chess game engine and logic
├── import/
│   └── chess/          # Chess piece sprites
│       ├── chess/      # Classic theme
│       ├── chess_green/# Green theme
│       └── chess_pink/ # Pink theme
└── README.md           # This file
```

## Code Architecture

### ChessGame Class (chess.js)

The main game engine is contained in the `ChessGame` class with the following key components:

#### Core Properties
- `board`: 8x8 array representing the chess board state
- `currentPlayer`: Tracks whose turn it is ('white' or 'black')
- `selectedCell`: Currently selected piece position
- `validMoves`: Array of valid moves for the selected piece
- `moveHistory`: Stack of all moves for undo functionality

#### Key Methods

**Board Initialization**
- `initializeBoard()`: Sets up the starting chess position

**Rendering**
- `renderBoard()`: Updates the visual display of the board
- `getPieceImage(piece)`: Returns the sprite path for a given piece

**Move Logic**
- `getValidMoves(row, col)`: Returns all legal moves for a piece
- `getPawnMoves()`, `getRookMoves()`, `getKnightMoves()`, `getBishopMoves()`, `getQueenMoves()`, `getKingMoves()`: Individual piece movement rules
- `makeMove(fromRow, fromCol, toRow, toCol)`: Executes a move on the board

**Game State**
- `isInCheck(color)`: Checks if a player's king is in check
- `isCheckmate(color)`: Checks if a player is in checkmate
- `wouldBeInCheck()`: Validates that a move won't put own king in check

**User Interaction**
- `handleCellClick(row, col)`: Processes clicks on board cells
- `undoMove()`: Reverts the last move
- `resetGame()`: Starts a new game
- `changeTheme(theme)`: Switches visual theme

## Cell Corner Manipulation (Future Development)

The codebase includes infrastructure for manipulating the position of each corner of each chess board cell. This is prepared for advanced visual effects and transformations.

### Available Methods

#### `getCellCorners(row, col)`

Returns the position data for all corners of a specified cell.

**Parameters:**
- `row` (number): The row index (0-7)
- `col` (number): The column index (0-7)

**Returns:**
```javascript
{
    topLeft: { x: Number, y: Number },
    topRight: { x: Number, y: Number },
    bottomLeft: { x: Number, y: Number },
    bottomRight: { x: Number, y: Number },
    center: { x: Number, y: Number },
    width: Number,
    height: Number
}
```

**Example Usage:**
```javascript
const corners = window.chessGame.getCellCorners(0, 0);
console.log('Top left corner:', corners.topLeft);
console.log('Cell dimensions:', corners.width, 'x', corners.height);
```

#### `updateCellPosition(row, col, corners)`

Prepared method for updating cell corner positions. Currently logs the update but can be extended for actual transformations.

**Parameters:**
- `row` (number): The row index (0-7)
- `col` (number): The column index (0-7)
- `corners` (object): New corner positions in the format returned by `getCellCorners()`

**Example Usage:**
```javascript
const corners = window.chessGame.getCellCorners(0, 0);

// Modify corner positions
corners.topLeft.x += 10;
corners.topLeft.y += 5;

// Update the cell
window.chessGame.updateCellPosition(0, 0, corners);
```

### Implementation Guide for Corner Manipulation

To implement corner manipulation functionality:

1. **Access the ChessGame Instance**
   ```javascript
   const game = window.chessGame;
   ```

2. **Get Current Corner Positions**
   ```javascript
   const corners = game.getCellCorners(row, col);
   ```

3. **Modify Corner Positions**
   - Adjust the `x` and `y` values of any corner (topLeft, topRight, bottomLeft, bottomRight)
   - You can create various effects:
     - Perspective transformations
     - Skewing
     - Rotation
     - 3D effects

4. **Apply Transformations**
   - Extend the `updateCellPosition()` method in chess.js
   - Use CSS transforms (matrix, matrix3d, perspective)
   - Or use SVG/Canvas for more complex distortions

5. **Example: Skew Effect**
   ```javascript
   function skewCell(row, col, xSkew, ySkew) {
       const cells = document.getElementById('chess-board').children;
       const cellIndex = row * 8 + col;
       const cell = cells[cellIndex];

       cell.style.transform = `skew(${xSkew}deg, ${ySkew}deg)`;
   }
   ```

6. **Example: Perspective Transform**
   ```javascript
   function applyPerspective(row, col, cornerOffsets) {
       const game = window.chessGame;
       const corners = game.getCellCorners(row, col);

       // Apply offsets to each corner
       const newTopLeft = {
           x: corners.topLeft.x + cornerOffsets.topLeft.x,
           y: corners.topLeft.y + cornerOffsets.topLeft.y
       };
       // ... repeat for other corners

       // Use CSS clip-path or canvas to render distorted quad
       // Implementation depends on desired visual effect
   }
   ```

### Suggested Approaches

**CSS Transforms (Easiest)**
- Use `transform: matrix()` or `transform: matrix3d()`
- Good for simple skewing and rotation
- Limited to affine transformations

**CSS clip-path (Moderate)**
- Use `clip-path: polygon()` to define custom shapes
- Can create irregular quadrilaterals
- Limited browser support for animations

**SVG Filters (Advanced)**
- Use SVG `<filter>` with `<feDisplacementMap>`
- Allows complex distortions
- Can be animated

**Canvas API (Most Flexible)**
- Draw the chess board on a `<canvas>` element
- Use `drawImage()` with perspective transforms
- Full control over rendering
- Requires more code refactoring

### Data Structure for Corner Manipulation

When implementing corner manipulation, consider storing the transformation state:

```javascript
// Example data structure for tracking cell transformations
const cellTransformations = {
    '0,0': {
        corners: {
            topLeft: { x: 0, y: 0 },
            topRight: { x: 70, y: 5 },
            bottomLeft: { x: 0, y: 70 },
            bottomRight: { x: 70, y: 70 }
        },
        transform: 'matrix(1, 0.1, 0, 1, 0, 0)'
    },
    // ... other cells
};
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch events

## Credits

Chess piece sprites sourced from the assets in `import/chess/`. See `docs/credits.md` for attribution.

## License

See `import/chess/License.txt` for sprite licensing information.

## Future Enhancements

- [ ] En passant capture
- [ ] Castling
- [ ] Stalemate detection
- [ ] Move timer/clock
- [ ] AI opponent
- [ ] Move notation (PGN)
- [ ] Board corner manipulation effects
- [ ] 3D perspective view
- [ ] Move animations
- [ ] Sound effects

## Development

The game is built with pure vanilla JavaScript - no frameworks or build tools required. Simply edit the files and refresh the browser to see changes.

**Global Access:**
The game instance is available globally as `window.chessGame` for debugging and experimentation in the browser console.

**Console Commands:**
```javascript
// Access the game
const game = window.chessGame;

// Get cell corners
game.getCellCorners(0, 0);

// Check board state
console.log(game.board);

// Check current player
console.log(game.currentPlayer);

// Get move history
console.log(game.moveHistory);
```

---

Built with vanilla JavaScript, HTML5, and CSS3.
