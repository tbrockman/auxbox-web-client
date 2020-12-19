import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SineLoaderComponent } from './sine-loader.component';

describe('SineLoaderComponent', () => {
  let component: SineLoaderComponent;
  let fixture: ComponentFixture<SineLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SineLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SineLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
