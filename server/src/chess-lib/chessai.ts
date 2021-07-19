import { ChessColor } from "./chess-color";
import { IChessAI } from "./ichessai";
import { IField } from "./ifield";
import { IMove } from "./imove";

export class ChessAI implements IChessAI {
  static DEFAULT_METHOD = 'random';
  static MONTE_CARLO_DEPTH = 10;
  static MONTE_CARLO_ATTEMPTS = 20;
  getRecommendMove(field: IField, method?: string): IMove | null {
    if(!method) {
      method = 'random';
    }
    switch (method) {
      case 'random':
        return this.random(field);
      case 'monte-carlo':
        return this.monteCarlo(field);
      default:
        throw new Error('ChessAI.getRecommendMove(): incorrect method');
    }
  }
  random(field: IField): IMove | null {
    const moves = Array.from(field.getAllAllowedMoves());
    if (moves.length == 0) {
      return null;
    } else {
      const index = Math.floor(Math.random() * moves.length)
      return moves[index];
    }
  }
  monteCarlo(field: IField): IMove | null {
    const moves = Array.from(field.getAllAllowedMoves());
    if (moves.length == 0) {
      return null;
    } else {
      let weightMoves = new Array<{cost: number, move: IMove}>();
      moves.forEach(move => {
        let moveCost = 0;
        for(let i = 0; i < ChessAI.MONTE_CARLO_ATTEMPTS; i++) {
          moveCost += this.monteCarloHelper(field, ChessAI.MONTE_CARLO_DEPTH);
        }
        console.log(moveCost, move.toString())
        moveCost /= ChessAI.MONTE_CARLO_ATTEMPTS;
        weightMoves.push({cost: moveCost, move: move})
      });
      // console.log('!!!!!', weightMoves);
      const weights = weightMoves.map(wMove => wMove.cost);
      const weight = field.playerColor == ChessColor.white ? Math.max(...weights) : Math.min(...weights);
      weightMoves = weightMoves.filter(move => move.cost == weight);
      // console.log('!!!!!', weightMoves);
      const index = Math.floor(Math.random() * weightMoves.length)
      return weightMoves[index].move;
    }
  }
  monteCarloHelper(field: IField, depth: number): number {
    if (depth <= 0) {
      return field.cost;
    }
    const move = this.random(field);
    if (move === null) {
      return (field.cost);
    } else {
      return this.monteCarloHelper(move.makeMove(field), depth - 1);
    }
  }
}