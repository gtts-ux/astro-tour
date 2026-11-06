import Foundation
import AppKit
import CoreLocation

// This executable lives in a dedicated signed application bundle so Core Location
// can identify the requesting application and read its privacy descriptions.
final class Locator: NSObject, CLLocationManagerDelegate {
    let manager = CLLocationManager()
    var finished = false
    var requested = false
    func finish(_ result: [String: Any]) {
        guard !finished else { return }
        finished = true
        manager.stopUpdatingLocation()
        if let data = try? JSONSerialization.data(withJSONObject: result), let text = String(data: data, encoding: .utf8) { print(text) }
        exit(0)
    }
    func start() {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        updateAuthorization()
    }
    func updateAuthorization() {
        guard !finished else { return }
        switch manager.authorizationStatus {
        case .notDetermined:
            if !requested {
                requested = true
                manager.requestWhenInUseAuthorization()
                // Starting updates also lets macOS offer to enable Location Services.
                manager.startUpdatingLocation()
            }
        case .authorizedAlways, .authorizedWhenInUse:
            manager.startUpdatingLocation()
        case .denied:
            finish(["error": "Location access is not allowed for Astro Tour. Open System Settings > Privacy & Security > Location Services and allow Astro Tour, then try again."])
        case .restricted:
            finish(["error": "Location access is restricted by macOS. You can select a place on the Map instead."])
        @unknown default:
            finish(["error": "Location authorization is unavailable. You can select a place on the Map instead."])
        }
    }
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) { updateAuthorization() }
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last, location.horizontalAccuracy >= 0, abs(location.timestamp.timeIntervalSinceNow) < 300 else { return }
        finish(["lat": location.coordinate.latitude, "lon": location.coordinate.longitude, "accuracy": location.horizontalAccuracy])
    }
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if (error as? CLError)?.code == .locationUnknown { return }
        if manager.authorizationStatus == .notDetermined { return }
        if (error as? CLError)?.code == .denied {
            finish(["error": "macOS could not authorize location access. Check Astro Tour under System Settings > Privacy & Security > Location Services. If services are already on, allow this app and try again."])
        } else {
            finish(["error": "Your Mac could not determine its location. Keep Wi-Fi enabled for positioning, or choose a place on the Map."])
        }
    }
}
let application = NSApplication.shared
application.setActivationPolicy(.accessory)
application.finishLaunching()
let locator = Locator()
if CommandLine.arguments.contains("--diagnose") {
    locator.finish(["bundle": Bundle.main.bundlePath, "identifier": Bundle.main.bundleIdentifier ?? "missing", "usageDescription": Bundle.main.object(forInfoDictionaryKey: "NSLocationUsageDescription") ?? "missing", "authorization": locator.manager.authorizationStatus.rawValue, "servicesEnabled": CLLocationManager.locationServicesEnabled()])
}
locator.start()
Timer.scheduledTimer(withTimeInterval: 55, repeats: false) { _ in locator.finish(["error": "Location request timed out. Respond to the macOS permission dialog, check Location Services and Wi-Fi, or select a place on the Map."]) }
application.run()
