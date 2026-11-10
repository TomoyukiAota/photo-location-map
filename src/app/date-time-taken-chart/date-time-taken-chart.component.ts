import { afterNextRender, Component, computed, ElementRef, inject, linkedSignal } from '@angular/core';
import { ECharts, EChartsOption } from 'echarts';
import * as _ from 'lodash';
import { unitOfTime } from 'moment';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { t } from '../../../src-shared/i18n/i18n';
import { TranslatePipe } from '../shared/i18n/translate.pipe';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { DateTimeTakenChartConfigService } from './config/date-time-taken-chart-config.service';
import { createDateTimeTakenChartData } from './date-time-taken-chart-data';
import { dateTimeTakenChartLogger as logger } from './date-time-taken-chart-logger';
import { NgxEchartsDirective } from 'ngx-echarts';
import { DateTimeTakenChartConfigComponent } from './config/date-time-taken-chart-config.component';
import { SelectPhotosWithinZoomComponent } from './select-photos-within-zoom/select-photos-within-zoom.component';

@Component({
  selector: 'app-date-time-taken-chart',
  templateUrl: './date-time-taken-chart.component.html',
  styleUrls: ['./date-time-taken-chart.component.scss'],
  imports: [NgxEchartsDirective, DateTimeTakenChartConfigComponent, SelectPhotosWithinZoomComponent, TranslatePipe]
})
export class DateTimeTakenChartComponent {
  private chartConfigService = inject(DateTimeTakenChartConfigService);
  private selectedPhotoService = inject(SelectedPhotoService);

