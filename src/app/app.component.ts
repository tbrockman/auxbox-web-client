import { Component, 
         ViewChild, 
         ElementRef, 
         Renderer2, 
         enableProdMode}        from '@angular/core';
import { MediaService, 
         MediaServiceListener } from './media.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements MediaServiceListener {

  private _mediaService  : MediaService;
  private _renderer      : Renderer2;

  title = 'auxbox-web-client';
  showAudio = false;
  showInput = true;
  showSeekCircle = false;
  inputForm = {
    apiKey: ''
  };
  currentSong = {
    uri: '',
    isPlaying: false,
    metadata: {},
    timeElapsed: 0,
    songLength: 0,
    buffered: 0,
    filled: 0,
    remaining: 0,
  };
  controlState = {
    shuffle: false,
    volumeDropdownOpen: false,
    hoverPercent: 0,
    highlightedPercent: 0
  };

  @ViewChild('player', { static: false }) $player : ElementRef;
  @ViewChild('seekbar', { static: false }) $seekbar : ElementRef;
  @ViewChild('seekcircle', { static: false }) $seekcircle : ElementRef;

  constructor(service : MediaService, renderer : Renderer2) { 
    this._mediaService = service;
    this._mediaService.registerListener(this)
    this._renderer = renderer;
  }

  ngAfterViewInit() {
    this.$player.nativeElement.addEventListener('timeupdate', event => {
      this.updateTime();
      this.recalculateFilledRatio();
    });
    this.$player.nativeElement.addEventListener('play', event => {
      this.currentSong.isPlaying = true;
      this.$player.nativeElement.autoplay = true;
    });
    this.$player.nativeElement.addEventListener('pause', event => {
      this.currentSong.isPlaying = false;
    });
    this.$player.nativeElement.addEventListener('loadeddata', event => {
      this.updateTime();
      this.recalculateFilledRatio();
    });
    this.$player.nativeElement.addEventListener('ended', event => {
      this._mediaService.skipForward();
    })
    this.$seekbar.nativeElement.addEventListener('mousemove', event => {
      const rect = this.$seekbar.nativeElement.getBoundingClientRect();
      const x = event.pageX - rect.x;
      this.controlState.hoverPercent = x * 100 / rect.width;
      this.recalculateFilledRatio();
    });
    this.$seekbar.nativeElement.addEventListener('mouseleave', event => {
      this.controlState.hoverPercent = 0;
      this.recalculateFilledRatio();
    })
  }

  async onSubmit() {
    this._mediaService.apiKey = this.inputForm.apiKey;
    this._mediaService.fetchSongs();
  }

  seekTo() {
    const percent = this.controlState.hoverPercent;
    this.$player.nativeElement.currentTime = (percent / 100) * this.currentSong.songLength;
  }

  updateTime() {
    this.currentSong.timeElapsed = this.$player.nativeElement.currentTime;
    this.currentSong.songLength = this.$player.nativeElement.duration;
  }

  recalculateFilledRatio() {
    this.currentSong.filled = this.currentSong.timeElapsed * 100 / this.currentSong.songLength
    this.currentSong.remaining = 100 - this.currentSong.filled;
    this.controlState.highlightedPercent = Math.max(this.currentSong.filled, this.controlState.hoverPercent);
  }

  onPlaySong(song) {
    this.currentSong.uri = song.uri;
    this.currentSong.metadata = song.metadata;
    this.$player.nativeElement.src = this.currentSong.uri;
    this.recalculateFilledRatio();
    if (this.currentSong.isPlaying) {
      this.play();
    }
  }

  async onSongsLoad() {
    const song = await this._mediaService.getSong(0);
    this.currentSong.uri = song.uri;
    this.currentSong.metadata = song.metadata;
    this.$player.nativeElement.src = this.currentSong.uri;
    this.showAudio = true;
    this.showInput = false;
    console.log(this.currentSong)
  }

  onSongsLoadError(err) {
    console.log(err);
  }

  play() {
    this.$player.nativeElement.play();
  }

  pause() {
    this.$player.nativeElement.pause();
  }

  skipForward() {
    this._mediaService.skipForward();
  }

  skipBackward() {
    this._mediaService.skipBackward();
  }

  toggleVolumeDropdown() {
    this.controlState.volumeDropdownOpen = !this.controlState.volumeDropdownOpen;
  }

  toggleShuffle() {
    this.controlState.shuffle = !this.controlState.shuffle;
    //if (this.controlState.shuffle) {
    this._mediaService.shuffle();
    //}
  }
}
