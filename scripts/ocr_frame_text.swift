import AppKit
import Foundation
import Vision

guard CommandLine.arguments.count == 4 else {
    fputs("usage: ocr_frame_text <frames-dir> <start-index> <end-index>\n", stderr)
    exit(2)
}

let directory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
guard let startIndex = Int(CommandLine.arguments[2]), let endIndex = Int(CommandLine.arguments[3]) else {
    fputs("start-index and end-index must be integers\n", stderr)
    exit(2)
}

let files = try FileManager.default.contentsOfDirectory(
    at: directory,
    includingPropertiesForKeys: nil,
    options: [.skipsHiddenFiles]
).filter { url in
    let name = url.lastPathComponent
    guard name.hasPrefix("frame-"), name.hasSuffix(".jpg") else { return false }
    let parts = name.split(separator: "-")
    guard parts.count >= 3, let index = Int(parts[1]) else { return false }
    return index >= startIndex && index <= endIndex
}.sorted { $0.lastPathComponent < $1.lastPathComponent }

for file in files {
    guard let image = NSImage(contentsOf: file),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    let preferredLanguages = ["zh-Hans", "zh-Hant", "en-US"]
    let supportedLanguages = (try? request.supportedRecognitionLanguages()) ?? []
    request.recognitionLanguages = preferredLanguages.filter(supportedLanguages.contains)
    request.usesLanguageCorrection = false

    do {
        try VNImageRequestHandler(cgImage: cgImage).perform([request])
    } catch {
        fputs("\(file.lastPathComponent): \(error)\n", stderr)
        continue
    }
    let text = (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: " | ")
        .replacingOccurrences(of: "\t", with: " ")
        .replacingOccurrences(of: "\n", with: " ")
    print("\(file.lastPathComponent)\t\(text)")
}
