/**
 * ARCHITECTURE ANDROID - EXPORTS INDIVIDUELS
 * Fichier : android-system-manager.js
 */

// ==========================================
// 0. EXÉCUTEUR CENTRAL ET GESTION DES ERREURS
// ==========================================

async function execAndroid(cmd) {
  try {
    const { stdout, stderr } = await windows.command(cmd);
    const hasError = stderr && (
      stderr.toLowerCase().includes("error") || 
      stderr.toLowerCase().includes("permission denied")
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
// MODULES ANDROID
// ==========================================

export const system = {
  getSystemInfo: async () => execAndroid("getprop ro.build.display.id"),
  getAndroidVersion: async () => execAndroid("getprop ro.build.version.release"),
  getSdkVersion: async () => execAndroid("getprop ro.build.version.sdk"),
  getHostname: async () => execAndroid("getprop net.hostname"),
  getDeviceModel: async () => execAndroid("getprop ro.product.model"),
  getManufacturer: async () => execAndroid("getprop ro.product.manufacturer"),
  getUptime: async () => execAndroid("uptime")
};

export const hardware = {
  getCpuInfo: async () => execAndroid("cat /proc/cpuinfo"),
  getMemoryInfo: async () => execAndroid("cat /proc/meminfo"),
  getBatteryStatus: async () => execAndroid("dumpsys battery")
};

export const processes = {
  listProcesses: async () => execAndroid("ps -A || ps"),
  getProcess: async (pid) => execAndroid(`ps -p ${sanitize(pid)}`),
  killProcess: async (pid) => execAndroid(`kill ${sanitize(pid)}`),
  forceKillProcess: async (pid) => execAndroid(`kill -9 ${sanitize(pid)}`)
};

export const files = {
  listDirectory: async (path) => execAndroid(`ls -la "${sanitize(path)}"`),
  getFileInfo: async (path) => execAndroid(`stat "${sanitize(path)}"`),
  readFile: async (path) => execAndroid(`cat "${sanitize(path)}"`),
  writeFile: async (path, content) => execAndroid(`echo "${sanitize(content)}" > "${sanitize(path)}"`),
  deleteFile: async (path) => execAndroid(`rm -f "${sanitize(path)}"`)
};

export const storage = {
  getDiskUsage: async () => execAndroid("df -h"),
  listMounts: async () => execAndroid("cat /proc/mounts")
};

export const network = {
  getNetworkAdapters: async () => execAndroid("ip addr show"),
  getWifiStatus: async () => execAndroid("dumpsys wifi"),
  ping: async (host) => execAndroid(`ping -c 4 ${sanitize(host)}`)
};

export const software = {
  listInstalledPackages: async () => execAndroid("pm list packages"),
  findPackage: async (query) => execAndroid(`pm list packages | grep "${sanitize(query)}"`),
  installPackage: async (apkPath) => execAndroid(`pm install "${sanitize(apkPath)}"`),
  uninstallPackage: async (packageName) => execAndroid(`pm uninstall "${sanitize(packageName)}"`)
};

export const audio = {
  getVolumeStatus: async () => execAndroid("dumpsys audio"),
  setVolume: async (stream, level) => execAndroid(`media volume --stream ${sanitize(stream)} --set ${sanitize(level)}`)
};

export const power = {
  shutdown: async () => execAndroid("reboot -p"),
  restart: async () => execAndroid("reboot")
};

export const terminal = {
  execute: async (command) => android.command(command)
};
