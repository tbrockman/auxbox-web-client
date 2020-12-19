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
})

export class SpacerComponent implements OnInit {

  @Input() showSpacer : boolean;

  constructor() { }

  ngOnInit() {
  }
}
