import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';

import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';

import { DirectoryTreeViewComponent } from './directory-tree-view.component';

@Component({ selector: 'app-dir-tree-view-tooltip', template: '' })
class DummyDirTreeViewTooltipComponent {
  @Input() public photoPath: string;
}

describe('DirectoryTreeViewComponent', () => {
  let component: DirectoryTreeViewComponent;
  let fixture: ComponentFixture<DirectoryTreeViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DirectoryTreeViewComponent,
        DummyDirTreeViewTooltipComponent
      ],
      imports: [
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatTreeModule
      ],
      providers: [
        DirectoryTreeViewDataService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DirectoryTreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
