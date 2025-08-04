import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentLeadComponent } from './department-lead.component';

describe('DepartmentLeadComponent', () => {
  let component: DepartmentLeadComponent;
  let fixture: ComponentFixture<DepartmentLeadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DepartmentLeadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartmentLeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
