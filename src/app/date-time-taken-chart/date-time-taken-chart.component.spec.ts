import { TestBed } from '@angular/core/testing';
import { EChartsOption } from 'echarts';
import { DateTimeTakenChartComponent } from './date-time-taken-chart.component';

// TL;DR: ECharts 6 draws the chart with its own look, but for what the layout beside the chart needs, which the
// option keeps for the reasons in its comments.
// Details: The screenshots of the e2e suite would not find the ticks or the toolbox's colors gone: they are a few
// pixels of the window, fewer than a comparison allows to differ.
describe('DateTimeTakenChartComponent', () => {
  /** The option that the component gives ECharts. */
  function option(): EChartsOption {
    // Without the chart, which ECharts draws on a canvas, and with the column beside it, which the component measures.
    TestBed.overrideComponent(DateTimeTakenChartComponent, { set: { imports: [], template: '<div class="config"></div>' } });
    return TestBed.createComponent(DateTimeTakenChartComponent).componentInstance.eChartsOption();
  }

  it('keeps the toolbox in the row of the menu icon beside it, with the colors of that icon', () => {
    expect(option().toolbox).toMatchObject({
      padding: 5,
      itemGap: 8,
      iconStyle: { borderColor: '#666' },
      emphasis: { iconStyle: { borderColor: '#3E98C5' } },
    });
  });

  it('keeps the slider low enough for the labels of two lines of the x-axis', () => {
    expect(option().dataZoom).toMatchObject([{ type: 'inside' }, { type: 'slider', top: 'auto', bottom: 14 }]);
  });

  it('shows the ticks of the x-axis', () => {
    expect(option().xAxis).toMatchObject({ axisTick: { show: true, alignWithLabel: true } });
  });
});
