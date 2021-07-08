import { ChatChannel } from '../socketChannel';
import Vector from '../../utils/vector';

interface IChatResponse {
  type: string;
}

export class ChannelJoinPlayerResponse {
  public type: string;
  public service: string;
  public requestId: number;
  public params: {
    status: string;
  };

  constructor(status: string, requestId: number) {
    this.service = 'chat';
    this.type = 'joined';
    this.requestId = requestId;
    this.params = { status };
  }
}

class ChannelSendPlayersResponse implements IChatResponse {
  public type: string;
  public service: string;
  public params: {
    player: string;
    players: Array<{login:string, avatar: string}>;
  };

  constructor(player: string, players: Array<{login:string, avatar: string}>) {
    (this.service = 'chat'), (this.type = 'getPlayers');
    this.params = { player, players };
  }
}

class CrossStartResponse {
  public type: string;
  public service: string;
  time: number;
  public params: {
    time: number;
  };

  constructor() {
    (this.service = 'chat'), (this.type = 'crossStart');
    this.params = { time: Date.now() };
  }
}

class CrossMoveResponse {
  public type: string;
  public service: string;

  public params: {
    coords: Vector;
    player: string;
    field: Array<Array<string>>;
    winner: string;
    sign: string;
  };

  constructor(
    coords: Vector,
    player: string,
    field: Array<Array<string>>,
    winner: string,
    sign: string
  ) {
    (this.service = 'chat'), (this.type = 'crossMove');
    this.params = {
      coords: coords,
      player: player,
      field: field,
      winner: winner,
      sign: sign
    };
  }
}

export class CrossGameChannel extends ChatChannel {
  logic: CrossGameLogic;
  players: Array<{login:string, avatar: string}>;
  constructor(name: string, type: string, params: any) {
    super(name, type);
    console.log('created OnlyChatChannel');
    this.logic = new CrossGameLogic();
    this.players = [];
  }

  sendForAllClients(response: IChatResponse) {
    this.clients.forEach((client) => {
      client.send(response);
    });
  }

  async joinPlayer(connection: any, params: any) {
    try {
      const currentClient = this.clients.find((it) => it.connection == connection);
      this.logic.setPlayers(currentClient.userData.login);
      this.players.push({login: currentClient.userData.login, avatar: currentClient.userData.avatar})
      const response = new ChannelJoinPlayerResponse('ok', params.requestId);
      currentClient.send(response);
    } catch (err) {
      connection.sendUTF(JSON.stringify(new ChannelJoinPlayerResponse('error', params.requestId)));
    }
  }

  getPlayers(connection, params) {
    const currentClient = this.clients.find((it) => it.connection == connection);
    if (currentClient && currentClient.userData) {
      const response = new ChannelSendPlayersResponse(
        currentClient.userData.login,
        this.players
      );
      this.sendForAllClients(response);
    } else {
      connection.sendUTF(
        JSON.stringify({
          service: 'chat',
          type: 'sendStatus',
          params: {
            requestId: params.requestId,
            status: 'error',
            description: 'not joined'
          }
        })
      );
    }
  }

  crossStartGame(connection, params) {
    const currentClient = this.clients.find((it) => it.connection == connection);
    if (currentClient && currentClient.userData) {
      const response = new CrossStartResponse();
      console.log('START CROSS', response);

      this.sendForAllClients(response);
      // } else {
      //   connection.sendUTF(JSON.stringify({
      //     service: 'chat',
      //     type: 'sendStatus',
      //     params:{
      //       requestId: params.requestId,
      //       status: 'error',
      //       description: 'not joined'
      //     }
      //   }));
    }
  }

  crossMove(connection, params) {
    const currentClient = this.clients.find((it) => it.connection == connection);
    if (currentClient) {
      let currentUser = currentClient.userData;
      if (currentUser) {
        if (this.logic.getCurrentPlayer() === currentUser.login) {
          let coords = JSON.parse(params.messageText);
          const clickVector = new Vector(coords.x, coords.y);
          this.logic.writeSignToField(currentUser.login, clickVector);
          const response = new CrossMoveResponse(
            params.messageText,
            currentUser.login,
            this.logic.getField(),
            this.logic.getWinner(),
            this.logic.getCurrentSign()
          );
          this.clients.forEach((it) => it.connection.sendUTF(JSON.stringify(response)));
          if (this.logic.getWinner()) {
            this.logic.clearData();
          }
        }
      }
    }
  }
}

