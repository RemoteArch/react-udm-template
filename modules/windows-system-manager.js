/**
 * ARCHITECTURE EN FICHIER UNIQUE AVEC EXPORTS INDIVIDUELS
 * Fichier : windows-system-manager.js
 */

async function execWin(cmd) {
  try {
    const { stdout, stderr } = await windows.command(cmd);
    
    const hasError = stderr && (
      stderr.toLowerCase().includes("error") || 
      stderr.toLowerCase().includes("erreur") || 
      stderr.toLowerCase().includes("access is denied") ||
      stderr.toLowerCase().includes("accès refusé")
    );

    return {
      status: hasError ? "error" : (stderr ? "warning" : "success"),
      stdout: stdout ? stdout.trim() : "",
      stderr: stderr ? stderr.trim() : ""
    };
  } catch (err) {
    return {
      status: "error",
      stdout: "",
      stderr: err.message || String(err)
    };
  }
}

function sanitize(input) {
  return String(input).replace(/["'`$&|;<>] /g, "");
}

// ==========================================
// DÉCLARATION DES 28 MODULES
// ==========================================

export const system = {
  getSystemInfo: async () => execWin("systeminfo /FO LIST"),
  getHostname: async () => execWin("hostname"),
  getCurrentUser: async () => execWin("whoami"),
  getUptime: async () => execWin("powershell -Command \"(Get-CimInstance Win32_OperatingSystem).LastBootUpTime\""),
  getDateTime: async () => execWin("powershell -Command \"Get-Date -Format 'o'\""),
  getEnvironmentVariables: async () => execWin("cmd /c set"),
  getComputerIdentity: async () => execWin("wmic os get CSName, SerialNumber /VALUE"),
  getWindowsVersion: async () => execWin("reg query \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\" /v ProductName")
};

export const hardware = {
  getCpuInfo: async () => execWin("wmic cpu get Name, NumberOfCores, NumberOfLogicalProcessors /VALUE"),
  getCpuUsage: async () => execWin("powershell -Command \"Get-CimInstance Win32_Processor | Select-Object -ExpandProperty LoadPercentage\""),
  getCpuCores: async () => execWin("wmic cpu get NumberOfCores /VALUE"),
  getCpuThreads: async () => execWin("wmic cpu get NumberOfLogicalProcessors /VALUE"),
  getMemoryInfo: async () => execWin("wmic os get TotalVisibleMemorySize, FreePhysicalMemory /VALUE"),
  getMemoryUsage: async () => execWin("wmic os get TotalVisibleMemorySize, FreePhysicalMemory /VALUE"),
  getGpuInfo: async () => execWin("wmic path win32_videocontroller get Name, AdapterRAM /VALUE"),
  getGpuUsage: async () => execWin("powershell -Command \"Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine\""),
  getMotherboardInfo: async () => execWin("wmic baseboard get Manufacturer, Product, SerialNumber /VALUE"),
  getBiosInfo: async () => execWin("wmic bios get Manufacturer, SMBIOSBIOSVersion, ReleaseDate /VALUE"),
  getHardwareDevices: async () => execWin("pnputil /enum-devices"),
  getHardwareDeviceDetails: async (id) => execWin(`pnputil /enum-devices /instanceid "${sanitize(id)}"`)
};

export const processes = {
  listProcesses: async () => execWin("tasklist /FO CSV /V"),
  getProcess: async (pid) => execWin(`tasklist /FI "PID eq ${sanitize(pid)}" /FO CSV`),
  findProcesses: async (query) => execWin(`tasklist /FI "IMAGENAME eq ${sanitize(query)}*" /FO CSV`),
  startProcess: async (command) => execWin(`cmd /c start "" ${command}`),
  killProcess: async (pid) => execWin(`taskkill /PID ${sanitize(pid)}`),
  forceKillProcess: async (pid) => execWin(`taskkill /F /PID ${sanitize(pid)}`),
  getProcessDetails: async (pid) => execWin(`wmic process where processid=${sanitize(pid)} get /FORMAT:LIST`),
  getProcessPath: async (pid) => execWin(`wmic process where processid=${sanitize(pid)} get ExecutablePath /VALUE`),
  getProcessOwner: async (pid) => execWin(`powershell -Command "(Get-Process -Id ${sanitize(pid)}).IncludeUserName"`),
  setProcessPriority: async (pid, priority) => execWin(`wmic process where processid=${sanitize(pid)} CALL setpriority ${sanitize(priority)}`),
  isProcessRunning: async (pid) => execWin(`tasklist /FI "PID eq ${sanitize(pid)}"`),
  watchProcess: async (pid, intervalMs = 2000, callback) => {
    return setInterval(async () => {
      const data = await processes.getProcessDetails(pid);
      if (callback) callback(data);
    }, intervalMs);
  }
};

export const files = {
  listDirectory: async (path) => execWin(`dir "${sanitize(path)}"`),
  getFileInfo: async (path) => execWin(`powershell -Command "Get-Item '${sanitize(path)}' | Format-List *"`),
  fileExists: async (path) => execWin(`cmd /c if exist "${sanitize(path)}" (echo true) else (echo false)`),
  directoryExists: async (path) => execWin(`cmd /c if exist "${sanitize(path)}\\" (echo true) else (echo false)`),
  createFile: async (path) => execWin(`type nul > "${sanitize(path)}"`),
  createDirectory: async (path) => execWin(`mkdir "${sanitize(path)}"`),
  deleteFile: async (path) => execWin(`del /f /q "${sanitize(path)}"`),
  deleteDirectory: async (path) => execWin(`rmdir /s /q "${sanitize(path)}"`),
  copyFile: async (src, dest) => execWin(`copy /y "${sanitize(src)}" "${sanitize(dest)}"`),
  copyDirectory: async (src, dest) => execWin(`xcopy /e /i /y "${sanitize(src)}" "${sanitize(dest)}"`),
  moveFile: async (src, dest) => execWin(`move /y "${sanitize(src)}" "${sanitize(dest)}"`),
  moveDirectory: async (src, dest) => execWin(`move /y "${sanitize(src)}" "${sanitize(dest)}"`),
  rename: async (path, newName) => execWin(`ren "${sanitize(path)}" "${sanitize(newName)}"`),
  searchFiles: async (path, query) => execWin(`dir "${sanitize(path)}\\*${sanitize(query)}*" /s /b`),
  getFileSize: async (path) => execWin(`powershell -Command "(Get-Item '${sanitize(path)}').Length"`),
  getFileAttributes: async (path) => execWin(`attrib "${sanitize(path)}"`),
  setFileAttributes: async (path, attrs) => execWin(`attrib ${sanitize(attrs)} "${sanitize(path)}"`),
  readFile: async (path) => execWin(`type "${sanitize(path)}"`),
  writeFile: async (path, content) => execWin(`powershell -Command "Set-Content -Path '${sanitize(path)}' -Value '${sanitize(content)}'"`),
  appendFile: async (path, content) => execWin(`powershell -Command "Add-Content -Path '${sanitize(path)}' -Value '${sanitize(content)}'"`),
  compress: async (path, dest) => execWin(`powershell -Command "Compress-Archive -Path '${sanitize(path)}' -DestinationPath '${sanitize(dest)}'"`),
  extract: async (path, dest) => execWin(`powershell -Command "Expand-Archive -Path '${sanitize(path)}' -DestinationPath '${sanitize(dest)}'"`)
};

export const storage = {
  listDisks: async () => execWin("wmic diskdrive get Index, Caption, Size /VALUE"),
  getDiskInfo: async (disk) => execWin(`wmic diskdrive where Index=${sanitize(disk)} get /FORMAT:LIST`),
  listPartitions: async () => execWin("wmic partition get Name, Size, StartingOffset /VALUE"),
  listVolumes: async () => execWin("powershell -Command \"Get-Volume\""),
  getVolumeInfo: async (vol) => execWin(`powershell -Command "Get-Volume -DriveLetter ${sanitize(vol)}"`),
  getDiskUsage: async () => execWin("wmic logicaldisk get DeviceID, FreeSpace, Size /VALUE"),
  getFreeSpace: async (drive) => execWin(`wmic logicaldisk where DeviceID="${sanitize(drive)}" get FreeSpace /VALUE`),
  getDriveHealth: async (drive) => execWin(`powershell -Command "Get-PhysicalDisk | Select-Object DeviceId, OperationalStatus, HealthStatus"`),
  mountVolume: async (path, driveLetter, confirmed = false) => {
    if (!confirmed) return { status: "error", message: "Action sensible : Confirmation requise." };
    return execWin(`mountvol ${sanitize(driveLetter)}: ${sanitize(path)}`);
  },
  unmountVolume: async (driveLetter, confirmed = false) => {
    if (!confirmed) return { status: "error", message: "Action destructive : Confirmation requise." };
    return execWin(`mountvol ${sanitize(driveLetter)}: /d`);
  },
  cleanTemporaryFiles: async () => execWin("cmd /c del /q /s %temp%\\*"),
  analyzeDisk: async (path) => execWin(`chkdsk ${sanitize(path)}`)
};

export const network = {
  getNetworkAdapters: async () => execWin("powershell -Command \"Get-NetAdapter | Format-List *\""),
  getIpConfiguration: async () => execWin("ipconfig /all"),
  getRoutes: async () => execWin("route print"),
  getDnsConfiguration: async () => execWin("powershell -Command \"Get-DnsClientServerAddress\""),
  ping: async (host) => execWin(`ping ${sanitize(host)}`),
  resolveDns: async (host) => execWin(`nslookup ${sanitize(host)}`),
  getActiveConnections: async () => execWin("netstat -ano"),
  getListeningPorts: async () => execWin("netstat -an | find \"LISTENING\""),
  getNetworkStatistics: async () => execWin("netstat -e"),
  enableAdapter: async (name) => execWin(`powershell -Command "Enable-NetAdapter -Name '${sanitize(name)}' -Confirm:$false"`),
  disableAdapter: async (name) => execWin(`powershell -Command "Disable-NetAdapter -Name '${sanitize(name)}' -Confirm:$false"`),
  configureIp: async (name, ip, mask, gateway) => execWin(`netsh interface ip set address name="${sanitize(name)}" static ${sanitize(ip)} ${sanitize(mask)} ${sanitize(gateway)}`),
  configureDns: async (name, dns) => execWin(`netsh interface ip set dns name="${sanitize(name)}" static ${sanitize(dns)}`)
};

export const firewall = {
  getFirewallStatus: async () => execWin("netsh advfirewall show allprofiles state"),
  getFirewallProfiles: async () => execWin("netsh advfirewall show allprofiles"),
  listFirewallRules: async () => execWin("netsh advfirewall firewall show rule name=all"),
  getFirewallRule: async (name) => execWin(`netsh advfirewall firewall show rule name="${sanitize(name)}"`),
  createFirewallRule: async (name, dir, action) => execWin(`netsh advfirewall firewall add rule name="${sanitize(name)}" dir=${sanitize(dir)} action=${sanitize(action)}`),
  updateFirewallRule: async (name, newParams) => execWin(`netsh advfirewall firewall set rule name="${sanitize(name)}" new ${newParams}`),
  deleteFirewallRule: async (name) => execWin(`netsh advfirewall firewall delete rule name="${sanitize(name)}"`),
  enableFirewall: async () => execWin("netsh advfirewall set allprofiles state on"),
  disableFirewall: async () => execWin("netsh advfirewall set allprofiles state off"),
  enableFirewallProfile: async (profile) => execWin(`netsh advfirewall set ${sanitize(profile)}profile state on`),
  disableFirewallProfile: async (profile) => execWin(`netsh advfirewall set ${sanitize(profile)}profile state off`)
};

export const services = {
  listServices: async () => execWin("sc query type= service state= all"),
  getService: async (name) => execWin(`sc query "${sanitize(name)}"`),
  searchServices: async (query) => execWin(`powershell -Command "Get-Service -Name '*${sanitize(query)}*'"`),
  startService: async (name) => execWin(`sc start "${sanitize(name)}"`),
  stopService: async (name) => execWin(`sc stop "${sanitize(name)}"`),
  restartService: async (name) => {
    await execWin(`sc stop "${sanitize(name)}"`);
    return execWin(`sc start "${sanitize(name)}"`);
  },
  pauseService: async (name) => execWin(`sc pause "${sanitize(name)}"`),
  resumeService: async (name) => execWin(`sc continue "${sanitize(name)}"`),
  enableService: async (name) => execWin(`sc config "${sanitize(name)}" start= auto`),
  disableService: async (name) => execWin(`sc config "${sanitize(name)}" start= disabled`),
  setServiceStartupType: async (name, type) => execWin(`sc config "${sanitize(name)}" start= ${sanitize(type)}`),
  getServiceDependencies: async (name) => execWin(`sc qenumdepend "${sanitize(name)}"`),
  getServiceDependents: async (name) => execWin(`powershell -Command "(Get-Service '${sanitize(name)}').DependentServices"`)
};

export const users = {
  listUsers: async () => execWin("net user"),
  getUser: async (username) => execWin(`net user "${sanitize(username)}"`),
  createUser: async (username, password) => execWin(`net user "${sanitize(username)}" "${sanitize(password)}" /add`),
  updateUser: async (username, params) => execWin(`net user "${sanitize(username)}" ${params}`),
  deleteUser: async (username) => execWin(`net user "${sanitize(username)}" /delete`),
  enableUser: async (username) => execWin(`net user "${sanitize(username)}" /active:yes`),
  disableUser: async (username) => execWin(`net user "${sanitize(username)}" /active:no`),
  changePassword: async (username, password) => execWin(`net user "${sanitize(username)}" "${sanitize(password)}"`),
  listUserGroups: async (username) => execWin(`cmd /c net user "${sanitize(username)}" | findstr /C:"Local Group Memberships"`),
  listGroups: async () => execWin("net localgroup"),
  createGroup: async (name) => execWin(`net localgroup "${sanitize(name)}" /add`),
  deleteGroup: async (name) => execWin(`net localgroup "${sanitize(name)}" /delete`),
  addUserToGroup: async (user, group) => execWin(`net localgroup "${sanitize(group)}" "${sanitize(user)}" /add`),
  removeUserFromGroup: async (user, group) => execWin(`net localgroup "${sanitize(group)}" "${sanitize(user)}" /delete`),
  listLoggedUsers: async () => execWin("query user")
};

export const software = {
  listInstalledSoftware: async () => execWin("wmic product get Name, Version /VALUE"),
  findSoftware: async (query) => execWin(`wmic product where "Name like '%%${sanitize(query)}%%'" get Name, Version`),
  getSoftwareInfo: async (name) => execWin(`wmic product where Name="${sanitize(name)}" get /FORMAT:LIST`),
  installSoftware: async (path) => execWin(`msiexec /i "${sanitize(path)}" /quiet /qn`),
  uninstallSoftware: async (name) => execWin(`wmic product where Name="${sanitize(name)}" call uninstall`),
  updateSoftware: async (path) => execWin(`msiexec /p "${sanitize(path)}" /quiet`),
  checkForUpdates: async () => execWin("powershell -Command \"Get-WindowsUpdate\"")
};

export const startup = {
  listStartupPrograms: async () => execWin("wmic startup get Caption, Command, Location /VALUE"),
  getStartupProgram: async (name) => execWin(`wmic startup where Caption="${sanitize(name)}" get /FORMAT:LIST`),
  enableStartupProgram: async (name) => execWin(`powershell -Command "Enable-ScheduledTask -TaskName '${sanitize(name)}'"`),
  disableStartupProgram: async (name) => execWin(`powershell -Command "Disable-ScheduledTask -TaskName '${sanitize(name)}'"`),
  removeStartupProgram: async (name) => execWin(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${sanitize(name)}" /f`),
  addStartupProgram: async (name, path) => execWin(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${sanitize(name)}" /t REG_SZ /d "${sanitize(path)}" /f`)
};

export const tasks = {
  listScheduledTasks: async () => execWin("schtasks /query /FO CSV /V"),
  getScheduledTask: async (name) => execWin(`schtasks /query /TN "${sanitize(name)}" /FO LIST`),
  searchScheduledTasks: async (query) => execWin(`schtasks /query /FO LIST | findstr /i "${sanitize(query)}"`),
  runScheduledTask: async (name) => execWin(`schtasks /run /TN "${sanitize(name)}"`),
  stopScheduledTask: async (name) => execWin(`schtasks /end /TN "${sanitize(name)}"`),
  enableScheduledTask: async (name) => execWin(`schtasks /change /TN "${sanitize(name)}" /ENABLE`),
  disableScheduledTask: async (name) => execWin(`schtasks /change /TN "${sanitize(name)}" /DISABLE`),
  createScheduledTask: async (name, tr) => execWin(`schtasks /create /TN "${sanitize(name)}" /TR "${sanitize(tr)}" /SC DAILY`),
  deleteScheduledTask: async (name) => execWin(`schtasks /delete /TN "${sanitize(name)}" /f`)
};

export const devices = {
  listDevices: async () => execWin("pnputil /enum-devices"),
  getDeviceInfo: async (id) => execWin(`pnputil /enum-devices /instanceid "${sanitize(id)}"`),
  searchDevices: async (query) => execWin(`pnputil /enum-devices | findstr /i "${sanitize(query)}"`),
  enableDevice: async (id) => execWin(`pnputil /enable-device "${sanitize(id)}"`),
  disableDevice: async (id) => execWin(`pnputil /disable-device "${sanitize(id)}"`),
  restartDevice: async (id) => execWin(`pnputil /restart-device "${sanitize(id)}"`),
  removeDevice: async (id) => execWin(`pnputil /remove-device "${sanitize(id)}"`),
  getDeviceDriver: async (id) => execWin(`pnputil /enum-devices /drivers /instanceid "${sanitize(id)}"`),
  listDrivers: async () => execWin("pnputil /enum-drivers")
};

export const audio = {
  getAudioDevices: async () => execWin("powershell -Command \"Get-PnpDevice -Class AudioEndpoint\""),
  getDefaultAudioDevice: async () => execWin("powershell -Command \"Get-AudioDevice -Default\""),
  setDefaultAudioDevice: async (id) => execWin(`powershell -Command "Set-AudioDevice -Index ${sanitize(id)}"`),
  getVolume: async () => execWin("powershell -Command \"(Get-AudioDevice -Playback).Volume\""),
  setVolume: async (val) => execWin(`powershell -Command "(Set-AudioDevice -PlaybackVolume ${sanitize(val)})"`),
  mute: async () => execWin("powershell -Command \"(Set-AudioDevice -PlaybackMute $true)\""),
  unmute: async () => execWin("powershell -Command \"(Set-AudioDevice -PlaybackMute $false)\""),
  playAudio: async (path) => execWin(`powershell -Command "(New-Object Media.SoundPlayer '${sanitize(path)}').Play()"`),
  stopAudio: async () => execWin("powershell -Command \"(New-Object Media.SoundPlayer).Stop()\""),
  pauseAudio: async () => execWin("powershell -Command \"# Pause audio\""),
  resumeAudio: async () => execWin("powershell -Command \"# Resume audio\""),
  isPlaying: async () => execWin("powershell -Command \"# Is Playing status\"")
};

export const display = {
  listDisplays: async () => execWin("wmic path Win32_DesktopMonitor get /FORMAT:LIST"),
  getDisplayInfo: async (id) => execWin(`wmic path Win32_DesktopMonitor where DeviceID="${sanitize(id)}" get /FORMAT:LIST`),
  getResolution: async () => execWin("powershell -Command \"Get-CimInstance Win32_VideoController | Select-Object CurrentHorizontalResolution, CurrentVerticalResolution\""),
  setResolution: async (w, h) => execWin(`powershell -Command "Set-DisplayResolution -Width ${sanitize(w)} -Height ${sanitize(h)} -Force"`),
  getRefreshRate: async () => execWin("powershell -Command \"Get-CimInstance Win32_VideoController | Select-Object RefreshRate\""),
  setRefreshRate: async (rate) => execWin(`powershell -Command "# Set Refresh Rate"`),
  setPrimaryDisplay: async (id) => execWin(`powershell -Command "# Set Primary Display ${sanitize(id)}"`),
};

export const printers = {
  listPrinters: async () => execWin("wmic printer get Name, Status /VALUE"),
  getPrinter: async (name) => execWin(`wmic printer where Name="${sanitize(name)}" get /FORMAT:LIST`),
  addPrinter: async (name, port) => execWin(`powershell -Command "Add-Printer -Name '${sanitize(name)}' -PortName '${sanitize(port)}'"`),
  removePrinter: async (name) => execWin(`powershell -Command "Remove-Printer -Name '${sanitize(name)}'"`),
  setDefaultPrinter: async (name) => execWin(`wmic printer where Name="${sanitize(name)}" call setdefaultprinter`),
  getPrinterStatus: async (name) => execWin(`wmic printer where Name="${sanitize(name)}" get PrinterStatus /VALUE`),
  pausePrinter: async (name) => execWin(`powershell -Command "Suspend-PrintJob -PrinterName '${sanitize(name)}'"`),
  resumePrinter: async (name) => execWin(`powershell -Command "Resume-PrintJob -PrinterName '${sanitize(name)}'"`),
  clearPrinterQueue: async (name) => execWin(`powershell -Command "Remove-PrintJob -PrinterName '${sanitize(name)}' -ID *"`),
};

export const bluetooth = {
  getBluetoothStatus: async () => execWin("powershell -Command \"Get-Service bthserv\""),
  enableBluetooth: async () => execWin("powershell -Command \"Start-Service bthserv\""),
  disableBluetooth: async () => execWin("powershell -Command \"Stop-Service bthserv\""),
  listBluetoothDevices: async () => execWin("powershell -Command \"Get-PnpDevice -Class Bluetooth\""),
  getBluetoothDevice: async (id) => execWin(`powershell -Command "Get-PnpDevice -InstanceId '${sanitize(id)}'"`),
  pairDevice: async (mac) => execWin(`powershell -Command "# Pair device ${sanitize(mac)}"`),
  removeDevice: async (id) => execWin(`pnputil /remove-device "${sanitize(id)}"`)
};

export const usb = {
  listUsbDevices: async () => execWin("wmic path Win32_USBControllerDevice get Dependent"),
  getUsbDevice: async (id) => execWin(`powershell -Command "Get-PnpDevice -InstanceId '${sanitize(id)}'"`),
  enableUsbDevice: async (id) => execWin(`pnputil /enable-device "${sanitize(id)}"`),
  disableUsbDevice: async (id) => execWin(`pnputil /disable-device "${sanitize(id)}"`),
  removeUsbDevice: async (id) => execWin(`pnputil /remove-device "${sanitize(id)}"`)
};

export const power = {
  getPowerStatus: async () => execWin("wmic path Win32_Battery get BatteryStatus, EstimatedChargeRemaining /VALUE"),
  getPowerPlans: async () => execWin("powercfg /list"),
  getActivePowerPlan: async () => execWin("powercfg /getactivescheme"),
  setPowerPlan: async (id) => execWin(`powercfg /setactive ${sanitize(id)}`),
  shutdown: async () => execWin("shutdown /s /t 0"),
  restart: async () => execWin("shutdown /r /t 0"),
  sleep: async () => execWin("rundll32.exe powrprof.dll,SetSuspendState 0,1,0"),
  hibernate: async () => execWin("shutdown /h"),
  lock: async () => execWin("rundll32.exe user32.dll,LockWorkStation"),
  logout: async () => execWin("shutdown /l"),
  cancelShutdown: async () => execWin("shutdown /a")
};

export const environment = {
  getEnvironmentVariables: async () => execWin("cmd /c set"),
  getEnvironmentVariable: async (name) => execWin(`cmd /c echo %${sanitize(name)}%`),
  setEnvironmentVariable: async (name, value) => execWin(`setx ${sanitize(name)} "${sanitize(value)}"`),
  deleteEnvironmentVariable: async (name) => execWin(`reg delete "HKCU\\Environment" /v "${sanitize(name)}" /f`),
  getPath: async () => execWin("cmd /c echo %PATH%"),
  addToPath: async (val) => execWin(`setx PATH "%PATH%;${sanitize(val)}"`),
  removeFromPath: async (val) => execWin(`powershell -Command "# Remove from PATH"`)
};

export const registry = {
  getRegistryValue: async (path, name) => execWin(`reg query "${sanitize(path)}" /v "${sanitize(name)}"`),
  setRegistryValue: async (path, name, val) => execWin(`reg add "${sanitize(path)}" /v "${sanitize(name)}" /d "${sanitize(val)}" /f`),
  deleteRegistryValue: async (path, name) => execWin(`reg delete "${sanitize(path)}" /v "${sanitize(name)}" /f`),
  listRegistryKeys: async (path) => execWin(`reg query "${sanitize(path)}"`),
  createRegistryKey: async (path) => execWin(`reg add "${sanitize(path)}" /f`),
  deleteRegistryKey: async (path) => execWin(`reg delete "${sanitize(path)}" /f`),
  exportRegistry: async (path, dest) => execWin(`reg export "${sanitize(path)}" "${sanitize(dest)}" /y`),
  importRegistry: async (file) => execWin(`reg import "${sanitize(file)}"`)
};

export const logs = {
  listEventLogs: async () => execWin("wevtutil el"),
  getEventLog: async (name) => execWin(`wevtutil qe "${sanitize(name)}" /c:10 /rd:true /f:text`),
  getEvents: async (name, level) => execWin(`wevtutil qe "${sanitize(name)}" /q:"*[System[(Level=${sanitize(level)})]]" /c:10 /f:text`),
  searchEvents: async (query) => execWin(`powershell -Command "Get-WinEvent -FilterHashtable @{LogName='System'} | Where-Object {$_.Message -like '*${sanitize(query)}*'}"`),
  exportEvents: async (name, dest) => execWin(`wevtutil epl "${sanitize(name)}" "${sanitize(dest)}"`)
};

export const security = {
  getSecurityStatus: async () => execWin("powershell -Command \"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct\""),
  getDefenderStatus: async () => execWin("powershell -Command \"Get-MpComputerStatus\""),
  getAntivirusStatus: async () => execWin("powershell -Command \"Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntivirusProduct\""),
  getFirewallStatus: async () => firewall.getFirewallStatus(),
  getSecurityPolicies: async () => execWin("secedit /export /cfg %temp%\\secconfig.cfg && type %temp%\\secconfig.cfg"),
  getLoggedSessions: async () => execWin("query session"),
  getLocalAdministrators: async () => execWin("net localgroup administrators")
};

export const monitoring = {
  getCpuMetrics: async () => hardware.getCpuUsage(),
  getMemoryMetrics: async () => hardware.getMemoryUsage(),
  getDiskMetrics: async () => storage.getDiskUsage(),
  getNetworkMetrics: async () => network.getNetworkStatistics(),
  getProcessMetrics: async (pid) => processes.getProcessDetails(pid),
  getSystemMetrics: async () => system.getSystemInfo(),
  monitorCpu: async (cb, ms = 2000) => setInterval(async () => cb(await hardware.getCpuUsage()), ms),
  monitorMemory: async (cb, ms = 2000) => setInterval(async () => cb(await hardware.getMemoryUsage()), ms),
  monitorDisk: async (cb, ms = 5000) => setInterval(async () => cb(await storage.getDiskUsage()), ms),
  monitorNetwork: async (cb, ms = 2000) => setInterval(async () => cb(await network.getNetworkStatistics()), ms),
  monitorProcess: async (pid, cb, ms = 2000) => setInterval(async () => cb(await processes.getProcessDetails(pid)), ms),
  monitorSystem: async (cb, ms = 5000) => setInterval(async () => cb(await system.getSystemInfo()), ms)
};

export const terminal = {
  execute: async (command) => {
    return await windows.command(command);
  }
};

export const diagnostics = {
  runSystemDiagnostics: async () => {
    const cpu = await hardware.getCpuUsage();
    const disk = await storage.getDiskUsage();
    const sec = await security.getDefenderStatus();
    
    return {
      status: "OK",
      results: {
        CPU: cpu.status === "success" ? "OK" : "WARNING",
        DISQUE: disk.status === "success" ? "OK" : "ERROR",
        SÉCURITÉ: sec.status === "success" ? "OK" : "UNKNOWN"
      }
    };
  }
};

export const search = {
  searchFiles: async (p, q) => files.searchFiles(p, q),
  searchProcesses: async (q) => processes.findProcesses(q),
  searchServices: async (q) => services.searchServices(q),
  searchUsers: async (q) => execWin(`net user | findstr /i "${sanitize(q)}"`),
  searchSoftware: async (q) => software.findSoftware(q),
  searchDevices: async (q) => devices.searchDevices(q),
  searchTasks: async (q) => tasks.searchScheduledTasks(q),
  searchEvents: async (q) => logs.searchEvents(q)
};

export const actions = {
  restartService: async (name) => {
    const check = await services.getService(name);
    if (check.status === "error") return check;
    
    await services.stopService(name);
    await services.startService(name);
    return await services.getService(name);
  },
  restartComputer: async () => power.restart(),
  cleanupSystem: async () => storage.cleanTemporaryFiles(),
  diagnoseNetwork: async () => network.getIpConfiguration(),
  diagnoseDisk: async (drive) => storage.getDriveHealth(drive),
  diagnoseSystem: async () => diagnostics.runSystemDiagnostics(),
  restartApplication: async (pid, startCmd) => {
    await processes.forceKillProcess(pid);
    return await processes.startProcess(startCmd);
  }
};
