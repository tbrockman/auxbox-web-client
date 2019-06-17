import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment }             from './../environments/environment';
import fetchFileAsBuffer        from 'id3-parser/lib/universal';

@Injectable({
  providedIn: 'root'
})

export class MediaService {

  API_ENDPOINT   : string = "https://api.auxb0x.com";
  SONGS_ENDPOINT : string = "/songs";  
  API_KEY        : string = "";

  private _apiKey        : string;
  private _cookies       : {};
  private _currentIndex  : number = 0;
  private _httpClient    : HttpClient;
  private _httpOptions   : {};
  private _listener      : MediaServiceListener;
  private _songUrls      : string[];

  constructor(httpClient : HttpClient) {
    this._httpClient = httpClient;
  }
  
  set apiKey(apiKey : string) {
    this._apiKey = apiKey;
    this._httpOptions = {
      headers: new HttpHeaders({
        'X-Api-Key': apiKey
      }),
      withCredentials: true,
    };
  }

  async fetchSongs() {
    let response;
    try {
      if (!environment.production) {
        this._songUrls = ['/assets/10 Bands [Remix].mp3', 
                          '/assets/13 Youforia [Mac Miller].mp3', 
                          '/assets/2099 flow.mp3', 
                          '/assets/A Million Miles Away.mp3'];
      }
      else {
        response = await this._httpClient.get(this.API_ENDPOINT + this.SONGS_ENDPOINT, 
                                              this._httpOptions).toPromise();
        this._songUrls = response.tracks;
      }
      this.notifySongsLoaded();
    } catch (err) {
      console.error(err);
      this.notifySongsLoadError(err);
    }
    return response
  }

  async getSong(index : number) {
    const protocol = environment.production ? 'https://' : '';
    const uri = protocol + this._songUrls[index];
    const tag = await fetchFileAsBuffer(uri);
    let song = {
      uri: uri,
      metadata: tag
    };
    return song;
  }

  shuffle() {
    if (this._songUrls.length > 0) {
      let current = this._songUrls[this._currentIndex];
      let end = this._songUrls[this._songUrls.length - 1];
      this._songUrls[this._songUrls.length - 1] = current;
      this._songUrls[this._currentIndex] = end;
      this._currentIndex = this._songUrls.length - 1;
      shuffleArray(this._songUrls, 1);
    }
  }

  skipForward() {
    this._currentIndex = mod(this._currentIndex + 1, this._songUrls.length);
    this.getSong(this._currentIndex).then(song => {
      this.notifyPlaySong(song);
    })
  }

  skipBackward() {
    this._currentIndex = mod(this._currentIndex - 1, this._songUrls.length);
    this.getSong(this._currentIndex).then(song => {
      this.notifyPlaySong(song);
    })
  }

  notifyPlaySong(song) {
    if (this._listener) {
      //this._listener.onPlaySong("http://" + songUri);
      this._listener.onPlaySong(song);
    }
  }

  notifySongsLoadError(err) {
    if (this._listener) {
      this._listener.onSongsLoadError(err);
    }
  }

  notifySongsLoaded() {
    if (this._listener) {
      this._listener.onSongsLoad();
    }
  }

  registerListener(listener : MediaServiceListener) {
    this._listener = listener;
  }
}

export interface MediaServiceListener {
  onSongsLoad();
  onSongsLoadError(err : Object);
  onPlaySong(sonUri : String);
}

const shuffleArray = (array, endOffset = 0) => {
  for (var i = array.length - (1 + endOffset); i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

const mod = (n, m) => {
  return ((n % m) + m) % m;
}