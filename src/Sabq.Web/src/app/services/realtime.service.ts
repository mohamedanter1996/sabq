import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, ReplaySubject } from 'rxjs';
import { AuthService } from './auth.service';

const HUB_URL = 'http://localhost:5000/hubs/sabq';

// SignalR event types
interface PlayerDto { id: string; displayName: string; score: number; }
interface RoomSnapshot { roomCode: string; players: PlayerDto[]; hostPlayerId: string; status: number; totalQuestions: number; currentQuestionIndex: number; }
interface PlayerJoinedEvent { player: PlayerDto; }
interface GameStartedEvent { message?: string; }
interface OptionDto { id: string; textAr: string; }
interface QuestionDto { id: string; textAr: string; options: OptionDto[]; timeLimitSec: number; }
interface NewQuestionEvent { question: QuestionDto; questionNumber: number; totalQuestions: number; }
interface AnswerResultEvent { playerId: string; updatedScore: number; }
interface PlayerLeaderboard { id: string; displayName: string; score: number; rank: number; }
interface ScoresUpdatedEvent { leaderboard: PlayerLeaderboard[]; }
interface QuestionEndedEvent { correctOptionId: string; leaderboard: PlayerLeaderboard[]; }
interface GameEndedEvent { finalLeaderboard: PlayerLeaderboard[]; winnerIds: string[]; }
interface QuestionLockedEvent { playerId: string; playerName: string; }
interface EmotionEvent { fromPlayerId: string; fromPlayerName: string; toPlayerId: string; emotion: string; }

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private hubConnection?: signalR.HubConnection;

  roomSnapshot$ = new ReplaySubject<RoomSnapshot>(1);
  playerJoined$ = new Subject<PlayerJoinedEvent>();
  gameStarted$ = new ReplaySubject<GameStartedEvent>(1);
  newQuestion$ = new ReplaySubject<NewQuestionEvent>(1);
  answerResult$ = new Subject<AnswerResultEvent>();
  scoresUpdated$ = new ReplaySubject<ScoresUpdatedEvent>(1);
  questionLocked$ = new Subject<QuestionLockedEvent>();
  questionEnded$ = new ReplaySubject<QuestionEndedEvent>(1);
  gameEnded$ = new ReplaySubject<GameEndedEvent>(1);
  emotionReceived$ = new Subject<EmotionEvent>();
  error$ = new Subject<string>();

  constructor(private authService: AuthService) {}

  /**
   * Resets all ReplaySubjects to clear cached state from previous games.
   * Must be called when starting a new game session.
   */
  resetState(): void {
    this.roomSnapshot$ = new ReplaySubject<RoomSnapshot>(1);
    this.gameStarted$ = new ReplaySubject<GameStartedEvent>(1);
    this.newQuestion$ = new ReplaySubject<NewQuestionEvent>(1);
    this.scoresUpdated$ = new ReplaySubject<ScoresUpdatedEvent>(1);
    this.questionEnded$ = new ReplaySubject<QuestionEndedEvent>(1);
    this.gameEnded$ = new ReplaySubject<GameEndedEvent>(1);
  }

  async connect(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => this.authService.token || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.on('RoomSnapshot', (data: RoomSnapshot) => {
      console.log('RoomSnapshot received:', data);
      this.roomSnapshot$.next(data);
    });
    this.hubConnection.on('PlayerJoined', (data: PlayerJoinedEvent) => this.playerJoined$.next(data));
    this.hubConnection.on('GameStarted', (data: GameStartedEvent) => {
      console.log('GameStarted received:', data);
      this.gameStarted$.next(data);
    });
    this.hubConnection.on('NewQuestion', (data: NewQuestionEvent) => {
      console.log('NewQuestion received:', data);
      this.newQuestion$.next(data);
    });
    this.hubConnection.on('AnswerResult', (data: AnswerResultEvent) => this.answerResult$.next(data));
    this.hubConnection.on('ScoresUpdated', (data: ScoresUpdatedEvent) => this.scoresUpdated$.next(data));
    this.hubConnection.on('QuestionLocked', (data: QuestionLockedEvent) => {
      console.log('QuestionLocked received:', data);
      this.questionLocked$.next(data);
    });
    this.hubConnection.on('QuestionEnded', (data: QuestionEndedEvent) => {
      console.log('QuestionEnded received:', data);
      this.questionEnded$.next(data);
    });
    this.hubConnection.on('GameEnded', (data: GameEndedEvent) => this.gameEnded$.next(data));
    this.hubConnection.on('EmotionReceived', (data: EmotionEvent) => this.emotionReceived$.next(data));
    this.hubConnection.on('Error', (message: string) => this.error$.next(message));

    await this.hubConnection.start();
    console.log('SignalR connected to:', HUB_URL);
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
    }
  }

  async joinRoom(roomCode: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('Joining room:', roomCode);
      await this.hubConnection.invoke('JoinRoom', roomCode);
      console.log('JoinRoom invoked successfully');
    } else {
      console.error('Cannot join room - SignalR not connected');
    }
  }

  async leaveRoom(roomCode: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveRoom', roomCode);
    }
  }

  async startGame(roomCode: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('StartGame', roomCode);
    }
  }

  async submitAnswer(roomCode: string, questionId: string, optionId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SubmitAnswer', roomCode, questionId, optionId);
    }
  }

  async endQuestion(roomCode: string, questionId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('EndQuestion', roomCode, questionId);
    }
  }

  async sendEmotion(roomCode: string, toPlayerId: string, emotion: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendEmotion', roomCode, toPlayerId, emotion);
    }
  }
}
