import AppKit
import AVFoundation
import Foundation

guard CommandLine.arguments.count >= 4 else {
    fputs("usage: extract_video_frames <video> <output-dir> <frames-per-second>\n", stderr)
    exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
let framesPerSecond = Double(CommandLine.arguments[3]) ?? 2
guard framesPerSecond > 0 else {
    fputs("frames-per-second must be positive\n", stderr)
    exit(2)
}

try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

let asset = AVURLAsset(url: input)
let duration = CMTimeGetSeconds(asset.duration)
guard duration.isFinite, duration > 0 else {
    fputs("could not read video duration\n", stderr)
    exit(1)
}

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 430, height: 900)
generator.requestedTimeToleranceBefore = CMTime(seconds: 0.2, preferredTimescale: 600)
generator.requestedTimeToleranceAfter = CMTime(seconds: 0.2, preferredTimescale: 600)

let frameCount = Int(floor(duration * framesPerSecond)) + 1
for index in 0..<frameCount {
    let seconds = min(duration, Double(index) / framesPerSecond)
    let time = CMTime(seconds: seconds, preferredTimescale: 600)
    do {
        let image = try generator.copyCGImage(at: time, actualTime: nil)
        let bitmap = NSBitmapImageRep(cgImage: image)
        guard let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.76]) else { continue }
        let filename = String(format: "frame-%04d-%07.2fs.jpg", index, seconds)
        try data.write(to: output.appendingPathComponent(filename), options: .atomic)
    } catch {
        fputs("frame \(index) at \(seconds)s: \(error)\n", stderr)
    }

    if index % 100 == 0 {
        print("\(index)/\(frameCount)")
    }
}

print("extracted \(frameCount) frames over \(String(format: "%.2f", duration)) seconds")
