import { DateTimeOriginal } from '../../shared/model/date-time-original';
import { Photo } from '../../shared/model/photo.model';
import { compareByShootingTime, compareNames, shootingTimeOf } from './dir-tree-view-sort-comparison';

function photo(dateTimeOriginal?: Date): Photo {
  return Object.assign(new Photo(), {
    name: 'IMG_0001.JPG', path: '/photos/IMG_0001.JPG', filenameExtension: '.jpg',
    exif: dateTimeOriginal ? { dateTimeOriginal: new DateTimeOriginal(dateTimeOriginal) } : null,
  });
}

describe('dir-tree-view-sort-comparison', () => {
  const taken = new Date(2019, 2, 16, 17, 29, 58);
  const modified = new Date(2024, 0, 2, 3, 4, 5);

  it('takes the time a photo was taken from DateTimeOriginal, else from the file\'s modified time', () => {
    expect(shootingTimeOf(photo(taken), modified)).toBe(taken.getTime());
    expect(shootingTimeOf(photo(), modified)).toBe(modified.getTime());
    // A file that is not a photo has only its modified time.
    expect(shootingTimeOf(null, modified)).toBe(modified.getTime());
  });

  it('orders names by their letters whatever their case, and gives 0 for the same name', () => {
    expect(compareNames('b.jpg', 'C.jpg')).toBeLessThan(0);
    expect(compareNames('C.jpg', 'b.jpg')).toBeGreaterThan(0);
    expect(compareNames('IMG_0001.JPG', 'img_0001.jpg')).toBe(0);
  });

  it('orders files by the time they were taken, and by name when they were taken at the same time', () => {
    const at = (shootingTime: number, name: string) => ({ shootingTime, name });

    expect(compareByShootingTime(at(1, 'b.jpg'), at(2, 'a.jpg'))).toBeLessThan(0);
    expect(compareByShootingTime(at(2, 'a.jpg'), at(1, 'b.jpg'))).toBeGreaterThan(0);
    expect(compareByShootingTime(at(1, 'a.jpg'), at(1, 'B.jpg'))).toBeLessThan(0);
    expect(compareByShootingTime(at(1, 'B.jpg'), at(1, 'a.jpg'))).toBeGreaterThan(0);
    expect(compareByShootingTime(at(1, 'a.jpg'), at(1, 'A.JPG'))).toBe(0);
  });
});
