import { Component } from '@angular/core';
import { ECharts, EChartsOption } from 'echarts';
import { momentToDateString } from '../shared/moment-to-string';
import { Photo } from '../shared/model/photo.model';
import { PinnedPhotoService } from '../shared/service/pinned-photo.service';
import { SelectedPhotoService } from '../shared/service/selected-photo.service';

@Component({
  selector: 'app-date-time-taken-chart',
  templateUrl: './date-time-taken-chart.component.html',
  styleUrls: ['./date-time-taken-chart.component.scss']
})
export class DateTimeTakenChartComponent {
  public eChartsOption: EChartsOption;
  private echartsInstance: ECharts;

  constructor(private pinnedPhotoService: PinnedPhotoService,
              private selectedPhotoService: SelectedPhotoService) {
    this.selectedPhotoService.selectedPhotos.subscribe(photos => {
      this.setEChartsOption(photos);
      this.pinnedPhotoService.setPinnedPhotos(photos);
    });
  }

  private setEChartsOption(pinnedPhotos: Photo[]): void {
    const {xData, yData} = this.createXYData(pinnedPhotos);
    const option = this.createEChartsOption(xData, yData);
    this.eChartsOption = option;
  }

  private createXYData(pinnedPhotos: Photo[]): {xData: string[], yData: number[]} {
    const photosWithDateTime = pinnedPhotos.filter(photo => photo?.exif?.dateTimeOriginal);
    if (photosWithDateTime.length === 0) {
      return {xData: [], yData: []}; // Results in the chart without data
    }

    const moments = photosWithDateTime.map(photo => photo.exif.dateTimeOriginal.moment.clone()); // Cloned to be sure of not modifying original ones
    const sortedMoments = moments.sort((a, b) => a.diff(b));
    const firstMoment = sortedMoments[0];
    const lastMoment = sortedMoments[sortedMoments.length - 1];
    const loopLimitMoment = lastMoment.clone().add(1, 'day');
    const bins = new Map<string, number>();
    for(let tempMoment = firstMoment.clone(); tempMoment.isBefore(loopLimitMoment, 'day'); tempMoment.add(1, 'day')) {
      const dateString = momentToDateString(tempMoment, {dayOfWeek: false});
      bins.set(dateString, 0);
    }
    sortedMoments.forEach(tempMoment => {
      const dateString = momentToDateString(tempMoment, {dayOfWeek: false});
      if (bins.has(dateString)) {
        const previous = bins.get(dateString);
        bins.set(dateString, previous + 1);
      }
    });
    const xData = Array.from(bins.keys());
    const yData = Array.from(bins.values());
    return {xData, yData};
  }

  private createEChartsOption(xData: string[], yData: number[]) {
    const option: EChartsOption = {
      grid: {
        top: 25,
        bottom: 70,
        left: 90,
        right: 110,
      },
      tooltip: {
        trigger: 'axis',
        position: function (pt) {
          return [pt[0], '10%'];
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            icon: {
              back: 'Invalid path' // Set to invalid path to hide Zoom Reset button. See https://stackoverflow.com/a/74459890/7947548
            },
            yAxisIndex: 'none'
          },
          restore: {},
        }
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisTick: {
          alignWithLabel: true,
        }
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '100%']
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          type: 'bar',
          sampling: 'lttb',
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

  public onChartDataZoom() {
    const xValuesWithinZoom = this.getXValuesWithinZoom();
    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    const pinnedPhotos = selectedPhotos.filter(photo => {
      const dateTimeOriginal = photo.exif?.dateTimeOriginal;
      if (!dateTimeOriginal) { return false; } // When zoomed, the photos without the date taken are not pinned on the map.
      const dateString = dateTimeOriginal.toDateString({dayOfWeek: false});
      return xValuesWithinZoom.includes(dateString);
    });
    this.pinnedPhotoService.setPinnedPhotos(pinnedPhotos);
  }

  private getXValuesWithinZoom(): string[] {
    // Reference: https://stackoverflow.com/a/76429536/7947548
    const option = this.echartsInstance.getOption();
    const xValuesWithinZoom = option.xAxis[0].data.slice(option.dataZoom[0].startValue, option.dataZoom[0].endValue + 1);
    return xValuesWithinZoom;
  }

  public onChartRestore() {
    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    this.pinnedPhotoService.setPinnedPhotos(selectedPhotos);
  }
}
