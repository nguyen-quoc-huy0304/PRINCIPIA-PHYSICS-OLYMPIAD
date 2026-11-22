using System.Diagnostics;
using System.Globalization;
using System.Text.Json;

static JsonDocument InvokeCore(string request)
{
    var binary = Environment.GetEnvironmentVariable("PRINCIPIA_CORE_BIN");
    if (string.IsNullOrWhiteSpace(binary))
        throw new InvalidOperationException("PRINCIPIA_CORE_BIN must point to principia-core-server.");

    var start = new ProcessStartInfo(binary)
    {
        RedirectStandardInput = true,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false
    };
    using var process = Process.Start(start) ?? throw new InvalidOperationException("Could not start PRINCIPIA core.");
    process.StandardInput.WriteLine(request);
    process.StandardInput.Close();
    var output = process.StandardOutput.ReadToEnd();
    var error = process.StandardError.ReadToEnd();
    process.WaitForExit();
    if (process.ExitCode != 0)
        throw new Exception($"Core exited with {process.ExitCode}: {error}");
    return JsonDocument.Parse(output);
}

static double Number(JsonElement root, string property) => root.GetProperty("value").GetDouble();
static void Near(string label, double actual, double expected, double tolerance)
{
    if (!double.IsFinite(actual) || Math.Abs(actual - expected) > tolerance)
        throw new Exception($"{label}: got {actual.ToString("R", CultureInfo.InvariantCulture)}, expected {expected:R} ± {tolerance}");
    Console.WriteLine($"PASS {label}: {actual:R}");
}

// Independent C# reference calculations cross-check the Rust dispatcher + C++ kernel.
using (var result = InvokeCore("""{"id":"cs-velocity","op":"velocity","initial":3,"acceleration":2,"seconds":4}"""))
{
    var expected = 3.0 + 2.0 * 4.0;
    Near("velocity", Number(result.RootElement, "value"), expected, 1e-12);
}
using (var result = InvokeCore("""{"id":"cs-energy","op":"kineticEnergy","massKg":2,"speedMps":3}"""))
{
    var expected = 0.5 * 2.0 * 3.0 * 3.0;
    Near("kinetic energy", Number(result.RootElement, "value"), expected, 1e-12);
}
using (var result = InvokeCore("""{"id":"cs-projectile","op":"projectileRange","speed":10,"angleDeg":45,"gravity":9.81}"""))
{
    var radians = 45.0 * Math.PI / 180.0;
    var expected = 10.0 * Math.Cos(radians) * (2.0 * 10.0 * Math.Sin(radians) / 9.81);
    Near("projectile range", Number(result.RootElement, "value"), expected, 1e-10);
}
using (var result = InvokeCore("""{"id":"cs-invalid","op":"kineticEnergy","massKg":-1,"speedMps":3}"""))
{
    if (result.RootElement.GetProperty("ok").GetBoolean())
        throw new Exception("negative mass must be rejected");
    Console.WriteLine("PASS invalid-domain rejection");
}
Console.WriteLine("C# independent reference checks passed.");
