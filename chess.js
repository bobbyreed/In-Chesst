// AI Strategy Base Class
class AIStrategy {
    constructor(game) {
        this.game = game;
    }

    // Returns the best move for the given color
    // Should return { from: { row, col }, to: { row, col } } or null
    selectMove(color) {
        throw new Error('selectMove must be implemented by subclass');
    }
}

// Random AI Strategy - makes random legal moves
class RandomAI extends AIStrategy {
    selectMove(color) {
        const allMoves = [];

        // Collect all possible moves for this color
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.game.getValidMoves(row, col);
                    for (const move of validMoves) {
                        allMoves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col }
                        });
                    }
                }
            }
        }

        // Return a random move
        if (allMoves.length > 0) {
            return allMoves[Math.floor(Math.random() * allMoves.length)];
        }

        return null;
    }
}

// Chess Game Engine
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedCell = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.theme = 'chess';
        this.capturedPieces = { white: [], black: [] };
        this.gameMode = 'human'; // 'human' or 'computer'
        this.aiStrategy = new RandomAI(this); // Extensible - can swap for different strategies
        this.computerColor = 'black'; // Computer always plays black
        this.currentView = 'normal'; // Track current view mode

        this.initializeUI();
        this.attachEventListeners();
        this.renderBoard();
    }

    // Initialize the chess board with starting position
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Setup black pieces
        board[0] = [
            { type: 'rook', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'queen', color: 'black' },
            { type: 'king', color: 'black' },
            { type: 'bishop', color: 'black' },
            { type: 'knight', color: 'black' },
            { type: 'rook', color: 'black' }
        ];
        board[1] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' }));

        // Setup white pieces
        board[6] = Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' }));
        board[7] = [
            { type: 'rook', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'queen', color: 'white' },
            { type: 'king', color: 'white' },
            { type: 'bishop', color: 'white' },
            { type: 'knight', color: 'white' },
            { type: 'rook', color: 'white' }
        ];

        return board;
    }

    // Initialize UI elements
    initializeUI() {
        this.boardElement = document.getElementById('chess-board');
        this.statusElement = document.getElementById('status-message');
        this.turnElement = document.getElementById('current-turn');
    }

    // Attach event listeners
    attachEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('undo-btn').addEventListener('click', () => this.undoMove());
        document.getElementById('theme').addEventListener('change', (e) => this.changeTheme(e.target.value));
        document.getElementById('game-mode').addEventListener('change', (e) => this.changeGameMode(e.target.value));
        document.getElementById('view').addEventListener('change', (e) => this.changeView(e.target.value));

        // Keyboard event listener for fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    // Initialize vertex grid for mesh distortion (9x9 vertices for 8x8 cells)
    initializeVertexGrid() {
        this.vertexGrid = [];
        const cellSize = 100 / 8; // Percentage-based for responsiveness

        for (let row = 0; row <= 8; row++) {
            this.vertexGrid[row] = [];
            for (let col = 0; col <= 8; col++) {
                this.vertexGrid[row][col] = {
                    x: col * cellSize,
                    y: row * cellSize,
                    originalX: col * cellSize,
                    originalY: row * cellSize
                };
            }
        }
    }

    // Render the chess board using SVG
    renderBoard() {
        this.boardElement.innerHTML = '';

        // Initialize vertex grid if not exists
        if (!this.vertexGrid) {
            this.initializeVertexGrid();
        }

        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';

        // Create cells as SVG polygons
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = this.createSVGCell(row, col);
                svg.appendChild(cell);
            }
        }

        this.boardElement.appendChild(svg);
        this.svgElement = svg;

        // Create piece container (HTML overlay)
        const pieceContainer = document.createElement('div');
        pieceContainer.className = 'piece-container';
        pieceContainer.style.position = 'absolute';
        pieceContainer.style.top = '0';
        pieceContainer.style.left = '0';
        pieceContainer.style.width = '100%';
        pieceContainer.style.height = '100%';
        pieceContainer.style.pointerEvents = 'none';

        // Add pieces
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundImage = this.getPieceImage(piece);
                    pieceElement.dataset.row = row;
                    pieceElement.dataset.col = col;
                    pieceContainer.appendChild(pieceElement);
                }
            }
        }

        this.boardElement.appendChild(pieceContainer);
        this.pieceContainer = pieceContainer;

        // Update piece positions based on current view
        this.updatePiecePositions();

        // Reapply current view after rendering
        if (this.currentView && this.currentView !== 'normal') {
            this.changeView(this.currentView);
        }
    }

    // Create SVG cell polygon
    createSVGCell(row, col) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

        // Get vertices for this cell
        const topLeft = this.vertexGrid[row][col];
        const topRight = this.vertexGrid[row][col + 1];
        const bottomRight = this.vertexGrid[row + 1][col + 1];
        const bottomLeft = this.vertexGrid[row + 1][col];

        const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
        polygon.setAttribute('points', points);

        // Set colors based on checkerboard pattern
        const isLight = (row + col) % 2 === 0;
        polygon.setAttribute('fill', isLight ? '#f0d9b5' : '#b58863');
        polygon.setAttribute('stroke', 'none');

        // Add classes for styling
        polygon.setAttribute('class', `cell ${isLight ? 'light' : 'dark'}`);
        polygon.dataset.row = row;
        polygon.dataset.col = col;

        // Highlight selected cell
        if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
            polygon.setAttribute('fill', '#baca44');
        }

        // Highlight valid moves
        if (this.validMoves.some(move => move.row === row && move.col === col)) {
            const targetPiece = this.board[row][col];
            if (targetPiece && targetPiece.color !== this.currentPlayer) {
                polygon.setAttribute('fill', '#e74c3c');
                polygon.setAttribute('stroke', '#c0392b');
                polygon.setAttribute('stroke-width', '0.5');
            } else {
                polygon.setAttribute('fill', '#7fc97f');
            }
        }

        // Add click handler
        polygon.style.cursor = 'pointer';
        polygon.addEventListener('click', () => this.handleCellClick(row, col));

        return polygon;
    }

    // Update piece positions based on distorted mesh
    updatePiecePositions() {
        if (!this.pieceContainer) return;

        const pieces = this.pieceContainer.children;
        for (let piece of pieces) {
            const row = parseInt(piece.dataset.row);
            const col = parseInt(piece.dataset.col);

            // Calculate center of the cell from its vertices
            const topLeft = this.vertexGrid[row][col];
            const topRight = this.vertexGrid[row][col + 1];
            const bottomRight = this.vertexGrid[row + 1][col + 1];
            const bottomLeft = this.vertexGrid[row + 1][col];

            const centerX = (topLeft.x + topRight.x + bottomRight.x + bottomLeft.x) / 4;
            const centerY = (topLeft.y + topRight.y + bottomRight.y + bottomLeft.y) / 4;

            // Position piece at center
            piece.style.position = 'absolute';
            piece.style.left = `${centerX}%`;
            piece.style.top = `${centerY}%`;
            piece.style.transform = 'translate(-50%, -50%)';
            piece.style.width = '10%';
            piece.style.height = '10%';
        }
    }

    // Get piece image path
    getPieceImage(piece) {
        const pieceFile = `${piece.color}_${piece.type}.png`;
        return `url('import/chess/${this.theme}/${pieceFile}')`;
    }

    // Handle cell click
    handleCellClick(row, col) {
        // Prevent interaction when it's computer's turn
        if (this.gameMode === 'computer' && this.currentPlayer === this.computerColor) {
            return;
        }

        const clickedPiece = this.board[row][col];

        // If a cell is already selected
        if (this.selectedCell) {
            // Check if clicked cell is a valid move
            const validMove = this.validMoves.find(move => move.row === row && move.col === col);

            if (validMove) {
                this.makeMove(this.selectedCell.row, this.selectedCell.col, row, col);
                this.selectedCell = null;
                this.validMoves = [];
            } else if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                // Select a different piece of the same color
                this.selectedCell = { row, col };
                this.validMoves = this.getValidMoves(row, col);
            } else {
                // Deselect
                this.selectedCell = null;
                this.validMoves = [];
            }
        } else {
            // Select a piece if it belongs to current player
            if (clickedPiece && clickedPiece.color === this.currentPlayer) {
                this.selectedCell = { row, col };
                this.validMoves = this.getValidMoves(row, col);
            }
        }

        this.renderBoard();
    }

    // Get valid moves for a piece
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];

        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece.color));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }

        // Filter out moves that would put own king in check
        return moves.filter(move => !this.wouldBeInCheck(row, col, move.row, move.col, piece.color));
    }

    // Pawn movement
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Move forward one square
        if (this.isValidPosition(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });

            // Move forward two squares from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Capture diagonally
        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    // Rook movement
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;

                if (!this.isValidPosition(newRow, newCol)) break;

                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }

        return moves;
    }

    // Knight movement
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    // Bishop movement
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;

                if (!this.isValidPosition(newRow, newCol)) break;

                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }

        return moves;
    }

    // Queen movement (combination of rook and bishop)
    getQueenMoves(row, col, color) {
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }

    // King movement
    getKingMoves(row, col, color) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    // Check if position is valid
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Make a move
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        // Save move to history
        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : null
        });

        // Move the piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = { type: 'queen', color: piece.color };
            this.updateStatus(`${piece.color} pawn promoted to queen!`);
        }

        // Check for check/checkmate
        const opponent = this.currentPlayer === 'white' ? 'black' : 'white';
        if (this.isInCheck(opponent)) {
            if (this.isCheckmate(opponent)) {
                this.updateStatus(`Checkmate! ${this.currentPlayer} wins!`);
                this.renderBoard();
                return; // Game over, don't trigger computer move
            } else {
                this.updateStatus(`${opponent} is in check!`);
            }
        } else {
            this.updateStatus(`${this.currentPlayer} moved ${piece.type}`);
        }

        // Switch players
        this.currentPlayer = opponent;
        this.turnElement.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);

        this.renderBoard();

        // Trigger computer move if it's computer's turn
        if (this.gameMode === 'computer' && this.currentPlayer === this.computerColor) {
            // Add a small delay for better UX
            setTimeout(() => this.makeComputerMove(), 500);
        }
    }

    // Check if a color is in check
    isInCheck(color) {
        // Find the king
        let kingPos = null;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingPos = { row, col };
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false;

        // Check if any opponent piece can attack the king
        const opponent = color === 'white' ? 'black' : 'white';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponent) {
                    const moves = this.getValidMovesWithoutCheckTest(row, col);
                    if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Get valid moves without checking for check (to avoid infinite recursion)
    getValidMovesWithoutCheckTest(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        switch (piece.type) {
            case 'pawn': return this.getPawnMoves(row, col, piece.color);
            case 'rook': return this.getRookMoves(row, col, piece.color);
            case 'knight': return this.getKnightMoves(row, col, piece.color);
            case 'bishop': return this.getBishopMoves(row, col, piece.color);
            case 'queen': return this.getQueenMoves(row, col, piece.color);
            case 'king': return this.getKingMoves(row, col, piece.color);
            default: return [];
        }
    }

    // Check if a move would put own king in check
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        const inCheck = this.isInCheck(color);

        // Undo the move
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = capturedPiece;

        return inCheck;
    }

    // Check if a color is in checkmate
    isCheckmate(color) {
        if (!this.isInCheck(color)) return false;

        // Check if any piece can make a move to get out of check
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.getValidMoves(row, col);
                    if (validMoves.length > 0) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    // Undo last move
    undoMove() {
        if (this.moveHistory.length === 0) {
            this.updateStatus('No moves to undo');
            return;
        }

        const lastMove = this.moveHistory.pop();

        // Restore the board state
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;

        // Switch back to previous player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.turnElement.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);

        this.selectedCell = null;
        this.validMoves = [];
        this.updateStatus('Move undone');
        this.renderBoard();
    }

    // Reset the game
    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedCell = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.turnElement.textContent = 'White';
        this.updateStatus('Game reset. White moves first.');
        this.renderBoard();
    }

    // Change theme
    changeTheme(theme) {
        this.theme = theme;
        this.renderBoard();
    }

    // Change game mode
    changeGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        if (mode === 'computer') {
            this.updateStatus('Game started. You are White, Computer is Black.');
        } else {
            this.updateStatus('Game started. White moves first.');
        }
    }

    // Make computer move
    makeComputerMove() {
        if (this.currentPlayer !== this.computerColor) {
            return;
        }

        const move = this.aiStrategy.selectMove(this.computerColor);
        if (move) {
            this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
        } else {
            this.updateStatus('Computer has no valid moves!');
        }
    }

    // Toggle fullscreen mode
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            document.documentElement.requestFullscreen().then(() => {
                this.updateStatus('Entered fullscreen mode. Press F to exit.');
            }).catch((err) => {
                this.updateStatus(`Error entering fullscreen: ${err.message}`);
            });
        } else {
            // Exit fullscreen
            document.exitFullscreen().then(() => {
                this.updateStatus('Exited fullscreen mode.');
            }).catch((err) => {
                this.updateStatus(`Error exiting fullscreen: ${err.message}`);
            });
        }
    }

    // Update status message
    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    // Get cell corners (for future manipulation)
    getCellCorners(row, col) {
        const cells = this.boardElement.children;
        const cellIndex = row * 8 + col;
        const cell = cells[cellIndex];

        if (!cell) return null;

        const rect = cell.getBoundingClientRect();
        return {
            topLeft: { x: rect.left, y: rect.top },
            topRight: { x: rect.right, y: rect.top },
            bottomLeft: { x: rect.left, y: rect.bottom },
            bottomRight: { x: rect.right, y: rect.bottom },
            center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
            width: rect.width,
            height: rect.height
        };
    }

    // Update cell position (for future manipulation)
    updateCellPosition(row, col, corners) {
        const cells = this.boardElement.children;
        const cellIndex = row * 8 + col;
        const cell = cells[cellIndex];

        if (!cell || !corners) return;

        // This method is prepared for future corner manipulation
        // Currently, it would require CSS transforms or absolute positioning
        // which we'll implement when needed
        console.log(`Cell (${row}, ${col}) corners updated`, corners);
    }

    // Change view mode
    changeView(view) {
        this.currentView = view;

        // Reset all cell transforms first
        this.applyNormalView();

        // Apply the selected view
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
            case 'normal':
            default:
                // Already reset above
                break;
        }

        this.updateStatus(`View changed to: ${view}`);
    }

    // Reset vertices to original positions
    resetVertices() {
        if (!this.vertexGrid) return;

        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                this.vertexGrid[row][col].x = this.vertexGrid[row][col].originalX;
                this.vertexGrid[row][col].y = this.vertexGrid[row][col].originalY;
            }
        }
    }

    // Update SVG polygons based on vertex positions
    updateSVGCells() {
        if (!this.svgElement) return;

        const polygons = this.svgElement.querySelectorAll('polygon');
        polygons.forEach(polygon => {
            const row = parseInt(polygon.dataset.row);
            const col = parseInt(polygon.dataset.col);

            const topLeft = this.vertexGrid[row][col];
            const topRight = this.vertexGrid[row][col + 1];
            const bottomRight = this.vertexGrid[row + 1][col + 1];
            const bottomLeft = this.vertexGrid[row + 1][col];

            const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
            polygon.setAttribute('points', points);
        });

        this.updatePiecePositions();
    }

    // Normal View - Reset all transformations
    applyNormalView() {
        this.resetVertices();
        this.updateSVGCells();
    }

    // Perspective 3D View - Apply 3D perspective transformation
    applyPerspectiveView() {
        this.resetVertices();

        // Apply perspective distortion to vertices
        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                const vertex = this.vertexGrid[row][col];

                // Perspective scaling - rows further back are smaller
                const perspectiveFactor = 1 - (row / 8) * 0.3;
                const centerX = 50;

                // Scale X towards center based on row
                vertex.x = centerX + (vertex.originalX - centerX) * perspectiveFactor;

                // Compress Y for perspective
                vertex.y = vertex.originalY * (0.7 + row / 8 * 0.3);
            }
        }

        this.updateSVGCells();
    }

    // Wave Effect View - Apply wave-like distortion by manipulating vertices
    applyWaveView() {
        this.resetVertices();

        // Distort vertices to create wave effect
        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                const vertex = this.vertexGrid[row][col];

                // Calculate wave displacement
                const waveX = Math.sin((row + col) * Math.PI / 4) * 3;
                const waveY = Math.cos((row - col) * Math.PI / 4) * 3;

                // Apply wave distortion
                vertex.x = vertex.originalX + waveX;
                vertex.y = vertex.originalY + waveY;
            }
        }

        this.updateSVGCells();
    }

    // Dramatic Wave Effect View - Apply extreme wave-like distortion
    applyDramaticWaveView() {
        this.resetVertices();

        // Distort vertices to create dramatic wave effect
        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                const vertex = this.vertexGrid[row][col];

                // Calculate dramatic wave displacement with higher amplitude
                const waveX = Math.sin((row + col) * Math.PI / 3) * 8;
                const waveY = Math.cos((row - col) * Math.PI / 3) * 8;

                // Additional circular wave component
                const centerRow = 4.5;
                const centerCol = 4.5;
                const distFromCenter = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
                const radialWave = Math.sin(distFromCenter * Math.PI / 2) * 4;

                // Apply dramatic wave distortion
                vertex.x = vertex.originalX + waveX + radialWave * Math.cos(Math.atan2(row - centerRow, col - centerCol));
                vertex.y = vertex.originalY + waveY + radialWave * Math.sin(Math.atan2(row - centerRow, col - centerCol));
            }
        }

        this.updateSVGCells();
    }

    // Multiple Waves Effect View - Apply multiple overlapping wave patterns
    applyMultiWaveView() {
        this.resetVertices();

        // Distort vertices with multiple overlapping wave patterns
        for (let row = 0; row <= 8; row++) {
            for (let col = 0; col <= 8; col++) {
                const vertex = this.vertexGrid[row][col];

                // Multiple wave patterns
                const wave1X = Math.sin((row + col) * Math.PI / 4) * 5;
                const wave1Y = Math.cos((row + col) * Math.PI / 4) * 5;

                const wave2X = Math.sin((row - col) * Math.PI / 3) * 4;
                const wave2Y = Math.cos((row - col) * Math.PI / 3) * 4;

                const wave3X = Math.sin(row * Math.PI / 2) * 3;
                const wave3Y = Math.cos(col * Math.PI / 2) * 3;

                // Circular ripple from center
                const centerRow = 4.5;
                const centerCol = 4.5;
                const distFromCenter = Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
                const ripple = Math.sin(distFromCenter * Math.PI / 1.5) * 3;
                const angle = Math.atan2(row - centerRow, col - centerCol);

                // Combine all waves
                vertex.x = vertex.originalX + wave1X + wave2X + wave3X + ripple * Math.cos(angle);
                vertex.y = vertex.originalY + wave1Y + wave2Y + wave3Y + ripple * Math.sin(angle);
            }
        }

        this.updateSVGCells();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});
