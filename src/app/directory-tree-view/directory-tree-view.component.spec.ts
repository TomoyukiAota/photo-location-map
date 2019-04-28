import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTreeModule } from '@angular/material';

import { DirectoryTreeViewDataService } from './directory-tree-view-data.service';

import { DirectoryTreeViewComponent } from './directory-tree-view.component';

describe('DirectoryTreeViewComponent', () => {
  let component: DirectoryTreeViewComponent;
  let fixture: ComponentFixture<DirectoryTreeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DirectoryTreeViewComponent
      ],
      imports: [
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
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
