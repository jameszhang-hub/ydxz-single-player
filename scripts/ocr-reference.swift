import AppKit
import Foundation
import Vision

func recognize(_ path: String) throws -> [VNRecognizedTextObservation] {
    guard let image = NSImage(contentsOfFile: path),
          let data = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: data),
          let cgImage = bitmap.cgImage else {
        throw NSError(domain: "ocr-reference", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot read \(path)"])
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.revision = VNRecognizeTextRequestRevision3
    request.recognitionLanguages = ["zh-Hans"]
    try VNImageRequestHandler(cgImage: cgImage).perform([request])
    return request.results ?? []
}

for path in CommandLine.arguments.dropFirst() {
    print("=== \(path) ===")
    do {
        let observations = try recognize(path).sorted {
            let rowDifference = $0.boundingBox.midY - $1.boundingBox.midY
            if abs(rowDifference) > 0.012 { return rowDifference > 0 }
            return $0.boundingBox.minX < $1.boundingBox.minX
        }
        for observation in observations {
            guard let text = observation.topCandidates(1).first?.string else { continue }
            let box = observation.boundingBox
            print(String(format: "%.3f %.3f %.3f %.3f\t%@", box.minX, box.minY, box.width, box.height, text))
        }
    } catch {
        fputs("OCR failed: \(error)\n", stderr)
    }
}
