import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeService } from '../../services/realtime.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface PlayerDto { id: string; displayName: string; score: number; }
interface RoomSnapshot { roomCode: string; players: PlayerDto[]; hostPlayerId: string; }
interface PlayerJoinedEvent { player: PlayerDto; }

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width: 700px; margin-top: 50px;">
      <div class="card" style="background: var(--primary); color: white; text-align: center; margin-bottom: 30px;">
        <p style="opacity: 0.9; margin-bottom: 10px;">رمز الغرفة</p>
        <h1 style="font-size: 48px; letter-spacing: 8px; margin-bottom: 20px;">{{ roomCode }}</h1>
        <button class="btn btn-secondary" (click)="copyCode()">نسخ الرمز</button>
      </div>

      <div class="card">
        <h2 style="margin-bottom: 20px;">اللاعبون ({{ players.length }})</h2>
        <div *ngFor="let player of players" style="padding: 15px; background: #F9FAFB; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center;">
          <span style="font-size: 24px; margin-left: 15px;">👤</span>
          <span style="font-size: 18px;">{{ player.displayName }}</span>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: #FEE; border: 1px solid red;">
          <strong>Debug Info:</strong><br>
          isHost: {{ isHost }}<br>
          My ID: {{ authService.playerId }}<br>
        </div>
      </div>

      <button 
        *ngIf="isHost" 
        class="btn btn-accent" 
        style="width: 100%; margin-top: 30px; padding: 20px; font-size: 20px;"
        (click)="startGame()"
        [disabled]="loading">
        {{ loading ? 'جاري البدء...' : 'ابدأ اللعبة' }}
      </button>
    </div>
  `
})
export class LobbyComponent implements OnInit, OnDestroy {
  roomCode = '';
  players: PlayerDto[] = [];
  isHost = false;
  loading = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private realtimeService: RealtimeService,
    public authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.roomCode = this.route.snapshot.params['code'];
    
    console.log('=== LOBBY INIT ===');
    console.log('My stored playerId:', this.authService.playerId);
    console.log('LocalStorage playerId:', localStorage.getItem('playerId'));
    console.log('==================');

    await this.realtimeService.connect();
    await this.realtimeService.joinRoom(this.roomCode);

    this.subscriptions.push(
      this.realtimeService.roomSnapshot$.subscribe((snapshot: RoomSnapshot) => {
        console.log('=== LOBBY RECEIVED SNAPSHOT ===');
        console.log('Full Snapshot:', JSON.stringify(snapshot, null, 2));
        console.log('HostPlayerId (from snapshot):', snapshot.hostPlayerId);
        console.log('My PlayerId (from auth):', this.authService.playerId);
        console.log('Are they equal?', snapshot.hostPlayerId === this.authService.playerId);
        console.log('HostPlayerId type:', typeof snapshot.hostPlayerId);
        console.log('My PlayerId type:', typeof this.authService.playerId);
        
        this.players = snapshot.players;
        this.isHost = snapshot.hostPlayerId === this.authService.playerId;
        console.log('IsHost result:', this.isHost);
        console.log('==============================');
      })
    );

    this.subscriptions.push(
      this.realtimeService.playerJoined$.subscribe((event: PlayerJoinedEvent) => {
        this.players.push(event.player);
      })
    );

    this.subscriptions.push(
      this.realtimeService.gameStarted$.subscribe(() => {
        this.router.navigate(['/game', this.roomCode]);
      })
    );
  }

  async ngOnDestroy(): Promise<void> {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    await this.realtimeService.leaveRoom(this.roomCode);
  }

  async startGame(): Promise<void> {
    this.loading = true;
    await this.realtimeService.startGame(this.roomCode);
  }

  async copyCode(): Promise<void> {
    await navigator.clipboard.writeText(this.roomCode);
    alert('تم نسخ الرمز!');
  }
}
