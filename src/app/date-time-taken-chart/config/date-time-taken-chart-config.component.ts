import { Component } from '@angular/core';

@Component({
  selector: 'app-date-time-taken-chart-config',
  templateUrl: './date-time-taken-chart-config.component.html',
  styleUrls: ['./date-time-taken-chart-config.component.scss']
})
export class DateTimeTakenChartConfigComponent {
  public xAxisUnits: string[] = [ 'Year', 'Month', 'Day' ];
  public selectedXAxisUnit = this.xAxisUnits[2];

  public onXAxisUnitChange(event: any) {
    console.log(event);
  }
}
