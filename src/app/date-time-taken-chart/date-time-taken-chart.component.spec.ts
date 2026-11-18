import { TestBed } from '@angular/core/testing';
import { EChartsOption } from 'echarts';
import { DateTimeTakenChartConfigService } from './config/date-time-taken-chart-config.service';
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

  it('zooms out without an event of its own when the zoom is reset from outside, and hides the button of the zoom', () => {
    TestBed.overrideComponent(DateTimeTakenChartComponent, { set: { imports: [], template: '<div class="config"></div>' } });
    const chart = TestBed.createComponent(DateTimeTakenChartComponent).componentInstance;
    const dispatchAction = vi.fn();
    chart.onChartInit({ dispatchAction });
    // As after a zoom, without the zoom's handler, which reads the chart's option a moment later.
    chart.isSelectPhotosWithinZoomButtonVisible.set(true);

    TestBed.inject(DateTimeTakenChartConfigService).resetZoomFromOutside();

    expect(dispatchAction).toHaveBeenCalledExactlyOnceWith({ type: 'restore' }, { silent: true });
    expect(chart.isSelectPhotosWithinZoomButtonVisible()).toBe(false);
  });

  it('drops a zoom that it was about to pin when the zoom is reset, from outside or with its Reset Zoom button', () => {
    TestBed.overrideComponent(DateTimeTakenChartComponent, { set: { imports: [], template: '<div class="config"></div>' } });
    const chart = TestBed.createComponent(DateTimeTakenChartComponent).componentInstance;
    const chartConfigService = TestBed.inject(DateTimeTakenChartConfigService);
    // The chart after the reset, which shows its whole axis: a zoom read from it would pin all of it.
    const getOption = vi.fn(() => ({ xAxis: [{ data: ['2013', '2019'] }], dataZoom: [{ startValue: 0, endValue: 1 }] }));
    chart.onChartInit({ dispatchAction: vi.fn(), getOption });
    vi.useFakeTimers();
    try {
      for (const reset of [() => chartConfigService.resetZoomFromOutside(), () => chart.onChartRestore()]) {
        chart.onChartDataZoom();
        reset();
        vi.advanceTimersByTime(1000);

        expect(getOption).not.toHaveBeenCalled();
        expect(chartConfigService.xValuesWithinZoom()).toBeNull();
        expect(chartConfigService.showDateUnknownPhotos()).toBe(true);
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