  private readonly chartData = computed(() =>
    createDateTimeTakenChartData(this.selectedPhotoService.selectedPhotos(), this.chartConfigService.xAxisUnit()));
  public readonly eChartsOption = computed(() => this.createEChartsOption(this.chartData().xData, this.chartData().yData));
  public readonly isSupportedDuration = computed(() => this.chartData().isSupportedDuration);
  // Shown from a zoom on, until its reset or until the chart draws again, which ends the zoom.
  public readonly isSelectPhotosWithinZoomButtonVisible = linkedSignal({
    source: this.chartConfigService.chartRedrawn,
    computation: () => false,
  });
  private echartsInstance: ECharts;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // TL;DR: The column beside the chart is as wide as the chart's unit needs in the application's language.
    // Details: The unit is a select, which is as wide as its longest option, and "Δευτερόλεπτο", a second in Greek,
    // is twice as wide as "Second". In a column of 130px, which fits English, a wider select pushed the icon of the
    // menu beside it over the chart's Zoom buttons. The column gets its width as a number rather than from its
    // contents by the layout, with which the chart was intermittently drawn wrong when a splitter was dragged (see
    // the styles).
    afterNextRender(() => {
      const config = host.querySelector<HTMLElement>('.config');
      const marginBesideConfig = 10;
      const needed = Math.ceil(config.getBoundingClientRect().width) + marginBesideConfig;
      const widthInEnglish = 130;
      if (needed > widthInEnglish)
        host.style.setProperty('--chart-sidebar-width', `${needed}px`);
    });
  }

  private createEChartsOption(xData: string[], yData: number[]) {
    const option: EChartsOption = {
      grid: {
        outerBoundsMode: 'none', // Preserve the v5 layout rather than moving axes to prevent overflow.
        top: 25,
        bottom: 80,
        left: 90,
        right: 90,
      },
      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        }
      },
      toolbox: {
        itemSize: 20,
        top: 4,
        right: 0,
        padding: 5,
        itemGap: 8,
        iconStyle: { borderColor: '#666', color: 'none' },
        emphasis: { iconStyle: { borderColor: '#3E98C5' } },
        feature: {
          dataZoom: {
            // The button's tooltip, which ECharts would give in English ("Zoom") whatever the language.
            title: { zoom: t('chart.zoom') },
            icon: {
              back: 'Invalid path' // Set to invalid path to hide Zoom Reset button provided by ECharts. See https://stackoverflow.com/a/74459890/7947548
            },
            yAxisIndex: 'none'
          },
          restore: {
            title: t('chart.resetZoom')  // Show Restore button provided by ECharts as Reset Zoom button.
          },
        }
      },
      xAxis: {
        type: 'category',
        nameMoveOverlap: false,
        data: xData,
        axisLabel: {
          formatter: (value: string) => {
            return value.replace(' ', '\n'); // Add a line break between date and time.
          },
        },
        axisTick: {
          alignWithLabel: true,
        }
      },
      yAxis: {
        type: 'value',
        nameMoveOverlap: false,
        minInterval: 1,   // Make sure Y-axis label is shown as integer.
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          // Pin the component defaults that changed with the v6 style tokens.
          top: 'auto',
          bottom: 14, // The v5 7px edge gap plus its 7px move handle.
          borderColor: '#d2dbee',
          borderRadius: 3,
          backgroundColor: 'rgba(47,69,84,0)',
          dataBackground: {
            lineStyle: { color: '#d2dbee', width: 0.5 },
            areaStyle: { color: '#d2dbee', opacity: 0.2 },
          },
          selectedDataBackground: {
            lineStyle: { color: '#8fb0f7', width: 0.5 },
            areaStyle: { color: '#8fb0f7', opacity: 0.2 },
          },
          handleStyle: { color: '#fff', borderColor: '#ACB8D1' },
          moveHandleStyle: { color: '#D2DBEE', opacity: 0.7 },
          textStyle: { color: '#6E7079' },
          brushStyle: { color: 'rgba(135,175,274,0.15)', opacity: 1 },
          emphasis: {
            handleStyle: { borderColor: '#8FB0F7' },
            moveHandleStyle: { color: '#8FB0F7', opacity: 0.7 },
          },
          labelFormatter: (_, valueStr) => {
            return valueStr.replace(' ', '\n'); // Add a line break between date and time.
          },
        }
      ],
      series: [
        {
          type: 'bar',
          sampling: 'lttb',
          cursor: 'default',
          itemStyle: {
            color: 'rgb(255, 70, 131)'
          },
          data: yData
        }
      ]
    };
    return option;
  }

  public onChartInit($event: any) {
    this.echartsInstance = $event;
  }

  // onChartDataZoom function needs debouncing because it's called frequently when the user is changing zoom.
  public onChartDataZoom() {
    this.onChartDataZoomWithDebouncing();
    this.trackChartDataZoomWithDebouncing();
    this.isSelectPhotosWithinZoomButtonVisible.set(true);
  }

  /** Pins the selected photos taken within the zoom window, without the photos that have no shooting time. */
  private onChartDataZoomWithDebouncing = _.debounce(() => {
    logger.info('Chart Data Zoom');
    this.chartConfigService.zoom(this.getXValuesWithinZoom());
  }, 300 /* ms */);

  private getXValuesWithinZoom(): string[] {
    // Reference: https://stackoverflow.com/a/76429536/7947548
    const option = this.echartsInstance.getOption();
    const xValuesWithinZoom = option.xAxis[0].data.slice(option.dataZoom[0].startValue, option.dataZoom[0].endValue + 1);
    return xValuesWithinZoom;
  }

  private trackChartDataZoomWithDebouncing = _.debounce(() => {
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Chart Data Zoom`);
  }, 2000 /* ms */); // Longer duration for debouncing compared to updating pinned photos because tracking data shouldn't be sent too frequently.

  public onChartRestore() {
    logger.info(`Restore`);
    Analytics.trackEvent('DTT Chart', `[DTT Chart] Restore`);

    this.chartConfigService.resetZoom();
    this.isSelectPhotosWithinZoomButtonVisible.set(false);
  }

  /** The chart menu's checkbox for the photos without a shooting time changed: they are pinned, or no longer. */
  public onShowDateUnknownPhotosChanged(showDateUnknownPhotos: boolean) {
    this.chartConfigService.setShowDateUnknownPhotos(showDateUnknownPhotos);
  }

  /**
   * The unit of the chart's x-axis changed: the chart draws again with it, which ends the zoom, and every selected photo
   * is pinned (DateTimeTakenChartConfigService.chartRedrawn).
   */
  public onXAxisUnitChanged(xAxisUnit: unitOfTime.DurationConstructor) {
    this.chartConfigService.setXAxisUnit(xAxisUnit);
  }
}
