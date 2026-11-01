import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ECharts, EChartsOption } from 'echarts';
import * as _ from 'lodash';
import { Moment, unitOfTime } from 'moment';
import { Analytics } from '../../../src-shared/analytics/analytics';
import { Photo } from '../shared/model/photo.model';
import { PinnedPhotoService } from '../shared/service/pinned-photo.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';
import { momentToStringMap } from '../shared/moment-to-string-map';
import { DateTimeTakenChartConfigService } from './config/date-time-taken-chart-config.service';
import { xAxisUnit } from './config/date-time-taken-chart-x-axis-unit';
import { dateTimeTakenChartLogger as logger } from './date-time-taken-chart-logger';

@Component({
  selector: 'app-date-time-taken-chart',
  templateUrl: './date-time-taken-chart.component.html',
  styleUrls: ['./date-time-taken-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DateTimeTakenChartComponent {
  public eChartsOption: EChartsOption;
  private echartsInstance: ECharts;
  private xAxisUnit = xAxisUnit.day.momentJsStr;
  public isSupportedDuration = true;
  private momentToString = momentToStringMap.get('day');
  public isSelectPhotosWithinZoomButtonVisible = false;

  constructor(private chartConfigService: DateTimeTakenChartConfigService,
              private pinnedPhotoService: PinnedPhotoService,
              private selectedPhotoService: SelectedPhotoService) {
    this.selectedPhotoService.selectedPhotos.subscribe(selectedPhotos => {
      this.handleSelectedPhotosChanged(selectedPhotos);
    });
    this.chartConfigService.showDateUnknownPhotos.subscribe(showDateUnknownPhotos => {
      this.handleShowDateUnknownPhotosChanged(showDateUnknownPhotos);
    });
    this.chartConfigService.xAxisUnitMomentJsStr.subscribe(xAxisUnitMomentJsStr => {
      this.handleXUnitChanged(xAxisUnitMomentJsStr);
    });
  }

  private handleSelectedPhotosChanged(selectedPhotos: Photo[]) {
    this.setEChartsOption(selectedPhotos);
    this.pinnedPhotoService.setPinnedPhotos(selectedPhotos);
    this.chartConfigService.showDateUnknownPhotos.next(true);
    this.isSelectPhotosWithinZoomButtonVisible = false;
  }

  private setEChartsOption(pinnedPhotos: Photo[]): void {
    const {xData, yData} = this.createXYData(pinnedPhotos);
    const option = this.createEChartsOption(xData, yData);
    this.eChartsOption = option;
  }

  private createXYData(pinnedPhotos: Photo[]): {xData: string[], yData: number[]} {
    const photosWithDateTime = pinnedPhotos.filter(photo => photo?.exif?.dateTimeOriginal);
    if (photosWithDateTime.length === 0) {
      this.isSupportedDuration = true; // Remove the unsupported duration message
      return {xData: [], yData: []};   // Results in the chart without data
    }

    const moments = photosWithDateTime.map(photo => photo.exif.dateTimeOriginal.moment.clone()); // Cloned to be sure of not modifying original ones
    const sortedMoments = moments.sort((a, b) => a.diff(b));
    const firstMoment = sortedMoments[0];
    const lastMoment = sortedMoments[sortedMoments.length - 1];

    this.isSupportedDuration = this.testIfSupportedDuration(firstMoment, lastMoment);
    if(!this.isSupportedDuration) {
      return {xData: [], yData: []}; // Results in the chart without data
    }

    const loopLimitMoment = lastMoment.clone().add(1, this.xAxisUnit);
    const bins = new Map<string, number>(); // <string, number> as (x, y) coordinate in the chart.
    for(let tempMoment = firstMoment.clone(); tempMoment.isBefore(loopLimitMoment, this.xAxisUnit); tempMoment.add(1, this.xAxisUnit)) {
      const xValue = this.momentToString(tempMoment);
      bins.set(xValue, 0); // Initialize the bin with (x, y) = (xValue, 0)
    }
    sortedMoments.forEach(sortedMoment => {
      const momentString = this.momentToString(sortedMoment);
      if (bins.has(momentString)) {
        const xValue = momentString;
        let yValue = bins.get(xValue);
        yValue++;
        bins.set(xValue, yValue);
      }
    });
    const xData = Array.from(bins.keys());
    const yData = Array.from(bins.values());
    return {xData, yData};
  }

  private testIfSupportedDuration(firstMoment: Moment, lastMoment: Moment): boolean {
    if (this.xAxisUnit === xAxisUnit.hour.momentJsStr) {
      return lastMoment.diff(firstMoment, 'day') <= 30;
    }
    if (this.xAxisUnit === xAxisUnit.minute.momentJsStr) {
      return lastMoment.diff(firstMoment, 'day') <= 3;
    }
    if (this.xAxisUnit === xAxisUnit.second.momentJsStr) {
      return lastMoment.diff(firstMoment, 'hour') <= 1;
    }
    return true;
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
            icon: {
              back: 'Invalid path' // Set to invalid path to hide Zoom Reset button provided by ECharts. See https://stackoverflow.com/a/74459890/7947548
            },
            yAxisIndex: 'none'
          },
          restore: {
            title: 'Reset\nZoom'  // Show Restore button provided by ECharts as Reset Zoom button.
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
    this.isSelectPhotosWithinZoomButtonVisible = true;
  }

  private onChartDataZoomWithDebouncing = _.debounce(() => {
    logger.info('Chart Data Zoom');
    const xValuesWithinZoom = this.getXValuesWithinZoom();
    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    const pinnedPhotos = selectedPhotos.filter(photo => {
      const dateTimeOriginal = photo.exif?.dateTimeOriginal;
      if (!dateTimeOriginal) { return false; } // When zoomed, the photos without the date taken are not pinned on the map.
      const momentString = this.momentToString(dateTimeOriginal.moment);
      return xValuesWithinZoom.includes(momentString);
    });
    this.pinnedPhotoService.setPinnedPhotos(pinnedPhotos);
    this.chartConfigService.showDateUnknownPhotos.next(false);
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

    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    this.pinnedPhotoService.setPinnedPhotos(selectedPhotos);
    this.chartConfigService.showDateUnknownPhotos.next(true);
    this.isSelectPhotosWithinZoomButtonVisible = false;
  }

  private handleShowDateUnknownPhotosChanged(showDateUnknownPhotos: boolean) {
    const previousPinnedPhotos = this.pinnedPhotoService.getPinnedPhotos();
    if (showDateUnknownPhotos) {
      const previousPinnedPhotoPaths = previousPinnedPhotos.map(photo => photo.path);
      const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
      const dateUnknownPhotos = selectedPhotos.filter(photo => !photo.exif?.dateTimeOriginal);
      const photosToAdd = dateUnknownPhotos.filter(dateUnknownPhoto => !previousPinnedPhotoPaths.includes(dateUnknownPhoto.path));
      const nextPinnedPhotos = [...previousPinnedPhotos, ...photosToAdd];
      this.pinnedPhotoService.setPinnedPhotos(nextPinnedPhotos);
    } else {
      const dateKnownPinnedPhotos = previousPinnedPhotos.filter(photo => !!photo.exif?.dateTimeOriginal);
      this.pinnedPhotoService.setPinnedPhotos(dateKnownPinnedPhotos);
    }
  }

  private handleXUnitChanged(xAxisUnitMomentJsStr: unitOfTime.DurationConstructor) {
    this.xAxisUnit = xAxisUnitMomentJsStr;
    this.momentToString = momentToStringMap.get(this.xAxisUnit);
    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    this.setEChartsOption(selectedPhotos);
    this.pinnedPhotoService.setPinnedPhotos(selectedPhotos);
    this.chartConfigService.showDateUnknownPhotos.next(true);
    this.isSelectPhotosWithinZoomButtonVisible = false;
  }
}
