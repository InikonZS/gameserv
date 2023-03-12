import { CastlingType } from './castling-type'
import { ChessColor } from './chess-color';
import { COMMON } from './common';
import { Field } from './field';
import { ICastlingData } from './icastling-data';
import { IField } from './ifield';
import { IPosition } from './iPosition';
import { Move } from './move'

export class CastlingMove extends Move {
  // readonly startCell: ICellCoord;
  // readonly vector: IVector;
  readonly castlingType: CastlingType;
  private readonly castlingData: ICastlingData;

  constructor(castlingType: CastlingType) {
    super(COMMON.CASTLING_DATA.get(castlingType).kingStart, COMMON.CASTLING_DATA.get(castlingType).kingVector);
    this.castlingType = castlingType;
    this.castlingData = COMMON.CASTLING_DATA.get(castlingType);
  }

  
  getNotation(field: IField): string {
    if (this.isValid(field)) {
      return this.castlingData.notation;
    } else return 'Illegal Move';
  }
  
  isValid(field: IField, checkDanger = true): boolean {
    if ((field.castlingFlags & this.castlingData.flag) == 0) {
      return false;
    }
    if (field.playerColor !== this.castlingData.color) {
      return false;
    }
    for (let freeCell of this.castlingData.freeCells) {
      if (!field.isFreeCell(freeCell)) {
        return false;
      }
    }
    if(checkDanger && field.isCheck()) {
      return false;
    }
    for (let notCheckSell of this.castlingData.notCheckCells) {
      const notCheckSellResult = new Move(this.castlingData.kingStart, notCheckSell).makeMove(field, false);
      if (checkDanger && notCheckSellResult.isCheck()) {
        return false;
      }
    }
    // TODO: стоит добавить проверку, на месте ли король и ладья. Но пока предполагаем, что FEN корректный.
    return true;
  }
  
  makeMove(field: IField, changePlayer = true): IField {
    if(this.isValid(field)) {
      const resultPosition: IPosition = field.getPosition();
      const targetKingCell = this.castlingData.kingVector.resultPosition(this.castlingData.kingStart);
      const kingFigure = field.getFigure(this.castlingData.kingStart);
      const targetRookCell = this.castlingData.rookVector.resultPosition(this.castlingData.rookStart);
      const rookFigure = field.getFigure(this.castlingData.rookStart);
      resultPosition.addFigure(targetKingCell, kingFigure);
      resultPosition.addFigure(targetRookCell, rookFigure);
      resultPosition.deleteFigure(this.castlingData.kingStart);
      resultPosition.deleteFigure(this.castlingData.rookStart);
      return new Field( resultPosition,
                        changePlayer ?
                          (field.playerColor == ChessColor.white ? ChessColor.black : ChessColor.white)
                          : field.playerColor,
                        this.updateCastlingFlags(field.castlingFlags, this.startCell.toString(), targetKingCell.toString()),
                        null,
                        field.fiftyRuleCount + 1,
                        field.moveNumber + (field.playerColor == ChessColor.black ? 1 : 0));
    } else {
      return field;
    }
  }
}