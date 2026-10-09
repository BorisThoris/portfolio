$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class StationProbe {
  [StructLayout(LayoutKind.Sequential)] public struct UserFlags { public int inherit, reserved; public uint flags; }
  [DllImport("user32.dll")] public static extern IntPtr GetProcessWindowStation();
  [DllImport("user32.dll", EntryPoint="GetUserObjectInformationW", SetLastError=true)] public static extern bool GetFlags(IntPtr station, int index, out UserFlags data, uint size, out uint needed);
  public static bool IsIsolated() { UserFlags flags; uint needed; if(!GetFlags(GetProcessWindowStation(), 1, out flags, (uint)Marshal.SizeOf(typeof(UserFlags)), out needed)) throw new Exception("Station flags unavailable"); return (flags.flags & 1) == 0; }
}
'@
if (-not [StationProbe]::IsIsolated()) { throw 'Refusing browser automation on an interactive window station.' }
Write-Output 'NONINTERACTIVE_VERIFIED'
