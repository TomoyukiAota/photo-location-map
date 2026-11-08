import { addEachMarker } from './add-each-marker';

describe('addEachMarker', () => {
  it('adds the marker of every photo after one whose marker throws, and reports that one', () => {
    const added: string[] = [];
    const errors: [unknown, string][] = [];
    const error = new Error('Invalid LatLng object: (NaNNaN, NaNNaN)');

    addEachMarker(['first', 'malformed', 'last'],
      photo => {
        if (photo === 'malformed') throw error;
        added.push(photo);
      },
      (thrown, photo) => errors.push([thrown, photo]));

    expect(added).toEqual(['first', 'last']);
    expect(errors).toEqual([[error, 'malformed']]);
  });

  it('reports nothing when every marker is added', () => {
    const onError = vi.fn();
    addEachMarker(['a', 'b'], () => undefined, onError);
    expect(onError).not.toHaveBeenCalled();
  });
});
