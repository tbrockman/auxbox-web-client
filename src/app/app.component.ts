import { Component, 
         ViewChild, 
         ElementRef }           from '@angular/core';
import { MediaService, 
         MediaServiceListener } from './media.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements MediaServiceListener {

  private _mediaService  : MediaService;

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
    img: '',
    displayTime: '',
  };
  controlState = {
    shuffle: false,
    volumeDropdownOpen: false,
    hoverPercent: 0,
    highlightedPercent: 0,
    volumeFilledPercent: 0,
    volumeDropdownClicked: false,
  };

  @ViewChild('player', { static: false }) $player : ElementRef;
  @ViewChild('seekbar', { static: false }) $seekbar : ElementRef;
  @ViewChild('seekcircle', { static: false }) $seekcircle : ElementRef;
  @ViewChild('volumedropdown', { static: false }) $volumedropdown : ElementRef;

  constructor(service : MediaService) { 
    this._mediaService = service;
    this._mediaService.registerListener(this)
  }

  ngAfterViewInit() {
    this.$player.nativeElement.volume = 0.5;
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
    this.$player.nativeElement.addEventListener('volumechange', event => {
      this.controlState.volumeFilledPercent = this.$player.nativeElement.volume * 100;
    });
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
    this.controlState.volumeFilledPercent = this.$player.nativeElement.volume * 100;
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

  volumeMouseDown(event) {
    this.controlState.volumeDropdownClicked = true;
    this.changeVolume(event);
  }

  volumeMouseUp(event) {
    this.controlState.volumeDropdownClicked = false;
    this.changeVolume(event);
  }

  changeVolume(event) {
    if (this.controlState.volumeDropdownClicked) {
      const rect = this.$volumedropdown.nativeElement.getBoundingClientRect();
      const y = event.pageY - rect.y;
      this.controlState.volumeFilledPercent = 100 - (y * 100 / rect.height);
      this.$player.nativeElement.volume = this.controlState.volumeFilledPercent / 100;
    }
  }
}
