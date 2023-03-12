import { CellCoord } from './cell-coord';
import { ChessColor } from './chess-color';
import { COMMON } from './common';
import { Field } from './field';
import { Pawn } from './figures/pawn';
import { ICellCoord } from './icell-coord';
import { IField } from './ifield';
import { IMove } from './imove';
import { IPosition } from './iPosition';
import { IVector } from './ivector';

export class Move implements IMove {
  readonly startCell: ICellCoord;
  readonly vector: IVector;
  constructor(startCell: ICellCoord, vector: IVector) {
    this.startCell = startCell;
    this.vector = vector;
  }
  getTargetCell(): ICellCoord {
    return this.vector.resultPosition(this.startCell);
  }
  getNotation(field: IField): string {
    // TODO: добавить проверку на взятие фигуры
    // TODO: добавить рокировку
    // TODO: добавить взятие пешки на проходе
    // TODO: добавить правило 50 ходов
    // TODO: добавить шах/мат

    if (this.isValid(field)) {
      return `${field.getFigure(this.startCell)?.toString()}${this.startCell.toString()}—${this.getTargetCell().toString()}`;
    } else return 'Illegal Move';
  }
  isValid(field: IField): boolean {
    let result = false;
    if (!field.isFreeCell(this.startCell)) {
      const fieldFigure = field.getFigure(this.startCell);
      if (field.playerColor === fieldFigure?.color) {
        const fieldMoves = field.getAllowedMoves(this.startCell);
        const legalDestinations = new Set<String>();
        for (let fieldMove of fieldMoves) {
          legalDestinations.add(fieldMove.getTargetCell().toString());
        }
        result = legalDestinations.has(this.getTargetCell().toString());
      }
    }
    return result;
  }
  protected updateCastlingFlags(castlingFlags: number, startCellString: string, targetCellString: string): number {
    if (startCellString == 'a1' || targetCellString == 'a1') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.LONG_WHITE_CASTLING);
    }
    if (startCellString == 'h1' || targetCellString == 'h1') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.SHORT_WHITE_CASTLING);
    }
    if (startCellString == 'e1' || targetCellString == 'e1') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.LONG_WHITE_CASTLING ^ COMMON.SHORT_WHITE_CASTLING);
    }
    if (startCellString == 'a8' || targetCellString == 'a8') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.LONG_BLACK_CASTLING);
    }
    if (startCellString == 'h8' || targetCellString == 'h8') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.SHORT_BLACK_CASTLING);
    }
    if (startCellString == 'e8' || targetCellString == 'e8') {
      castlingFlags = castlingFlags & (COMMON.ALL_CASTLING ^ COMMON.LONG_BLACK_CASTLING ^ COMMON.SHORT_BLACK_CASTLING);
    }
    return castlingFlags;
  }
  makeMove(field: IField, changePlayer = true): IField {
    const resultPosition: IPosition = field.getPosition();
    const targetCell = this.getTargetCell();
    let figure = field.getFigure(this.startCell);
    if (figure) {
      if (!field.isFreeCell(targetCell)) {
        resultPosition.deleteFigure(targetCell);
      }
      if (field.pawnTresspassing !== null && figure.toString().toLowerCase() == new Pawn(ChessColor.black).toString() && field.pawnTresspassing.equal(targetCell)) {
        resultPosition.deleteFigure(new CellCoord(targetCell.x, targetCell.y + (field.playerColor == ChessColor.white ? 1 : -1)));
      }
      if (  figure instanceof Pawn && 
            ((figure.color == ChessColor.white && targetCell.y == 0) ||
            (figure.color == ChessColor.black && targetCell.y == COMMON.BOARD_SIZE - 1))) {
              const pawnTransform = (figure.color == ChessColor.white) ? 'Q' : 'q';
              figure = COMMON.FIGURE_FROM_CHAR.get(pawnTransform);
            }
      resultPosition.addFigure(targetCell, figure);
      resultPosition.deleteFigure(this.startCell);
      let pawnTresspassing: ICellCoord | null = null;
      if (figure.toString().toLowerCase() == new Pawn(ChessColor.black).toString() && Math.abs(this.vector.y) == 2) {
        pawnTresspassing = new CellCoord(this.startCell.x, this.startCell.y + Math.round(this.vector.y / 2));
      }

      return new Field( resultPosition,
                        changePlayer ?
                          (field.playerColor == ChessColor.white ? ChessColor.black : ChessColor.white)
                          : field.playerColor,
                        this.updateCastlingFlags(field.castlingFlags, this.startCell.toString(), targetCell.toString()),
                        pawnTresspassing,
                        ( figure.toString().toLowerCase() == new Pawn(ChessColor.black).toString() ||
                          resultPosition.getFiguresCount() < field.getFiguresCount()) ? 0 : field.fiftyRuleCount + 1,
                        field.moveNumber + (field.playerColor == ChessColor.black ? 1 : 0));
    } else {
      throw new Error('Error in Move.makeMove: empty start cell');
    }
  }
  toString(): string {
    return this.startCell.toString() + '-' + this.vector.resultPosition(this.startCell).toString();
  }
}
