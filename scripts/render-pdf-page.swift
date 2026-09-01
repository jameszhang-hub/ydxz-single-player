import AppKit
import Foundation
import PDFKit

guard CommandLine.arguments.count == 4,
      let pageNumber = Int(CommandLine.arguments[2]) else {
    fputs("usage: render-pdf-page <pdf> <one-based-page> <output-png>\n", stderr)
    exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[3])
guard let document = PDFDocument(url: input),
      pageNumber > 0,
      pageNumber <= document.pageCount,
      let page = document.page(at: pageNumber - 1) else {
    fputs("could not open requested page\n", stderr)
    exit(1)
}

let image = page.thumbnail(of: NSSize(width: 1260, height: 1788), for: .mediaBox)
guard let data = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: data),
      let png = bitmap.representation(using: .png, properties: [:]) else {
    fputs("could not render requested page\n", stderr)
    exit(1)
}
try png.write(to: output, options: .atomic)
print(output.path)
