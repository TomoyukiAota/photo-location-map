import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { DirTreeViewTooltipComponent } from './dir-tree-view-tooltip.component';

describe('DirTreeViewTooltipComponent', () => {
  let component: DirTreeViewTooltipComponent;
  let fixture: ComponentFixture<DirTreeViewTooltipComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DirTreeViewTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DirTreeViewTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
