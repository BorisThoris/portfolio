import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function assertBrowserIsolation() {
  if (process.platform !== 'win32') return;
  const probe = spawnSync('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden',
    '-ExecutionPolicy', 'Bypass', '-File',
    fileURLToPath(new URL('./verify-station.ps1', import.meta.url))],
  { encoding: 'utf8', windowsHide: true });
  if (probe.status !== 0 || !probe.stdout?.includes('NONINTERACTIVE_VERIFIED')) {
    throw new Error(`Browser automation requires the verified noninteractive launcher. ${probe.stderr || probe.stdout}`);
  }
}
