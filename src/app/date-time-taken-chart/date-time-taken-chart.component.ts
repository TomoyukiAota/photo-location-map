import { Component } from '@angular/core';
import { EChartsOption } from 'echarts';
import { momentToDateString } from '../shared/moment-to-string';
import { Photo } from '../shared/model/photo.model';
import { PinnedPhotoService } from '../shared/service/pinned-photo.service';

@Component({
  selector: 'app-date-time-taken-chart',
  templateUrl: './date-time-taken-chart.component.html',
  styleUrls: ['./date-time-taken-chart.component.scss']
})
export class DateTimeTakenChartComponent {
  public chartOption: EChartsOption;

  constructor(private pinnedPhotoService: PinnedPhotoService) {
    this.pinnedPhotoService.pinnedPhotos.subscribe(photos => {
      this.setChartOption(photos);
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
        boundaryGap: false,
        data: date
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

  public onChartDataZoom(event: any) {
    console.log('onChartDataZoom', event);
  }

  public onChartRestore(event: any) {
    console.log('onChartRestore', event);
  }
}
