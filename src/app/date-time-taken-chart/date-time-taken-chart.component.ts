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
  public chartOption: EChartsOption;
  private echartsInstance: ECharts;

  constructor(private pinnedPhotoService: PinnedPhotoService,
              private selectedPhotoService: SelectedPhotoService) {
    this.selectedPhotoService.selectedPhotos.subscribe(photos => {
      this.setChartOption(photos);
      this.pinnedPhotoService.setPinnedPhotos(photos);
    });
  }

  public setChartOption(pinnedPhotos: Photo[]): void {
    const photosWithDateTime = pinnedPhotos.filter(photo => photo?.exif?.dateTimeOriginal);
    if (photosWithDateTime.length === 0) {
      return;
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
    const date = Array.from(bins.keys());
    const data = Array.from(bins.values());

    const option: EChartsOption = {
      grid: {
        top: 30,
        bottom: 70,
        left: 60,
        right: 40,
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
            yAxisIndex: 'none'
          },
          restore: {},
        }
      },
      xAxis: {
        type: 'category',
        data: date,
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
          data: data
        }
      ]
    };

    this.chartOption = option;
  }

  public onChartInit($event: any) {
    this.echartsInstance = $event;
  }

  public onChartDataZoom() {
    const xValuesWithinZoom = this.getXValuesWithinZoom();
    const selectedPhotos = this.selectedPhotoService.getSelectedPhotos();
    const pinnedPhotos = selectedPhotos.filter(photo => {
      const dateString = photo.exif.dateTimeOriginal.toDateString({dayOfWeek: false});
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

  public onChartRestore(event: any) {
    console.log('onChartRestore', event);
  }
}
