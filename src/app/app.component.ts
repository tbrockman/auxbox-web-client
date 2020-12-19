import { Component, 
         ViewChild, 
         ElementRef }           from '@angular/core';
import { Router, NavigationEnd  } from '@angular/router';
import { MediaService, 
         MediaServiceListener } from './media.service'

import {
          trigger,
          state,
          style,
          animate,
          transition
        } from '@angular/animations';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements MediaServiceListener {

  private _mediaService  : MediaService;
  private _router : Router;

  title = 'auxbox-web-client';
  initialized = false;
  loading = true;
  formSubmitted = false;
  showAudio = false;
  showInput = false;
  showSeekCircle = false;
  errorMessage = "";
  inputForm = {
    apiKey: ''
  };
  currentSong = {
    buffered: 0,
    displayTime: '',
    filled: 0,
    img: '',
    isPlaying: false,
    metadata: {},
    remaining: 0,
    songLength: 0,
    timeElapsed: 0,
    uri: '',
  };
  controlState = {
    highlightedPercent: 0,
    hoverPercent: 0,
    shuffle: false,
    volumeSliderSelected: false,
    volumeDropdownOpen: false,
    volumeFilledPercent: 0,
  };

  @ViewChild('player', { static: false }) $player : ElementRef;
  @ViewChild('seekbar', { static: false }) $seekbar : ElementRef;
  @ViewChild('seekcircle', { static: false }) $seekcircle : ElementRef;
  @ViewChild('volumedropdown', { static: false }) $volumedropdown : ElementRef;
  @ViewChild('sineloader', { read: ElementRef, static: false }) $sineloader : ElementRef;

  constructor(service : MediaService, router : Router, ) { 
    this._mediaService = service;
    this._mediaService.registerListener(this);
    this._router = router;
  }

  ngOnInit() {
    
    let key = undefined;
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      const url = event['url'];
      const parsed = this._router.parseUrl(url);
      const params = parsed.queryParams;
  
      for (const k in params) {
  
        if (k == 'api') {
          key = params[k];
        }
      }
      key = key ? key : localStorage.getItem('apiKey');
  
      if (key != undefined) {
        this._mediaService.apiKey = key;
        this._mediaService.fetchSongs();
      }
      else {
        this.showInput = true;
      }
    })
  }

  ngAfterViewInit() {


    if (this.$sineloader.nativeElement) {
      this.$sineloader.nativeElement.style.display = this.loading ? "initial": "none";
    }

    this.$player.nativeElement.volume = 0.75;
    document.addEventListener('mousedown', event => {
      if (!this.$volumedropdown || (event.target != this.$volumedropdown.nativeElement && 
                                    !this.$volumedropdown.nativeElement.contains(event.target))) {
        if (this.controlState.volumeDropdownOpen) {
          this.toggleVolumeDropdown();
        }
      }
    });
    document.addEventListener('mouseup', event => {
      if (this.controlState.volumeSliderSelected) {
        this.$player.nativeElement.volume = this.controlState.volumeFilledPercent / 100
        this.toggleVolumeDropdown();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.which == 32) {
        if (this.currentSong.isPlaying) {
          this.pause();
        }
        else {
          this.play();
        }
      }
    });
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
    });

    this.controlState.volumeFilledPercent = this.$player.nativeElement.volume * 100;
  }

  async onSubmit() {
    this.formSubmitted = true;
    this.loading = true;

    if (this.$sineloader.nativeElement) {
      this.$sineloader.nativeElement.style.display = this.loading ? "initial": "none";
    }
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
    if (this._mediaService.apiKey) {
      localStorage.setItem('apiKey', this._mediaService.apiKey);
    }
    const song = await this._mediaService.getSong(0);
    this.currentSong.uri = song.uri;
    this.currentSong.metadata = song.metadata;
    this.$player.nativeElement.src = this.currentSong.uri;
    this.swapToAudioView();
    this.initialized = true;
    this.loading = false;

    if (this.$sineloader.nativeElement) {
      this.$sineloader.nativeElement.style.display = this.loading ? "initial": "none";
    }
  }

  swapToAudioView() {
    this.showAudio = true;
    this.showInput = false;
  }

  onSongsLoadError(err) {
    console.log(err);
    localStorage.removeItem('apiKey');
    this.errorMessage = "Could not retrieve songs.";
  }

  reinit() {
    this.showAudio = false;
    this.showInput = true;
    this.errorMessage = "";
    this.loading = false;

    if (this.$sineloader.nativeElement) {
      this.$sineloader.nativeElement.style.display = this.loading ? "initial": "none";
    }
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
    this.controlState.volumeSliderSelected = false;
  }

  toggleShuffle() {
    this.controlState.shuffle = !this.controlState.shuffle;
    //if (this.controlState.shuffle) {
    this._mediaService.shuffle();
    //}
  }

  volumeMouseDown(event) {
    this.controlState.volumeSliderSelected = true;
    this.changeVolume(event);
  }

  volumeMouseUp(event) {
    this.controlState.volumeSliderSelected = false;
    this.changeVolume(event);
  }

  changeVolume(event) {
    if (this.controlState.volumeSliderSelected) {
      const rect = this.$volumedropdown.nativeElement.getBoundingClientRect();
      const y = event.pageY - rect.y;
      this.controlState.volumeFilledPercent = 100 - (y * 100 / rect.height);
      this.$player.nativeElement.volume = Math.max(0, Math.min(this.controlState.volumeFilledPercent / 100, 1));
    }
  }

  keyPress(event) {
     if (event.key == 'a') {
      this.skipBackward();
    }
    else if (event.key == 'd') {
      this.skipForward();
    }
    else if (event.key == 's') {
      this.toggleShuffle();
    }
  }
}
