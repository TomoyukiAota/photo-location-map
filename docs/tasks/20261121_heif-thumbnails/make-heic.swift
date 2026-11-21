// Writes a HEIC with Apple's ImageIO, the encoder that iOS uses, from an image that ImageIO reads, keeping its metadata
// and orientation; with a thumbnail item, as an iPhone writes, when embedThumbnail is 1. It made
// test/e2e/fixtures/demo-with-thumbnail.heic:
//   swift make-heic.swift test/e2e/fixtures/demo.heic demo-with-thumbnail.heic 0.5 0.6 1
//   swift make-heic.swift <in> <out.heic> <scale> <quality> <embedThumbnail 0|1>
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 6 else { fatalError("usage: make_heic in out scale quality embedThumbnail") }
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
let scale = Double(args[3])!, quality = Double(args[4])!, embedThumbnail = args[5] == "1"

guard let source = CGImageSourceCreateWithURL(input as CFURL, nil),
      var image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { fatalError("cannot read \(input.path)") }
var properties = (CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]) ?? [:]

if scale != 1 {
  let width = Int(Double(image.width) * scale), height = Int(Double(image.height) * scale)
  let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0,
                          space: image.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB)!,
                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  context.interpolationQuality = .high
  context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
  image = context.makeImage()!
  if var exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any] {
    exif[kCGImagePropertyExifPixelXDimension] = width
    exif[kCGImagePropertyExifPixelYDimension] = height
    properties[kCGImagePropertyExifDictionary] = exif
  }
}
properties[kCGImageDestinationLossyCompressionQuality] = quality
properties[kCGImageDestinationEmbedThumbnail] = embedThumbnail

guard let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.heic.identifier as CFString, 1, nil)
else { fatalError("cannot write HEIC") }
CGImageDestinationAddImage(destination, image, properties as CFDictionary)
guard CGImageDestinationFinalize(destination) else { fatalError("finalize failed") }
print("\(output.lastPathComponent) \(image.width)x\(image.height)")
