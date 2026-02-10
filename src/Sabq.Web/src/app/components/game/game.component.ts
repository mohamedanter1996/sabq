import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeService } from '../../services/realtime.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface OptionDto { id: string; textAr: string; }
interface QuestionDto { id: string; textAr: string; options: OptionDto[]; timeLimitSec: number; }
interface NewQuestionEvent { question: QuestionDto; questionNumber: number; totalQuestions: number; }
interface AnswerResultEvent { playerId: string; updatedScore: number; }
interface PlayerLeaderboard { id: string; displayName: string; score: number; }
interface ScoresUpdatedEvent { leaderboard: PlayerLeaderboard[]; }
interface QuestionEndedEvent { correctOptionId: string; leaderboard: PlayerLeaderboard[]; }

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width: 900px; margin-top: 30px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="font-size: 20px; font-weight: bold; color: var(--primary);">
          سؤال {{ questionNumber }} / {{ totalQuestions }}
        </div>
        <div style="font-size: 36px; font-weight: bold; color: var(--secondary);">
          {{ timeRemaining }}s
        </div>
        <div style="font-size: 20px; font-weight: bold; color: var(--accent);">
          النقاط: {{ myScore }}
        </div>
      </div>

      <div *ngIf="currentQuestion" class="card" style="background: var(--primary); color: white; padding: 40px; margin-bottom: 30px;">
        <h2 style="font-size: 28px; text-align: center; line-height: 1.6;">{{ currentQuestion.textAr }}</h2>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <button 
          *ngFor="let option of currentQuestion?.options"
          class="btn"
          [style.background-color]="getOptionColor(option.id)"
          style="padding: 30px; font-size: 20px; height: auto; min-height: 100px;"
          (click)="submitAnswer(option.id)"
          [disabled]="hasAnswered">
          {{ option.textAr }}
        </button>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 15px;">لوحة المتصدرين</h3>
        <div *ngFor="let player of leaderboard; let i = index" 
             style="display: flex; justify-content: space-between; padding: 10px; background: #F9FAFB; border-radius: 8px; margin-bottom: 8px;">
          <span>{{ i + 1 }}. {{ player.displayName }}</span>
          <span style="font-weight: bold; color: var(--accent);">{{ player.score }}</span>
        </div>
      </div>
    </div>
  `
})
export class GameComponent implements OnInit, OnDestroy {
  roomCode = '';
  currentQuestion: QuestionDto | null = null;
  questionNumber = 0;
  totalQuestions = 0;
  timeRemaining = 0;
  hasAnswered = false;
  selectedOptionId: string | null = null;
  correctOptionId: string | null = null;
  showCorrectAnswer = false;
  leaderboard: PlayerLeaderboard[] = [];
  myScore = 0;
  isHost = false;
  private subscriptions: Subscription[] = [];
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.roomCode = this.route.snapshot.params['code'];
    
    // Ensure we're connected and in the SignalR group
    await this.realtimeService.connect();
    await this.realtimeService.joinRoom(this.roomCode);

    // Subscribe to room snapshot to determine if host
    this.subscriptions.push(
      this.realtimeService.roomSnapshot$.subscribe(snapshot => {
        this.isHost = snapshot.hostPlayerId === this.authService.playerId;
        console.log('Is host:', this.isHost);
      })
    );

    this.subscriptions.push(
      this.realtimeService.newQuestion$.subscribe((event: NewQuestionEvent) => {
        console.log('=== NEW QUESTION RECEIVED ===', event);
        this.currentQuestion = event.question;
        this.questionNumber = event.questionNumber;
        this.totalQuestions = event.totalQuestions;
        this.timeRemaining = event.question.timeLimitSec;
        this.hasAnswered = false;
        this.selectedOptionId = null;
        this.correctOptionId = null;
        this.showCorrectAnswer = false;
        this.startTimer();
      })
    );

    this.subscriptions.push(
      this.realtimeService.answerResult$.subscribe((event: AnswerResultEvent) => {
        if (event.playerId === this.authService.playerId) {
          this.myScore = event.updatedScore;
        }
      })
    );

    this.subscriptions.push(
      this.realtimeService.scoresUpdated$.subscribe((event: ScoresUpdatedEvent) => {
        this.leaderboard = event.leaderboard;
        const me = event.leaderboard.find((p: PlayerLeaderboard) => p.id === this.authService.playerId);
        if (me) {
          this.myScore = me.score;
        }
      })
    );

    this.subscriptions.push(
      this.realtimeService.questionEnded$.subscribe((event: QuestionEndedEvent) => {
        this.correctOptionId = event.correctOptionId;
        this.showCorrectAnswer = true;
        this.leaderboard = event.leaderboard;
      })
    );

    this.subscriptions.push(
      this.realtimeService.gameEnded$.subscribe(() => {
        this.router.navigate(['/results', this.roomCode]);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  async submitAnswer(optionId: string): Promise<void> {
    if (this.hasAnswered || !this.currentQuestion) return;
    
    this.hasAnswered = true;
    this.selectedOptionId = optionId;
    
    await this.realtimeService.submitAnswer(this.roomCode, this.currentQuestion.id, optionId);
  }

  getOptionColor(optionId: string): string {
    if (!this.showCorrectAnswer) {
      return this.selectedOptionId === optionId ? '#9CA3AF' : 'var(--surface)';
    }
    
    if (optionId === this.correctOptionId) {
      return 'var(--success)';
    }
    
    if (optionId === this.selectedOptionId) {
      return 'var(--error)';
    }
    
    return 'var(--surface)';
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(async () => {
      if (this.timeRemaining > 0 && !this.showCorrectAnswer) {
        this.timeRemaining--;
        
        // When timer hits 0, host ends the question
        if (this.timeRemaining === 0 && this.isHost && this.currentQuestion) {
          console.log('Timer expired - host ending question');
          await this.realtimeService.endQuestion(this.roomCode, this.currentQuestion.id);
        }
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }
}