let size = 3;
export class CrossGameLogic {
  private field: Array<Array<string>> = [];
  private players: Array<string> = [];
  private currentPlayerIndex: number = 0;
  private signs: Array<string> = [ 'X', 'O' ];
  private winner: string = '';
  private currentSign: string = this.signs[0];

  constructor() {
    this.field = [ [ '', '', '' ], [ '', '', '' ], [ '', '', '' ] ];
  }
  getPlayers(): Array<string> {
    return this.players;
  }

  setPlayers(player: string): void {
    if (this.players.length < 2) {
      this.players.push(player);
    }
  }

  setCurrentPlayer(): void {
    this.currentPlayerIndex = this.currentPlayerIndex === 0 ? 1 : 0;
  }

  writeSignToField(player: string, coords: Vector): void {
    if (this.players.length === 2) {
      if (!this.winner) {
        if (player === this.players[this.currentPlayerIndex]) {
          this.field[coords.y][coords.x] = this.signs[this.currentPlayerIndex];
          this.checkWinner(coords, this.signs[this.currentPlayerIndex]);
          this.currentSign = this.signs[this.currentPlayerIndex];
          this.setCurrentPlayer();
        }
      }
    }
  }

  getField(): Array<Array<string>> {
    return this.field;
  }

  getWinner(): string {
    return this.winner;
  }

  checkWinner(coords: Vector, sign: string): void {
    let countHor = 1;
    let countVer = 1;
    let countDiagPrim = 1;
    let countDiagSec = 1;

    const { x: fromX, y: fromY } = coords;
    const moveHor = [ { x: -1, y: 0 }, { x: 1, y: 0 } ];
    const moveVer = [ { x: 0, y: 1 }, { x: 0, y: -1 } ];
    const moveDiagPrim = [ { x: -1, y: -1 }, { x: 1, y: 1 } ];
    const moveDiagSec = [ { x: -1, y: 1 }, { x: 1, y: -1 } ];

    moveHor.forEach((move) => {
      let toX = fromX;
      let toY = fromY;
      for (let i = 0; i < size; i++) {
        toX += move.x;
        toY += move.y;
        if (toY >= 0 && toY < size && toX >= 0 && toX < size) {
          if (this.field[toY][toX] === sign) {
            countHor++;
          } else break;
        }
      }
    });

    moveVer.forEach((move) => {
      let toX = fromX;
      let toY = fromY;
      for (let i = 0; i < size; i++) {
        toX += move.x;
        toY += move.y;
        if (toY >= 0 && toY < size && toX >= 0 && toX < size) {
          if (this.field[toY][toX] === sign) {
            countVer++;
          } else break;
        }
      }
    });

    moveDiagPrim.forEach((move) => {
      let toX = fromX;
      let toY = fromY;
      for (let i = 0; i < size; i++) {
        toX += move.x;
        toY += move.y;
        if (toY >= 0 && toY < size && toX >= 0 && toX < size) {
          if (this.field[toY][toX] === sign) {
            countDiagPrim++;
          } else break;
        }
      }
    });

    moveDiagSec.forEach((move) => {
      let toX = fromX;
      let toY = fromY;
      for (let i = 0; i < size; i++) {
        toX += move.x;
        toY += move.y;
        if (toY >= 0 && toY < size && toX >= 0 && toX < size) {
          if (this.field[toY][toX] === sign) {
            countDiagSec++;
          } else break;
        }
      }
    });
    if (countHor === size || countVer === size || countDiagPrim === size || countDiagSec === size) {
      this.winner = this.players[this.currentPlayerIndex];
      console.log(`Win! The player ${this.players[this.currentPlayerIndex]} wins the game`);
    }
  }

  clearData(): void {
    this.field = [ [ '', '', '' ], [ '', '', '' ], [ '', '', '' ] ];
    this.players = [];
    this.currentPlayerIndex = 0;
    this.winner = '';
  }

  getCurrentSign(): string {
    return this.currentSign;
  }

  getCurrentPlayer(): string {
    return this.players[this.currentPlayerIndex];
  }
}
