import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeService } from '../../services/realtime.service';
import { AuthService } from '../../services/auth.service';
import { SoundService } from '../../services/sound.service';
import { Subscription } from 'rxjs';

interface PlayerLeaderboard { id: string; displayName: string; score: number; rank: number; }
interface GameEndedEvent { finalLeaderboard: PlayerLeaderboard[]; winnerIds: string[]; }

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container results-container" style="max-width: 700px; margin-top: 50px; text-align: center;">
      <!-- Confetti Effect for Winner -->
      <div *ngIf="isWinner && !allSameScore" class="confetti-container">
        <div *ngFor="let i of confettiPieces" class="confetti" [style.left]="i + '%'" [style.animation-delay]="(i * 0.1) + 's'"></div>
      </div>

      <div class="trophy-container" [class.winner-trophy]="isWinner && !allSameScore">
        <div style="font-size: 80px; margin-bottom: 20px;">{{ isWinner && !allSameScore ? '👑' : '🏆' }}</div>
      </div>
      
      <h1 style="color: var(--primary); margin-bottom: 10px;" class="title-animate">انتهت اللعبة!</h1>
      <p *ngIf="isWinner && !allSameScore" class="winner-message">🎉 مبروك! أنت الفائز! 🎉</p>
      <p *ngIf="allSameScore" style="color: var(--text-secondary); font-size: 18px;">تعادل الجميع!</p>
      <p *ngIf="myRank > 0 && !isWinner && !allSameScore" style="color: var(--text-secondary); font-size: 18px;">حصلت على المركز {{ myRank }}</p>
      <p style="color: var(--text-secondary); font-size: 20px; margin-bottom: 50px;">نتائج اللاعبين</p>

      <div class="card" style="text-align: right;">
        <div *ngFor="let player of leaderboard; let i = index" 
             class="player-row"
             [class.is-me]="player.id === authService.playerId"
             [class.is-winner]="player.rank === 1 && !allSameScore"
             [style.animation-delay]="(i * 0.15) + 's'"
             style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-radius: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <span *ngIf="!allSameScore" style="font-size: 32px;">{{ getMedal(player.rank) }}</span>
            <div>
              <span style="font-size: 22px; font-weight: bold;">{{ player.displayName }}</span>
              <span *ngIf="player.id === authService.playerId" style="font-size: 14px; opacity: 0.7; margin-right: 8px;">(أنت)</span>
            </div>
          </div>
          <span style="font-size: 24px; font-weight: bold;" [style.color]="player.rank === 1 && !allSameScore ? '#f59e0b' : 'var(--accent)'">{{ player.score }} نقطة</span>
        </div>
      </div>

      <button class="btn btn-primary" style="width: 100%; margin-top: 40px; padding: 20px; font-size: 20px;" (click)="backToHome()">
        العودة للرئيسية
      </button>
    </div>
  `,
  styles: [`
    .results-container {
      position: relative;
      overflow: hidden;
    }
    .confetti-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    }
    .confetti {
      position: absolute;
      width: 10px;
      height: 10px;
      top: -10px;
      animation: confettiFall 3s ease-out infinite;
    }
    .confetti:nth-child(odd) { background: #f59e0b; border-radius: 50%; }
    .confetti:nth-child(even) { background: #667eea; transform: rotate(45deg); }
    .confetti:nth-child(3n) { background: #22c55e; width: 8px; height: 8px; }
    .confetti:nth-child(4n) { background: #ef4444; border-radius: 3px; }
    
    .trophy-container {
      animation: bounceIn 0.8s ease-out;
    }
    .winner-trophy {
      animation: winnerBounce 1s ease-in-out infinite;
    }
    .title-animate {
      animation: fadeInUp 0.6s ease-out 0.3s backwards;
    }
    .winner-message {
      font-size: 24px;
      font-weight: bold;
      color: #f59e0b;
      animation: pulse 1s ease-in-out infinite;
      margin-bottom: 10px;
    }
    .player-row {
      background: #F9FAFB;
      animation: slideInRight 0.5s ease-out backwards;
      transition: all 0.3s;
    }
    .player-row.is-me {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: scale(1.02);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .player-row.is-winner {
      border: 3px solid #f59e0b;
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    }
    .player-row.is-me.is-winner {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: 3px solid #fbbf24;
    }
    
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes bounceIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @keyframes winnerBounce {
      0%, 100% { transform: scale(1) rotate(-5deg); }
      50% { transform: scale(1.1) rotate(5deg); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ResultsComponent implements OnInit, OnDestroy {
  roomCode = '';
  leaderboard: any[] = [];
  isWinner = false;
  myRank = 0;
  confettiPieces = Array.from({ length: 50 }, (_, i) => i * 2);
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService,
    public authService: AuthService,
    private soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.params['code'];

    this.subscriptions.push(
      this.realtimeService.gameEnded$.subscribe((event: GameEndedEvent) => {
        this.leaderboard = event.finalLeaderboard;
        
        // Check if current player is winner
        const myId = this.authService.playerId || '';
        this.isWinner = myId ? event.winnerIds.includes(myId) : false;
        
        // Find my rank from the backend-calculated rank property
        const myPlayer = event.finalLeaderboard.find(p => p.id === myId);
        this.myRank = myPlayer?.rank ?? 0;
        
        // Play appropriate sound
        const allSame = this.allSameScore;
        if (this.isWinner && !allSame) {
          this.soundService.playGameEndSound();
        } else if (this.myRank === event.finalLeaderboard.length && event.finalLeaderboard.length > 1 && !allSame) {
          this.soundService.playLastPlaceSound();
        } else {
          this.soundService.playGameEndSound();
        }
      })
    );
  }

  async ngOnDestroy(): Promise<void> {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    await this.realtimeService.leaveRoom(this.roomCode);
    await this.realtimeService.disconnect();
  }

  getMedal(rank: number): string {
    const medals: { [key: number]: string } = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return medals[rank] || '🏅';
  }

  get allSameScore(): boolean {
    if (this.leaderboard.length <= 1) return true;
    const firstScore = this.leaderboard[0]?.score ?? 0;
    return this.leaderboard.every(p => p.score === firstScore);
  }

  backToHome(): void {
    this.router.navigate(['/home']);
  }
}
