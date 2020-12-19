import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-sine-loader',
  templateUrl: './sine-loader.component.html',
  styleUrls: ['./sine-loader.component.css']
})


export class SineLoaderComponent implements OnInit {

  step = -4
  @ViewChild('canvas', { static: false }) $canvas : ElementRef;
  @Input() showLoader: boolean;

  constructor() {
    this.step = -4;
    this.draw = this.draw.bind(this);
  }

  plotSine(ctx, xOffset, yOffset) {
      var width = ctx.canvas.width;
      var height = ctx.canvas.height;

      ctx.beginPath();
      ctx.lineWidth = 16;
      ctx.strokeStyle = "rgb(250,72,75)";
      
      var x = 15;
      var y = 0;
      var amplitude = 60;
      var frequency = 20;
      //ctx.moveTo(x, y);
      y = height/2 + amplitude * Math.sin((x+xOffset)/frequency) + yOffset;

      ctx.moveTo(x, y);
      
      while (x < width - 10) {
          y = height/2 + amplitude * Math.sin((x+xOffset)/frequency) + yOffset;
          ctx.lineTo(x, y);
          x++;
      }
      ctx.stroke();
      ctx.save();
      ctx.restore();
  }

  draw() {
    var canvas = <HTMLCanvasElement> this.$canvas.nativeElement;
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, 500, 500);
    context.save();
    
    this.plotSine(context, this.step, 0);
    context.restore();
    
    this.step += 6;
    window.requestAnimationFrame(this.draw);
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log('here??')
    console.log(this.showLoader)
    window.requestAnimationFrame(this.draw);
  }
}
