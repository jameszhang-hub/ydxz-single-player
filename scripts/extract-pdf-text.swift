import Foundation
import PDFKit

guard CommandLine.arguments.count == 2 else {
    fputs("usage: extract-pdf-text <pdf>\n", stderr)
    exit(2)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let document = PDFDocument(url: url) else {
    fputs("could not open \(url.path)\n", stderr)
    exit(1)
}

print("pages\t\(document.pageCount)")
for index in 0..<document.pageCount {
    print("--- page \(index + 1) ---")
    print(document.page(at: index)?.string ?? "")
}
