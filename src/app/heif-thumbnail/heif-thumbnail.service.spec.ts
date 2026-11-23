import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThumbnailQuality } from '../../../src-shared/user-settings/thumbnail-quality';
import { GeneratedThumbnailService } from '../photo-info-viewer/generated-thumbnail.service';
import { ThumbnailSizeService } from '../shared/thumbnail-size/thumbnail-size.service';
import { ThumbnailGenerationService } from '../thumbnail-generation/service/thumbnail-generation.service';
import { HeifImageSource } from './heif-image-source';
import { HeifThumbnailService } from './heif-thumbnail.service';

/** A promise with its resolve, for an image that a test hands over when it chooses. */
function held<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve: (value: T) => resolve(value) };
}

/** Lets every pending promise settle. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('HeifThumbnailService', () => {
  let service: HeifThumbnailService;
  /** What the page makes of each photo: the small thumbnail and the whole image, by the photo's path. */
  let smallThumbnails: Map<string, Promise<Blob | null>>;
  let wholeImages: Map<string, Promise<Blob | null>>;
  let made: string[];
  /** What the main process has made, by the photo's path, and the photos that it could not make. */
  const generatedFiles = signal<ReadonlyMap<string, string>>(new Map());
  const failedFiles = signal<ReadonlySet<string>>(new Set());
  let generation: { isCached: ReturnType<typeof vi.fn>, isMade: ReturnType<typeof vi.fn>, generate: ReturnType<typeof vi.fn>, applyThumbnailSettings: ReturnType<typeof vi.fn> };
  let generated: { watch: ReturnType<typeof vi.fn>, reset: ReturnType<typeof vi.fn> };
  let urls: number;
  let revoked: string[];
  /** The settings, as ThumbnailSizeService has them, and the sizes that the whole images were made at. */
  let quality: ReturnType<typeof signal<ThumbnailQuality>>;
  let size: ReturnType<typeof signal<number>>;
  let wholeImageSizes: number[];

  beforeEach(() => {
    quality = signal<ThumbnailQuality>('high');
    size = signal(400);
    wholeImageSizes = [];
    smallThumbnails = new Map();
    wholeImages = new Map();
    made = [];
    generatedFiles.set(new Map());
    failedFiles.set(new Set());
    urls = 0;
    revoked = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:test/${++urls}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(url => { revoked.push(url); });
    generation = { isCached: vi.fn(() => false), isMade: vi.fn(() => false), generate: vi.fn(), applyThumbnailSettings: vi.fn(async () => false) };
    generated = { watch: vi.fn(), reset: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HeifImageSource,
          useValue: {
            pageDecodesHevc: async () => true,
            embeddedThumbnail: (path: string) => { made.push(`small ${path}`); return smallThumbnails.get(path) ?? Promise.resolve(null); },
            wholeImage: (path: string, longerSide: number) => {
              made.push(`whole ${path}`);
              wholeImageSizes.push(longerSide);
              return wholeImages.get(path) ?? Promise.resolve(null);
            },
          },
        },
        { provide: ThumbnailGenerationService, useValue: generation },
        {
          provide: GeneratedThumbnailService,
          useValue: {
            ...generated, filePathOf: (path: string) => generatedFiles().get(path), hasFailed: (path: string) => failedFiles().has(path),
            longerSideOf: (path: string) => generatedFiles().has(path) ? 400 : undefined,
          },
        },
        { provide: ThumbnailSizeService, useValue: { quality, longerSide: computed(() => quality() === 'high' ? size() : 400) } },
      ],
    });
    service = TestBed.inject(HeifThumbnailService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const small = () => Promise.resolve(new Blob(['small']));
  const whole = () => Promise.resolve(new Blob(['whole']));

  it('shows the small thumbnail at once, then the one of high quality, and lets the small one go', async () => {
    quality.set('high');
    smallThumbnails.set('/a.heic', small());
    const wholeImage = held<Blob | null>();
    wholeImages.set('/a.heic', wholeImage.promise);
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'pending', provisionalUrl: null });

    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'pending', provisionalUrl: 'blob:test/1' });

    wholeImage.resolve(new Blob(['whole']));
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/2' });
    expect(revoked).toEqual(['blob:test/1']);
    expect(service.isFinished('/a.heic')).toBe(true);
  });

  it('keeps the small thumbnail for the fast quality, without decoding the whole image', async () => {
    quality.set('fast');
    smallThumbnails.set('/a.heic', small());
    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/1' });
    expect(made).toEqual(['small /a.heic']);
  });

  it('makes the thumbnail of the whole image, of a photo without a small one, in the fast quality too', async () => {
    quality.set('fast');
    wholeImages.set('/a.heic', whole());
    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/1' });
    expect(made).toEqual(['small /a.heic', 'whole /a.heic']);
  });

  it('has the main process make the thumbnail that the page cannot, and shows it once made', async () => {
    quality.set('high');
    smallThumbnails.set('/a.heic', small());
    service.watch('/a.heic');
    await settle();
    expect(generation.generate).toHaveBeenCalledExactlyOnceWith('/a.heic');
    expect(generated.watch).toHaveBeenCalledExactlyOnceWith('/a.heic');
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'pending', provisionalUrl: 'blob:test/1' });

    generatedFiles.set(new Map([['/a.heic', '/cache/a.heic.plm.jpg']]));
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'generated', filePath: '/cache/a.heic.plm.jpg', longerSide: 400 });
  });

  it('keeps the small thumbnail when the main process could not make one', async () => {
    smallThumbnails.set('/a.heic', small());
    service.watch('/a.heic');
    await settle();
    generatedFiles.set(new Map([['/a.heic', '/cache/a.heic.plm.jpg']]));
    failedFiles.set(new Set(['/a.heic']));
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/1' });
  });

  it('shows a thumbnail of the cache as it is, and one that the main process makes of the folder once made', async () => {
    generation.isCached.mockImplementation((path: string) => path === '/cached.heic');
    generation.isMade.mockImplementation((path: string) => path === '/made.heic');
    smallThumbnails.set('/made.heic', small());
    service.watch('/cached.heic');
    service.watch('/made.heic');
    await settle();
    expect(made).toEqual(['small /made.heic']);
    expect(generated.watch.mock.calls).toEqual([['/cached.heic'], ['/made.heic']]);
    expect(generation.generate).not.toHaveBeenCalled();
    expect(service.stateOf('/made.heic')).toEqual({ kind: 'pending', provisionalUrl: 'blob:test/1' });
  });

  it('makes the small thumbnails before the whole images, the photo asked for last first, two at a time', async () => {
    quality.set('high');
    const [a, b] = [held<Blob | null>(), held<Blob | null>()];
    smallThumbnails.set('/a.heic', a.promise).set('/b.heic', b.promise);
    for (const path of ['/a.heic', '/b.heic', '/c.heic', '/d.heic', '/a.heic'])
      service.watch(path);
    await settle();
    expect(made).toEqual(['small /a.heic', 'small /b.heic']);

    a.resolve(new Blob(['small']));
    await settle();
    b.resolve(new Blob(['small']));
    await settle();
    expect(made.slice(0, 4)).toEqual(['small /a.heic', 'small /b.heic', 'small /d.heic', 'small /c.heic']);
    expect(made.slice(4).sort()).toEqual(['whole /a.heic', 'whole /b.heic', 'whole /c.heic', 'whole /d.heic']);
  });

  it('drops what was being made for the previous folder', async () => {
    const smallThumbnail = held<Blob | null>();
    smallThumbnails.set('/a.heic', smallThumbnail.promise);
    service.watch('/a.heic');
    await settle();
    service.reset();
    smallThumbnail.resolve(new Blob(['small']));
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'pending', provisionalUrl: null });
    expect(made).toEqual(['small /a.heic']);
  });

  it('makes the whole image at the size that the settings choose, and at 400 pixels when Fast leaves it to a photo that holds no small thumbnail', async () => {
    size.set(800);
    smallThumbnails.set('/a.heic', small());
    wholeImages.set('/a.heic', whole());
    service.watch('/a.heic');
    await settle();
    expect(wholeImageSizes).toEqual([800]);

    service.reset();
    quality.set('fast');
    wholeImages.set('/b.heic', whole());
    service.watch('/b.heic');
    await settle();
    expect(wholeImageSizes).toEqual([800, 400]);
  });

  it('makes the thumbnails again for a new quality, after the main process has followed it', async () => {
    quality.set('fast');
    smallThumbnails.set('/a.heic', small());
    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic').kind).toBe('decoded');

    quality.set('high');
    smallThumbnails.set('/a.heic', small());
    wholeImages.set('/a.heic', whole());
    await service.applyThumbnailSettings();
    expect(generated.reset).toHaveBeenCalledOnce();
    expect(generation.applyThumbnailSettings).toHaveBeenCalledOnce();
    expect(revoked).toEqual(['blob:test/1']);
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'pending', provisionalUrl: null });

    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/3' });
  });

  it('asks for the thumbnails again only once the main process has followed a new quality', async () => {
    // The main process makes the thumbnails of the folder, of high quality, and has made this one.
    quality.set('high');
    generation.isMade.mockReturnValue(true);
    smallThumbnails.set('/a.heic', small());
    service.watch('/a.heic');
    await settle();
    generatedFiles.set(new Map([['/a.heic', '/cache/a.heic.plm.jpg']]));
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'generated', filePath: '/cache/a.heic.plm.jpg', longerSide: 400 });

    // The fast thumbnails are chosen, which the main process follows once it has dropped those that wait to be made.
    quality.set('fast');
    const followed = held<void>();
    generation.applyThumbnailSettings.mockImplementation(async () => {
      await followed.promise;
      generation.isMade.mockReturnValue(false);
      return false;
    });
    smallThumbnails.set('/a.heic', small());
    const applied = service.applyThumbnailSettings();
    // A place that shows the photo asks for it again whenever what it shows changes, as the viewer's effect does.
    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'generated', filePath: '/cache/a.heic.plm.jpg', longerSide: 400 });
    expect(generated.reset).not.toHaveBeenCalled();

    followed.resolve();
    await applied;
    expect(generated.reset).toHaveBeenCalledOnce();
    service.watch('/a.heic');
    await settle();
    expect(service.stateOf('/a.heic')).toEqual({ kind: 'decoded', url: 'blob:test/2' });
  });
});
