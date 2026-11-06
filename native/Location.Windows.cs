using System;
using System.Device.Location;
using System.Globalization;
using System.Threading;

internal static class AstroTourLocation {
    private static void Error(string message) { Console.WriteLine("{\"error\":\"" + message + "\"}"); }
    [STAThread]
    private static int Main(string[] args) {
        if (args.Length > 0 && args[0] == "--diagnose") { Console.WriteLine("{\"platform\":\"win32\",\"provider\":\"Windows Location Service\"}"); return 0; }
        try {
            using (var watcher = new GeoCoordinateWatcher(GeoPositionAccuracy.Default)) {
                // false permits the system's normal consent flow; no settings are changed.
                watcher.TryStart(false, TimeSpan.FromSeconds(5));
                var deadline = DateTime.UtcNow.AddSeconds(50);
                while (DateTime.UtcNow < deadline) {
                    if (watcher.Permission == GeoPositionPermission.Denied) {
                        Error("Windows denied location access. Open Settings > Privacy & security > Location and enable Location services and Let desktop apps access your location, or choose a place on the Map."); return 0;
                    }
                    var position = watcher.Position;
                    if (!position.Location.IsUnknown && Math.Abs((DateTimeOffset.UtcNow - position.Timestamp).TotalMinutes) < 5) {
                        var c = position.Location;
                        var accuracy = double.IsNaN(c.HorizontalAccuracy) || double.IsInfinity(c.HorizontalAccuracy) ? 10000 : c.HorizontalAccuracy;
                        Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{{\"lat\":{0:R},\"lon\":{1:R},\"accuracy\":{2:R}}}", c.Latitude,c.Longitude,accuracy));
                        watcher.Stop(); return 0;
                    }
                    Thread.Sleep(250);
                }
                watcher.Stop();
                Error("Windows could not determine a location. Check Settings > Privacy & security > Location, keep Wi-Fi enabled, or choose a place on the Map.");
            }
        } catch { Error("The Windows location provider is unavailable. Select your observing location on the Map."); }
        return 0;
    }
}
