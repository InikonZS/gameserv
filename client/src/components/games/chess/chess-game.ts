import { IChessHistory } from './../../utilities/interfaces';
import Control from '../../utilities/control';
import Timer from '../../timer/timer';
import configFigures, { chessModeConfig, fen } from './config-chess';
import Vector from '../../utilities/vector';

import ChessCell from './chess-cell';
import ChessButton from './chess-button';
import ChessHistoryBlock from './chess-history';
import ChessField from './chess-field';
import ModalDraw from './modal/modal-draw';
import ChessModel from './chess-model';
import chessStyles from './chess-game.module.css';
import { IChessData, IChessStart, IChessStop, IJoinedPlayer } from '../../utilities/interfaces';
import ModalGameOver from './modal/modalGameOver';

class ChessGame extends Control {
  private cells: Array<ChessCell> = [];

  public onCellClick: (coords: Vector) => void = () => {};

  timer: Timer;

  private history: ChessHistoryBlock;

  private playerOne: Control;

  private playerTwo: Control;

  private players: Array<string> = [];

  private isRotated = false;

  private chessBoard: ChessField;

  private btnStart: ChessButton;

  public onStartClick: () => void = () => {};

  private btnDraw: ChessButton;

  public onDrawClick: () => void = () => {};

  private btnLoss: ChessButton;

  public onLossClick: () => void = () => {};

  public onFigureDrop: (posStart: Vector, posDrop: Vector) => void = () => {};

  public onFigureGrab: (pos: Vector) => void = () => {};

  private modalDraw: ModalDraw;

  public onModalDrawClick: (response: string) => void = () => {};

  public onModalLossClick: () => void = () => {};

  private model: ChessModel;

  private host = '';

  private chessMode = '';

  private chessBody: Control;

  private parent: Control;
  private modalPopup: ModalDraw;
  private modalGameOver: ModalGameOver;
  public onGameOverClick: () => void = () => {};

  constructor(
    parentNode: HTMLElement,
    // chessModel: ChessModel,
    chessMode: string,
    parentHeight: number,
    // parent: Control
  ) {
    super(parentNode, 'div', chessStyles.chess_wrapper);
    console.log('chess Mode', chessMode);
    
    // this.parent = parent;
    this.node.classList.add('game_action_size');
    // this.model = chessModel;
    this.chessMode = chessMode;
    const chessControls = new Control(this.node, 'div', chessStyles.chess_controls);
    const chessHead = new Control(this.node, 'div', chessStyles.chess_head);
    this.playerOne = new Control(chessHead.node, 'div', chessStyles.chess_player, 'Player1');
    this.playerOne.node.classList.add(chessStyles.player_active);

    this.timer = new Timer(chessHead.node);

    this.playerTwo = new Control(chessHead.node, 'div', chessStyles.chess_player, 'Player2');
    this.chessBody = new Control(this.node, 'div', chessStyles.chess_body);
    console.log(this.node.getBoundingClientRect().height);
    
    this.history = new ChessHistoryBlock(this.chessBody.node, parentHeight);

    this.chessBoard = new ChessField(this.chessBody.node, configFigures, parentHeight);
    this.initBoard();

    this.btnStart = new ChessButton(chessControls.node, 'Start');
    this.btnStart.buttonDisable();
    this.btnStart.onClick = () => {
      // this.model.chessStartGame(this.host);
      this.btnStart.buttonDisable();
    };
    this.btnDraw = new ChessButton(chessControls.node, 'Draw');
    this.btnDraw.buttonDisable();
    this.btnDraw.onClick = () => {
      // this.model.chessStopGame('draw');
    };
    this.btnLoss = new ChessButton(chessControls.node, 'Loss');
    this.btnLoss.buttonDisable();
    this.btnLoss.onClick = () => {
      // this.model.chessStopGame('loss');
    };

    this.chessBoard.onFigureDrop = (posStart: Vector, posDrop: Vector) => {
      // this.model.chessMove(JSON.stringify([ posStart, posDrop ]));
    };

    this.chessBoard.onFigureGrab = (pos: Vector) => {
      // this.model.chessFigureGrab(JSON.stringify(pos));
    };

    // this.model.onChessMove.add((data) => this.onFigureMove(data));

    // this.model.onStartGame.add((data) => this.createChessField(data));
    // this.model.onStopGame.add((data) => this.createModalDraw(data));
    // this.model.onChessFigureGrab.add((data) => this.showAllowedMoves(data));

    window.onresize = () => {
      const parentHeight = Math.min(
        parentNode.clientWidth,
        parentNode.clientHeight - 140
      );
      this.chessBody.node.style.setProperty('--size', `${parentHeight}px`);
      this.chessBoard.changeHeight(parentHeight);
      this.history.changeHeight(parentHeight);
    };

    window.onresize(null);
  }

