import { Component, OnInit, Input, SimpleChange } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-spacer',
  templateUrl: './spacer.component.html',
  styleUrls: ['./spacer.component.css'],
  animations: [
    trigger('expandSpacer', [
      // transition(':enter', [
      //   style({
      //     width: '0px'
      //   }),
      //   animate('1s', style({width: '700px'}))
      // ]), 
      transition(':enter', [
        style({
          width: '700px'
        }),
        animate('1s cubic-bezier(0.19, 1, 0.22, 1)', style({width: '0px'}))
      ])
    ])
  ],
})

export class SpacerComponent implements OnInit {

  @Input() showSpacer : boolean;

  constructor() { }

  ngOnInit() {
    console.log(this.showSpacer);
  }
}
