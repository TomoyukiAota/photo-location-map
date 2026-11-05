import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelectModule } from '@angular/material/select';

import { DateTimeSettingsComponent } from './date-time-settings.component';

describe('DateTimeSettingsComponent', () => {
  let component: DateTimeSettingsComponent;
  let fixture: ComponentFixture<DateTimeSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DateTimeSettingsComponent ],
      imports: [
        MatSelectModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