  updateGameField(rotate: boolean): void {
    if (this.chessMode === chessModeConfig.oneScreen) {
      if (rotate) {
        if (!this.isRotated) {
          this.chessBoard.node.classList.add('rotate');
        } else {
          this.chessBoard.node.classList.remove('rotate');
        }
        this.isRotated = !this.isRotated;
      }
    }
  }

  clearData() {
    this.players = [];
    this.playerOne.node.textContent = 'Player1';
    this.playerTwo.node.textContent = 'Player2';
    // this.chessBoard.clearData();
    this.chessMode = '';
    this.timer.clear();
    this.initBoard();
    // this.destroy();
  }

  setPlayer(params: IJoinedPlayer): void {
    console.log(params);
    const player1 = params.players[0].login;
    this.playerOne.node.textContent = player1;
    this.players.push(player1);

    if (this.chessMode !== chessModeConfig.network) {
      this.host = player1;
      this.btnStart.buttonEnable();
    } else if (params.players[1]) {
      const player2 = params.players[1].login;
      this.playerTwo.node.textContent = player2;
      this.players.push(player2);
      this.host = params.player !== player1 ? player1 : player2;
      this.btnStart.buttonEnable();
    }
  }

  setHistoryMove(params: IChessHistory): void {
    this.history.setHistoryMove(params);
  }
  
  createModalDraw(data: IChessStop): void {
    console.log(data.player, this.host);

    this.modalPopup = new ModalDraw(this.node, data.stop, data.player, this.players, data.method);
    this.modalPopup.onModalDrawClick = (response: string) => {
      this.onModalDrawClick(response);
    };
  }

  destroyModalDraw(): void {
    this.modalDraw.destroy();
  }

  setFigurePosition(oldFigPos: Vector, newFigPos: Vector): void {
    this.chessBoard.setFigurePosition(oldFigPos, newFigPos);
  }

  showAllowedMoves(coords: Array<Vector>): void {
    this.chessBoard.showAllowedMoves(coords);
  }

  removeAllowedMoves(): void {
    this.chessBoard.removeAlloweMoves();
  }

  onFigureMove(data: IChessData): void {
    this.host = data.player;
    const newField = fromFen(data.field);

    this.setHistoryMove(data.history);
    const oldFigPos = new Vector(data.coords[0].x, data.coords[0].y);
    const newFigPos = new Vector(data.coords[1].x, data.coords[1].y);

    this.setFigurePosition(oldFigPos, newFigPos);
    this.chessBoard.clearData(newField);

    this.updateGameField(data.rotate);
    this.removeAllowedMoves();
    this.chessBoard.showKingCheck(data.king);

    if (this.chessMode === chessModeConfig.network) {
      if (this.playerOne.node.textContent !== data.player) {
        this.playerOne.node.classList.add(chessStyles.player_active);
        this.playerTwo.node.classList.remove(chessStyles.player_active);
      } else {
        this.playerOne.node.classList.remove(chessStyles.player_active);
        this.playerTwo.node.classList.add(chessStyles.player_active);
      }
    }
  }

  startGame(data: IChessStart) {
    this.chessBoard.setChessMode(this.chessMode);
    this.chessBoard.clearData(fromFen(data.field));
    // this.chessBoard.createFieldCells(fromFen(data.field));
    this.chessBoard.setDragable(true);
    this.timer.setTimer(data.time);
    this.btnDraw.buttonEnable();
    this.btnLoss.buttonEnable();
    this.btnStart.buttonDisable();
  }

  getPlayers(): Array<string> {
    return this.players;
  }

  createModalGameOver(params: {method: string, player: string}): void {
    this.modalPopup && this.modalPopup.destroy();
    this.modalGameOver = new ModalGameOver(this.node, params, this.players);
    this.modalGameOver.onGameOverClick = () => {
      this.onGameOverClick();
      this.destroyModalGameOver();
    }
  }

  destroyModalGameOver(): void {
    this.modalGameOver.destroy();
  }

  initBoard(): void {
    this.chessBoard.createFieldCells(fromFen(fen));
  }

}

export default ChessGame;

function fromFen(fen: string): Array<string> {
  const fromFen: Array<string> = [];
  fen.split('/').join('').split('').forEach((el) => {
    if (!Number.isNaN(+el)) {
      for (let i = 0; i < +el; i++) {
        fromFen.push('-');
      }
    } else fromFen.push(el);
  });
  return fromFen.join('').split('').map((item) => (item === '-' ? '' : item));
}
