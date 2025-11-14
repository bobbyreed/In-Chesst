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
    }

    // Render the chess board
    renderBoard() {
        this.boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Add piece if exists
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundImage = this.getPieceImage(piece);
                    cell.appendChild(pieceElement);
                }

                // Highlight selected cell
                if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
                    cell.classList.add('selected');
                }

                // Highlight valid moves
                if (this.validMoves.some(move => move.row === row && move.col === col)) {
                    const targetPiece = this.board[row][col];
                    if (targetPiece && targetPiece.color !== this.currentPlayer) {
                        cell.classList.add('capture-move');
                    } else {
                        cell.classList.add('valid-move');
                    }
                }

                cell.addEventListener('click', () => this.handleCellClick(row, col));
                this.boardElement.appendChild(cell);
            }
        }
    }

    // Get piece image path
    getPieceImage(piece) {
        const pieceFile = `${piece.color}_${piece.type}.png`;
        return `url('import/chess/${this.theme}/${pieceFile}')`;
    }

    // Handle cell click
    handleCellClick(row, col) {
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
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});
