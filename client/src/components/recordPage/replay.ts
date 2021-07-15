import { IChessHistory, ICrossHistory, IPublicUserInfo, IChessData } from './../utilities/interfaces';
import Control from "../utilities/control";
import GenericPopup from '../genericPopup/genericPopup';
import ButtonDefault from '../buttonDefault/buttonDefault';
import recordStyles from './recordPage.module.css';
import InputWrapper from '../inputWrapper/inputWrapper';
import Cross from '../games/cross/cross';
import ChessGame, { fromFen } from '../games/chess/chess-game';
export class Replay extends GenericPopup<string> {
    history: Array<IChessHistory> | Array<ICrossHistory>;
    replaySrceen: Control;
    popupWrapper : Control;
    gameType:string;
    params: {history : Array<IChessHistory> | Array<ICrossHistory>,gameType:string,player1:IPublicUserInfo,player2:IPublicUserInfo,moves:Array<{ field: string; player: string; history: IChessHistory}>}
    startButton: ButtonDefault;
    closeBtn: ButtonDefault;
    speed :number;
    speedSelection: InputWrapper;
    view: Cross;
    chessView: ChessGame;
    
    

    constructor(parentNode:HTMLElement,params:{history : Array<IChessHistory> | Array<ICrossHistory>,gameType:string,player1:IPublicUserInfo,player2:IPublicUserInfo,moves:Array<{ field: string; player: string; history: IChessHistory}>}){
        super(parentNode);
        this.params = params;
        this.speed = 1;
        this.startButton  = new ButtonDefault(this.popupWrapper.node,recordStyles.record_button,'replay');
        this.speedSelection = new InputWrapper(this.popupWrapper.node,
            'Enter replay speed value',
            ()=>null,'Value from 1 to 10','number');
        (this.speedSelection.field.node as HTMLInputElement).pattern = "^\d+$"
        this.speedSelection.field.node.oninput = () => {
            this.speed = Number(this.speedSelection.getValue());
        }
        this.startButton.onClick = () => {
            this.start()
        }        
        this.replaySrceen = new Control(this.popupWrapper.node, 'div', recordStyles.record_replayScreen);
        this.replaySrceen.node.style.width = '500px';
        this.replaySrceen.node.style.height = '500px';
        this.closeBtn = new ButtonDefault(this.popupWrapper.node,recordStyles.record_closeButton,'')
        this.closeBtn.onClick = () =>{
            this.onSelect('close')
        }
        
    }
    start(){
        this.replaySrceen.node.innerHTML = ''
        if(this.params.gameType == 'CROSS') {
            this.view = new Cross(this.replaySrceen.node);
            console.log(this.params.player1)
            this.view.playerOne.node.textContent = this.params.player1.login;
            this.view.playerTwo.node.textContent = this.params.player2.login;
            this.view.btnStart.destroy();
            this.view.btnDraw.destroy();
            this.view.btnLoss.destroy();
            (this.params.history as Array<ICrossHistory>).forEach((res:ICrossHistory,i:number)=>{
                setTimeout(()=>{
                    //const move = new Control( this.replaySrceen.node, 'div', );
                    // move.node.textContent = `${res.sign}-${res.move.x}-${res.move.y}-${res.time}`;
                    console.log(res)
                   this.view.timer.node.innerHTML = `${res.time}` 
                   const field : Array<Array<string>> = [[],[],[]];
                   field[res.move.y][res.move.x] = res.sign;
                   this.view.updateGameField(field)  
                },(1000 / this.speed) * ++i);
                
            })
        }
        if (this.params.gameType == 'CHESS'){
            const startTime = Date.now();
            console.log(this.params)
            const players = [
                {login:this.params.player1.login,
                avatar:''},
                {login:this.params.player2.login,
                    avatar:''}
            ]
            this.chessView = new ChessGame(this.replaySrceen.node,'network',0);
            this.chessView.setPlayer({player:this.params.player1.login,players:players});
            this.chessView.setPlayer({player:this.params.player2.login,players:players});
            this.chessView.startGame({field:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',time:startTime})
            this.params.moves.forEach((move,i)=>{
                setTimeout(()=>{
                    const chessDataMove: IChessData= {
                        coords: move.history.coords,
                        player: '',
                        field: move.field,
                        winner: '',
                        rotate: false,
                        history: move.history,
                        king: {
                          check:  null,
                          mate: false,
                          staleMate: false,
                        }
                      }
                    this.chessView.onFigureMove(chessDataMove)
                 },move.history.time/this.speed)
            })
        //     this.field.forEach((fen:string,i:number) => {
                
                
        //     })
        // }
        }
    }
}
