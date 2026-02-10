import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeService } from '../../services/realtime.service';
import { Subscription } from 'rxjs';

interface PlayerLeaderboard { id: string; displayName: string; score: number; }
interface GameEndedEvent { finalLeaderboard: PlayerLeaderboard[]; winnerIds: string[]; }

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width: 700px; margin-top: 50px; text-align: center;">
      <div style="font-size: 80px; margin-bottom: 20px;">🏆</div>
      <h1 style="color: var(--primary); margin-bottom: 10px;">انتهت اللعبة!</h1>
      <p style="color: var(--text-secondary); font-size: 20px; margin-bottom: 50px;">نتائج اللاعبين</p>

      <div class="card" style="text-align: right;">
        <div *ngFor="let player of leaderboard; let i = index" 
             style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #F9FAFB; border-radius: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 32px;">{{ getMedal(i) }}</span>
            <span style="font-size: 22px; font-weight: bold;">{{ player.displayName }}</span>
          </div>
          <span style="font-size: 24px; font-weight: bold; color: var(--accent);">{{ player.score }} نقطة</span>
        </div>
      </div>

      <button class="btn btn-primary" style="width: 100%; margin-top: 40px; padding: 20px; font-size: 20px;" (click)="backToHome()">
        العودة للرئيسية
      </button>
    </div>
  `
})
export class ResultsComponent implements OnInit, OnDestroy {
  roomCode = '';
  leaderboard: any[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService
  ) {}

  ngOnInit(): void {
    this.roomCode = this.route.snapshot.params['code'];

    this.subscriptions.push(
      this.realtimeService.gameEnded$.subscribe((event: GameEndedEvent) => {
        this.leaderboard = event.finalLeaderboard;
      })
    );
  }

  async ngOnDestroy(): Promise<void> {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    await this.realtimeService.leaveRoom(this.roomCode);
    await this.realtimeService.disconnect();
  }

  getMedal(index: number): string {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || '🏅';
  }

  backToHome(): void {
    this.router.navigate(['/home']);
  }
}
