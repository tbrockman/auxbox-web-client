import { Injectable }              from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer }            from '@angular/platform-browser';
import { environment }             from './../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class MediaService {

  API_ENDPOINT   : string = "https://api.auxb0x.com";
  SONGS_ENDPOINT : string = this.API_ENDPOINT + "/songs";  
  API_KEY        : string = "";

  private _apiKey        : string;
  private _cookies       : {};
  private _currentIndex  : number = 0;
  private _domSanitizer  : DomSanitizer;
  private _httpClient    : HttpClient;
  private _httpOptions   : {};
  private _listener      : MediaServiceListener;
  private _songUrls      : string[];

  constructor(httpClient : HttpClient, domSanitizer: DomSanitizer) {
    this._httpClient = httpClient;
    this._domSanitizer = domSanitizer;
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
        this._songUrls = ['https://auxbox-public.s3-us-west-2.amazonaws.com/Nat Port - Sydney.mp3',
                          'https://auxbox-public.s3-us-west-2.amazonaws.com/Nat Port - Futurebeats Minimix 01.mp3', 
                          'https://auxbox-public.s3-us-west-2.amazonaws.com/Nat Port - ftc171.mp3', 
                          'https://auxbox-public.s3-us-west-2.amazonaws.com/Nat Port - ftc173.mp3'];
      }
      else {
        response = await this._httpClient.get(this.SONGS_ENDPOINT, 
                                              this._httpOptions)
                                          .toPromise();
        this._songUrls = response.tracks;
      }
      this.notifySongsLoaded();
    } catch (err) {
      console.error(err);
      this.notifySongsLoadError(err);
    }
    return response
  }

  async getSongTag(filename) {
    const options = {
      headers: new HttpHeaders({
        'X-Api-Key': this._apiKey
      })
    }
    const uri = this.SONGS_ENDPOINT + '/' + filename;
    const encoded = encodeURI(uri);
    const response = await this._httpClient.get(encoded, options)
                                           .toPromise();
    return response;
  }

  async getSong(index : number) {
    const protocol = environment.production ? 'https://' : '';
    const split = this._songUrls[index].split('/');
    const filename = split[split.length - 1];
    const uri = protocol + this._songUrls[index];
    const tag = await this.getSongTag(filename);

    let song = {
      uri: uri,
      metadata: tag,
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