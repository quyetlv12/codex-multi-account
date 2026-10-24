import AppKit

// Usage: swift scripts/macos/render_launcher_icon.swift /tmp/codex-lb-icon
// Geometry follows frontend/public/favicon.svg; no third-party rendering tools.
guard CommandLine.arguments.count == 2 else {
    fatalError("Expected an output directory")
}
let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let iconset = output.appendingPathComponent("CodexLB.iconset", isDirectory: true)
try FileManager.default.createDirectory(at: iconset, withIntermediateDirectories: true)

func color(_ hex: UInt32, alpha: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((hex >> 16) & 255) / 255,
            green: CGFloat((hex >> 8) & 255) / 255,
            blue: CGFloat(hex & 255) / 255, alpha: alpha)
}

func render(_ pixels: Int) throws -> Data {
    let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
        isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
    )!
    NSGraphicsContext.saveGraphicsState()
    defer { NSGraphicsContext.restoreGraphicsState() }
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    let context = NSGraphicsContext.current!.cgContext
    context.scaleBy(x: CGFloat(pixels) / 1024, y: CGFloat(pixels) / 1024)
    context.setAllowsAntialiasing(true)

    let tile = NSBezierPath(roundedRect: NSRect(x: 88, y: 88, width: 848, height: 848),
                            xRadius: 190, yRadius: 190)
    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = color(0x041128, alpha: 0.28)
    shadow.shadowBlurRadius = 28
    shadow.shadowOffset = NSSize(width: 0, height: -14)
    shadow.set()
    color(0x0B1C38).setFill()
    tile.fill()
    NSGraphicsContext.restoreGraphicsState()

    NSGradient(colorsAndLocations: (color(0x193F70), 0),
               (color(0x102D53), 0.45), (color(0x09192F), 1))!
        .draw(in: tile, angle: -60)
    let rim = NSBezierPath(roundedRect: NSRect(x: 90, y: 90, width: 844, height: 844),
                           xRadius: 188, yRadius: 188)
    color(0xA7CCF5, alpha: 0.3).setStroke()
    rim.lineWidth = 3
    rim.stroke()

    // Preserve the circular Codex mark, with a blue ring and crisp white prompt.
    NSGraphicsContext.saveGraphicsState()
    context.translateBy(x: 224, y: 224)
    context.scaleBy(x: 18, y: 18)
    let ring = NSBezierPath(ovalIn: NSRect(x: 1.242, y: 1.242, width: 29.516, height: 29.516))
    ring.lineWidth = 2.484
    color(0x78BAFF).setStroke()
    ring.stroke()
    let prompt = NSBezierPath()
    prompt.move(to: NSPoint(x: 9.662, y: 19.710))
    prompt.line(to: NSPoint(x: 11.641, y: 16.134))
    prompt.curve(to: NSPoint(x: 11.636, y: 15.630),
                 controlPoint1: NSPoint(x: 11.727, y: 15.978),
                 controlPoint2: NSPoint(x: 11.725, y: 15.784))
    prompt.line(to: NSPoint(x: 9.662, y: 12.221))
    prompt.move(to: NSPoint(x: 17.170, y: 12.203))
    prompt.line(to: NSPoint(x: 22.356, y: 12.203))
    prompt.lineWidth = 2.484
    prompt.lineCapStyle = .round
    prompt.lineJoinStyle = .round
    color(0xF5FAFF).setStroke()
    prompt.stroke()
    NSGraphicsContext.restoreGraphicsState()

    return bitmap.representation(using: .png, properties: [:])!
}

for points in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let name = "icon_\(points)x\(points)\(scale == 2 ? "@2x" : "").png"
        let data = try render(points * scale)
        let decoded = NSBitmapImageRep(data: data)!
        precondition(decoded.pixelsWide == points * scale && decoded.hasAlpha)
        try data.write(to: iconset.appendingPathComponent(name), options: .atomic)
    }
}
try render(1024).write(to: output.appendingPathComponent("CodexLB.png"), options: .atomic)
let iconutil = Process()
iconutil.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
iconutil.arguments = ["-c", "icns", iconset.path, "-o", output.appendingPathComponent("CodexLB.icns").path]
try iconutil.run()
iconutil.waitUntilExit()
precondition(iconutil.terminationStatus == 0, "ICNS conversion failed")
print("Generated CodexLB.png, CodexLB.icns and 10 verified icon representations at \(output.path)")
