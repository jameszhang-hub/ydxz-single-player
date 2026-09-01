import Foundation
import PDFKit

struct TrialMonster: Codable {
    let id: Int
    let chapter: Int
    let chapterName: String
    let step: Int
    let speed: Int
    let hp: Int
    let attack: Int
    let defense: Int
    let lifesteal: Int
    let antiLifesteal: Int
    let counter: Int
    let antiCounter: Int
    let combo: Int
    let antiCombo: Int
    let dodge: Int
    let antiDodge: Int
    let crit: Int
    let antiCrit: Int
    let stun: Int
    let antiStun: Int
}

struct TrialMeta: Codable {
    let source: String
    let version: String
    let rateUnit: String
    let monsterCount: Int
    let chapterCount: Int
}

struct TrialConfig: Codable {
    let meta: TrialMeta
    let monsters: [TrialMonster]
}

guard CommandLine.arguments.count == 3 else {
    fputs("usage: extract-trial-config <source-pdf> <output-json>\n", stderr)
    exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let document = PDFDocument(url: input) else {
    fputs("could not open \(input.path)\n", stderr)
    exit(1)
}

func firstGroups(_ pattern: String, in text: String) -> [String]? {
    guard let expression = try? NSRegularExpression(pattern: pattern) else { return nil }
    let range = NSRange(text.startIndex..., in: text)
    guard let match = expression.firstMatch(in: text, range: range) else { return nil }
    return (1..<match.numberOfRanges).compactMap { index in
        guard let range = Range(match.range(at: index), in: text) else { return nil }
        return String(text[range])
    }
}

func pair(_ label: String, _ resistance: String, in text: String) -> (Int, Int)? {
    guard let values = firstGroups("\(label)\\s*(\\d+)\\s*\(resistance)\\s*(\\d+)", in: text),
          values.count == 2,
          let value = Int(values[0]),
          let antiValue = Int(values[1]) else { return nil }
    return (value, antiValue)
}

var chapter = 0
var chapterName = ""
var monsters: [TrialMonster] = []
let headerExpression = try! NSRegularExpression(pattern: "关卡\\s*(\\d+)\\s*-\\s*(\\d+)\\s*怪物编号\\s*(\\d+)")

for pageIndex in 0..<document.pageCount {
    guard let text = document.page(at: pageIndex)?.string, !text.isEmpty else { continue }
    if let chapterGroups = firstGroups("第\\s*(\\d+)\\s*章\\s*-\\s*([^\\n]+)", in: text),
       chapterGroups.count == 2,
       let parsedChapter = Int(chapterGroups[0]) {
        chapter = parsedChapter
        chapterName = chapterGroups[1].trimmingCharacters(in: .whitespacesAndNewlines)
    }

    let fullRange = NSRange(text.startIndex..., in: text)
    let headers = headerExpression.matches(in: text, range: fullRange)
    for (index, header) in headers.enumerated() {
        guard let headerRange = Range(header.range, in: text) else { continue }
        let endOffset = index + 1 < headers.count ? headers[index + 1].range.location : fullRange.length
        let bodyRange = NSRange(location: header.range.location, length: endOffset - header.range.location)
        guard let range = Range(bodyRange, in: text) else { continue }
        let body = String(text[range])
        let groups = (1..<header.numberOfRanges).compactMap { groupIndex -> String? in
            guard let range = Range(header.range(at: groupIndex), in: text) else { return nil }
            return String(text[range])
        }
        guard groups.count == 3,
              let headerChapter = Int(groups[0]),
              let step = Int(groups[1]),
              let id = Int(groups[2]),
              let baseA = firstGroups("速度\\s*(\\d+)\\s*生命\\s*(\\d+)", in: body),
              let baseB = firstGroups("攻击\\s*(\\d+)\\s*防御\\s*(\\d+)", in: body),
              baseA.count == 2, baseB.count == 2,
              let speed = Int(baseA[0]), let hp = Int(baseA[1]),
              let attack = Int(baseB[0]), let defense = Int(baseB[1]),
              let lifesteal = pair("吸血", "吸血抗性", in: body),
              let counter = pair("反击", "反击抗性", in: body),
              let combo = pair("连击", "连击抗性", in: body),
              let dodge = pair("闪避", "闪避抗性", in: body),
              let crit = pair("暴击", "暴击抗性", in: body),
              let stun = pair("击晕", "击晕抗性", in: body) else {
            fputs("could not parse page \(pageIndex + 1), entry \(index + 1)\n", stderr)
            exit(1)
        }
        monsters.append(TrialMonster(
            id: id,
            chapter: headerChapter,
            chapterName: headerChapter == chapter ? chapterName : "章节\(headerChapter)",
            step: step,
            speed: speed,
            hp: hp,
            attack: attack,
            defense: defense,
            lifesteal: lifesteal.0,
            antiLifesteal: lifesteal.1,
            counter: counter.0,
            antiCounter: counter.1,
            combo: combo.0,
            antiCombo: combo.1,
            dodge: dodge.0,
            antiDodge: dodge.1,
            crit: crit.0,
            antiCrit: crit.1,
            stun: stun.0,
            antiStun: stun.1
        ))
        _ = headerRange
    }
}

monsters.sort { $0.id < $1.id }
let ids = Set(monsters.map(\.id))
let missingIds = (1...(monsters.last?.id ?? 0)).filter { !ids.contains($0) }
guard monsters.count == 1_480,
      monsters.first?.id == 1,
      monsters.last?.id == 1_580,
      missingIds == Array(201...300) else {
    fputs("expected 1480 rows spanning ids 1...1580 with only ids 201...300 reserved; found \(monsters.count) rows and gaps \(missingIds)\n", stderr)
    exit(1)
}

let config = TrialConfig(
    meta: TrialMeta(
        source: input.lastPathComponent,
        version: "v148 (2025-04-03)",
        rateUnit: "percent",
        monsterCount: monsters.count,
        chapterCount: Set(monsters.map(\.chapter)).count
    ),
    monsters: monsters
)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
let data = try encoder.encode(config)
try data.write(to: output, options: .atomic)
print("wrote \(monsters.count) monsters to \(output.path)")
