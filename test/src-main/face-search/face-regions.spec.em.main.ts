import assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { hasFaceRegion, hasFaceRegionIn } from '../../../src-main/face-search/face-regions.js';
import { repositoryPath } from '../../test-util/repository.js';

/** A photo of the repository, with a location and an EXIF thumbnail, and no XMP of its own. */
const photo = repositoryPath('test', 'test-resources', 'actual-photos', 'Kobe', 'IMG_4676.JPG');

/** The JPEG file's bytes with an XMP segment of `descriptions` right after its first marker. */
function withXmp(jpeg: Buffer, descriptions: string): Buffer {
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">${descriptions}</rdf:RDF></x:xmpmeta>`;
  const payload = Buffer.concat([Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1'), Buffer.from(xmp)]);
  const length = payload.length + 2;
  return Buffer.concat([jpeg.subarray(0, 2), Buffer.from([0xff, 0xe1, length >> 8, length & 0xff]), payload, jpeg.subarray(2)]);
}

const mwg = 'xmlns:mwg-rs="http://www.metadataworkinggroup.com/schemas/regions/" xmlns:stArea="http://ns.adobe.com/xmp/sType/Area#"';
const area = '<mwg-rs:Area stArea:x="0.5" stArea:y="0.5" stArea:w="0.1" stArea:h="0.1" stArea:unit="normalized"/>';
/** One region of `type`, as ExifTool writes it: elements. */
const mwgRegion = (type: string) => `<rdf:Description rdf:about="" ${mwg}><mwg-rs:Regions rdf:parseType="Resource"><mwg-rs:RegionList>
  <rdf:Bag><rdf:li rdf:parseType="Resource"><mwg-rs:Type>${type}</mwg-rs:Type>${area}</rdf:li></rdf:Bag></mwg-rs:RegionList></mwg-rs:Regions></rdf:Description>`;
/** Regions of `types`, as Picasa and Lightroom write them: attributes of a description in each item. */
const mwgAttributeRegions = (...types: string[]) => `<rdf:Description rdf:about="" ${mwg}><mwg-rs:Regions rdf:parseType="Resource"><mwg-rs:RegionList><rdf:Bag>
  ${types.map(type => `<rdf:li><rdf:Description mwg-rs:Name="Someone" mwg-rs:Type="${type}">${area}</rdf:Description></rdf:li>`).join('')}
  </rdf:Bag></mwg-rs:RegionList></mwg-rs:Regions></rdf:Description>`;
/** A person of Microsoft's People tags, as Windows Photo Gallery writes one. */
const peopleTag = `<rdf:Description rdf:about="" xmlns:MP="http://ns.microsoft.com/photo/1.2/" xmlns:MPRI="http://ns.microsoft.com/photo/1.2/t/RegionInfo#"
  xmlns:MPReg="http://ns.microsoft.com/photo/1.2/t/Region#"><MP:RegionInfo rdf:parseType="Resource"><MPRI:Regions><rdf:Bag>
  <rdf:li rdf:parseType="Resource"><MPReg:PersonDisplayName>Someone</MPReg:PersonDisplayName><MPReg:Rectangle>0.45, 0.35, 0.1, 0.15</MPReg:Rectangle></rdf:li>
  </rdf:Bag></MPRI:Regions></MP:RegionInfo></rdf:Description>`;

describe('The face regions of a photo\'s metadata (in main process)', () => {
  let directory: string;
  beforeEach(() => { directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plm-face-regions-')); });
  afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));

  /** A copy of the photo with the XMP of `descriptions`, named `name`. */
  function photoWith(descriptions: string, name = 'photo.jpg'): string {
    const filePath = path.join(directory, name);
    fs.writeFileSync(filePath, withXmp(fs.readFileSync(photo), descriptions));
    return filePath;
  }

  it('finds a face region of the Metadata Working Group, written as elements or as attributes, named or not', async () => {
    assert.strictEqual(await hasFaceRegion(photoWith(mwgRegion('Face'))), true);
    assert.strictEqual(await hasFaceRegion(photoWith(mwgAttributeRegions('Face', 'Face'))), true);
    assert.strictEqual(await hasFaceRegion(photoWith(mwgAttributeRegions('Pet', 'Face'))), true);
  });

  it('takes a region of another type for no face', async () => {
    assert.strictEqual(await hasFaceRegion(photoWith(mwgRegion('Pet'))), false);
    assert.strictEqual(await hasFaceRegion(photoWith(mwgAttributeRegions('Focus', 'BarCode'))), false);
  });

  it('finds a person of Microsoft\'s People tags', async () => {
    assert.strictEqual(await hasFaceRegion(photoWith(peopleTag)), true);
  });

  it('finds none in a photo without XMP, or with XMP of other things', async () => {
    assert.strictEqual(await hasFaceRegion(photo), false);
    const otherXmp = '<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>Something</xmp:CreatorTool></rdf:Description>';
    assert.strictEqual(await hasFaceRegion(photoWith(otherXmp)), false);
  });

  it('reads JPEG files only, and takes a file that cannot be read for one without regions', async () => {
    // HEIF files' XMP is an item of their own, which exifr does not read; a file of another name is not read at all.
    assert.strictEqual(await hasFaceRegion(photoWith(mwgRegion('Face'), 'photo.heic')), false);
    assert.strictEqual(await hasFaceRegion(photoWith(mwgRegion('Face'), 'photo.JPG')), true);
    assert.strictEqual(await hasFaceRegion(path.join(directory, 'missing.jpg')), false);
  });

  it('reads the regions from what exifr gives, an object for one item of a bag and an array for more', () => {
    assert.strictEqual(hasFaceRegionIn({ 'mwg-rs': { Regions: { RegionList: { Type: 'Face' } } } }), true);
    assert.strictEqual(hasFaceRegionIn({ 'mwg-rs': { Regions: { RegionList: [{ Type: 'Pet' }, { Type: 'Face' }] } } }), true);
    assert.strictEqual(hasFaceRegionIn({ 'mwg-rs': { Regions: { RegionList: [{ Type: 'Pet' }] } } }), false);
    assert.strictEqual(hasFaceRegionIn({ MP: { RegionInfo: { Regions: { Rectangle: '0, 0, 1, 1' } } } }), true);
    for (const nothing of [undefined, null, {}, { 'mwg-rs': {} }, { 'mwg-rs': { Regions: 'text' } }, { MP: { RegionInfo: {} } }])
      assert.strictEqual(hasFaceRegionIn(nothing), false, JSON.stringify(nothing));
  });
});
