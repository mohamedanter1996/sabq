import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RealtimeService } from '../../services/realtime.service';
import { AuthService } from '../../services/auth.service';
import { SoundService } from '../../services/sound.service';
import { Subscription } from 'rxjs';

interface OptionDto { id: string; textAr: string; }
interface QuestionDto { id: string; textAr: string; options: OptionDto[]; timeLimitSec: number; }
interface NewQuestionEvent { question: QuestionDto; questionNumber: number; totalQuestions: number; hasAlreadyAnswered?: boolean; selectedOptionId?: string; }
interface AnswerResultEvent { playerId: string; updatedScore: number; }
interface PlayerLeaderboard { id: string; displayName: string; score: number; }
interface ScoresUpdatedEvent { leaderboard: PlayerLeaderboard[]; }
interface QuestionLockedEvent { playerId: string; playerName: string; }
interface QuestionEndedEvent { correctOptionId: string; leaderboard: PlayerLeaderboard[]; }

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width: 900px; margin-top: 30px;">
      <!-- Celebration Overlay -->
      <div *ngIf="showCelebration" class="celebration-overlay" [class.first-place]="myRank === 1" [class.last-place]="myRank === leaderboard.length && leaderboard.length > 1">
        <div class="celebration-content">
          <div *ngIf="myRank === 1" class="celebration-emoji">🏆</div>
          <div *ngIf="myRank === leaderboard.length && leaderboard.length > 1" class="celebration-emoji">😢</div>
          <div class="celebration-text">{{ celebrationMessage }}</div>
        </div>
      </div>

      <!-- Rank Change Indicator -->
      <div *ngIf="rankChangeIndicator" class="rank-change-indicator" [class.rank-up]="rankChangeIndicator === 'up'" [class.rank-down]="rankChangeIndicator === 'down'">
        {{ rankChangeIndicator === 'up' ? '⬆️ صعدت!' : '⬇️ نزلت!' }}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <div style="font-size: 20px; font-weight: bold; color: var(--primary);">
          سؤال {{ questionNumber }} / {{ totalQuestions }}
        </div>
        <div [class.timer-warning]="timeRemaining <= 5 && timeRemaining > 0" 
             [class.timer-pulse]="timeRemaining <= 3 && timeRemaining > 0"
             style="font-size: 36px; font-weight: bold; color: var(--secondary); transition: all 0.3s;">
          {{ timeRemaining }}s
        </div>
        <div style="text-align: left;">
          <div style="font-size: 16px; color: var(--text-secondary);">{{ myDisplayName }}</div>
          <div style="font-size: 20px; font-weight: bold; color: var(--accent);">
            النقاط: {{ myScore }}
          </div>
          <div *ngIf="myRank > 0 && !allSameScore" style="font-size: 14px; color: var(--text-secondary);">
            المركز: {{ myRank }} {{ getRankEmoji(myRank) }}
          </div>
        </div>
      </div>

      <div *ngIf="currentQuestion" class="card question-card" [class.question-enter]="questionAnimating" style="background: var(--primary); color: white; padding: 40px; margin-bottom: 30px;">
        <h2 style="font-size: 28px; text-align: center; line-height: 1.6;">{{ currentQuestion.textAr }}</h2>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <button 
          *ngFor="let option of currentQuestion?.options; let i = index"
          class="btn option-btn"
          [class.option-enter]="questionAnimating"
          [style.animation-delay]="(i * 0.1) + 's'"
          [style.background-color]="getOptionColor(option.id)"
          [class.option-correct]="showCorrectAnswer && option.id === correctOptionId"
          [class.option-wrong]="showCorrectAnswer && option.id === selectedOptionId && option.id !== correctOptionId"
          [class.option-selected]="!showCorrectAnswer && option.id === selectedOptionId"
          style="padding: 30px; font-size: 20px; height: auto; min-height: 100px; transition: all 0.3s;"
          (click)="submitAnswer(option.id)"
          [disabled]="hasAnswered || showCorrectAnswer || questionLocked">
          {{ option.textAr }}
        </button>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 15px;">لوحة المتصدرين</h3>
        <div *ngFor="let player of leaderboard; let i = index" 
             [class.leaderboard-me]="player.id === authService.playerId"
             [class.leaderboard-first]="i === 0 && !allSameScore"
             [class.leaderboard-last]="i === leaderboard.length - 1 && leaderboard.length > 1 && !allSameScore"
             style="display: flex; justify-content: space-between; padding: 12px; border-radius: 8px; margin-bottom: 8px; transition: all 0.3s;"
             [style.background]="player.id === authService.playerId ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : (!allSameScore && i === 0 ? '#FEF3C7' : '#F9FAFB')"
             [style.color]="player.id === authService.playerId ? 'white' : 'inherit'">
          <span>
            <span *ngIf="!allSameScore" style="font-size: 18px; margin-left: 8px;">{{ getRankEmoji(i + 1) }}</span>
            <span *ngIf="!allSameScore">{{ i + 1 }}. </span>{{ player.displayName }}
            <span *ngIf="player.id === authService.playerId" style="font-size: 12px; opacity: 0.8;">(أنت)</span>
          </span>
          <span style="font-weight: bold;" [style.color]="player.id === authService.playerId ? 'white' : 'var(--accent)'">{{ player.score }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .celebration-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out forwards;
      pointer-events: none;
    }
    .celebration-overlay.first-place {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.9) 100%);
    }
    .celebration-overlay.last-place {
      background: linear-gradient(135deg, rgba(100, 100, 100, 0.9) 0%, rgba(50, 50, 50, 0.9) 100%);
    }
    .celebration-content {
      text-align: center;
      animation: bounceIn 0.5s ease-out;
    }
    .celebration-emoji {
      font-size: 80px;
      animation: pulse 0.5s ease-in-out infinite alternate;
    }
    .celebration-text {
      font-size: 32px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      margin-top: 20px;
    }
    .rank-change-indicator {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 30px;
      border-radius: 20px;
      font-size: 18px;
      font-weight: bold;
      z-index: 999;
      animation: slideDownFade 2s ease-out forwards;
    }
    .rank-change-indicator.rank-up {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: white;
    }
    .rank-change-indicator.rank-down {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      color: white;
    }
    .timer-warning {
      color: #ef4444 !important;
    }
    .timer-pulse {
      animation: timerPulse 0.5s ease-in-out infinite alternate;
    }
    .question-enter {
      animation: slideIn 0.5s ease-out;
    }
    .option-btn.option-enter {
      animation: fadeInUp 0.4s ease-out backwards;
    }
    .option-correct {
      animation: correctPulse 0.5s ease-in-out;
    }
    .option-wrong {
      animation: shake 0.5s ease-in-out;
    }
    .option-selected {
      transform: scale(0.98);
      box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
    }
    .leaderboard-me {
      transform: scale(1.02);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .leaderboard-first {
      border: 2px solid #f59e0b;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }
    @keyframes slideDownFade {
      0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      20% { opacity: 1; transform: translateX(-50%) translateY(0); }
      80% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    @keyframes timerPulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); color: #dc2626; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes correctPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
      100% { transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
  `]
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
  questionLocked = false;
  leaderboard: PlayerLeaderboard[] = [];
  myScore = 0;
  myDisplayName = '';
  isHost = false;
  
  // New animation/sound properties
  myRank = 0;
  previousRank = 0;
  showCelebration = false;
  celebrationMessage = '';
  rankChangeIndicator: 'up' | 'down' | null = null;
  questionAnimating = false;
  private lastTimerWarning = -1;
  
  private subscriptions: Subscription[] = [];
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService,
    public authService: AuthService,
    private soundService: SoundService,
    private toastr: ToastrService
  ) {
    this.myDisplayName = this.authService.displayName || '';
  }

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
        this.hasAnswered = event.hasAlreadyAnswered || false;
        this.selectedOptionId = event.selectedOptionId || null;
        this.correctOptionId = null;
        this.showCorrectAnswer = false;
        this.questionLocked = false;
        this.lastTimerWarning = -1;
        
        // Trigger question animation and sound
        this.questionAnimating = true;
        this.soundService.playNewQuestionSound();
        setTimeout(() => this.questionAnimating = false, 600);
        
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
        const meIndex = event.leaderboard.findIndex((p: PlayerLeaderboard) => p.id === this.authService.playerId);
        if (meIndex >= 0) {
          const me = event.leaderboard[meIndex];
          this.myScore = me.score;
          const newRank = meIndex + 1;
          
          // Track rank changes (only if scores differ)
          if (this.myRank > 0 && newRank !== this.myRank && !this.allSameScore) {
            if (newRank < this.myRank) {
              this.soundService.playRankUpSound();
              this.showRankChange('up');
            } else {
              this.soundService.playRankDownSound();
              this.showRankChange('down');
            }
          }
          this.previousRank = this.myRank;
          this.myRank = newRank;
        }
      })
    );

    this.subscriptions.push(
      this.realtimeService.questionLocked$.subscribe((event: QuestionLockedEvent) => {
        console.log('=== QUESTION LOCKED ===', event);
        this.questionLocked = true;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        // Show toast: someone answered correctly
        if (event.playerId !== this.authService.playerId) {
          this.toastr.info(`${event.playerName} أجاب بشكل صحيح!`, 'سبقك أحدهم!');
        }
      })
    );

    this.subscriptions.push(
      this.realtimeService.questionEnded$.subscribe((event: QuestionEndedEvent) => {
        this.correctOptionId = event.correctOptionId;
        this.showCorrectAnswer = true;
        this.leaderboard = event.leaderboard;
        
        // Update my rank
        const meIndex = event.leaderboard.findIndex((p: PlayerLeaderboard) => p.id === this.authService.playerId);
        if (meIndex >= 0) {
          this.myRank = meIndex + 1;
        }
        
        // Play sound and show toast based on answer
        if (this.selectedOptionId) {
          if (this.selectedOptionId === event.correctOptionId) {
            this.soundService.playCorrectSound();
            this.toastr.success('أحسنت! إجابة صحيحة', 'صحيح ✓');
            
            // Show first place celebration (only if scores differ)
            if (this.myRank === 1 && !this.allSameScore) {
              this.showCelebrationOverlay('🎉 أنت في المركز الأول!');
              this.soundService.playFirstPlaceSound();
            }
          } else {
            this.soundService.playWrongSound();
            this.toastr.error('للأسف إجابة خاطئة', 'خطأ ✗');
            
            // Show last place sad overlay (only if scores differ)
            if (this.myRank === this.leaderboard.length && this.leaderboard.length > 1 && !this.allSameScore) {
              this.showCelebrationOverlay('😢 أنت في المركز الأخير');
              this.soundService.playLastPlaceSound();
            }
          }
        } else {
          this.toastr.warning('لم تجب على السؤال', 'انتهى الوقت');
          
          // Show last place sad overlay if didn't answer (only if scores differ)
          if (this.myRank === this.leaderboard.length && this.leaderboard.length > 1 && !this.allSameScore) {
            this.showCelebrationOverlay('😢 أنت في المركز الأخير');
            this.soundService.playLastPlaceSound();
          }
        }
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
    this.soundService.playClickSound();
    
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
        
        // Play timer warning sound when time is low
        if (this.timeRemaining <= 5 && this.timeRemaining > 0 && this.timeRemaining !== this.lastTimerWarning) {
          this.lastTimerWarning = this.timeRemaining;
          this.soundService.playTimerWarningSound();
        }
        
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

  getRankEmoji(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  get allSameScore(): boolean {
    if (this.leaderboard.length <= 1) return true;
    const firstScore = this.leaderboard[0]?.score ?? 0;
    return this.leaderboard.every(p => p.score === firstScore);
  }

  private showCelebrationOverlay(message: string): void {
    this.celebrationMessage = message;
    this.showCelebration = true;
    setTimeout(() => {
      this.showCelebration = false;
    }, 2000);
  }

  private showRankChange(direction: 'up' | 'down'): void {
    this.rankChangeIndicator = direction;
    setTimeout(() => {
      this.rankChangeIndicator = null;
    }, 2000);
  }
}
