/**
 * ARCHITECTURE LINUX - EXPORTS INDIVIDUELS
 * Fichier : linux-system-manager.js
 */


async function execLinux(cmd) {
  try {
    const { stdout, stderr } = await window.command(cmd);
    const hasError = stderr && (
      stderr.toLowerCase().includes("error") || 
      stderr.toLowerCase().includes("permission denied") ||
      stderr.toLowerCase().includes("not found")
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
// MODULES LINUX (Exemples clés)
// ==========================================

export const system = {
  getSystemInfo: async () => execLinux("uname -a && lsb_release -a 2>/dev/null || cat /etc/os-release"),
  getHostname: async () => execLinux("hostname"),
  getCurrentUser: async () => execLinux("whoami"),
  getUptime: async () => execLinux("uptime -p"),
  getDateTime: async () => execLinux("date --iso-8601=seconds"),
  getEnvironmentVariables: async () => execLinux("printenv"),
  getComputerIdentity: async () => execLinux("cat /sys/class/dmi/id/product_uuid 2>/dev/null || cat /etc/machine-id"),
  getLinuxVersion: async () => execLinux("cat /proc/version")
};

export const hardware = {
  getCpuInfo: async () => execLinux("lscpu || cat /proc/cpuinfo"),
  getCpuUsage: async () => execLinux("top -bn1 | grep 'Cpu(s)'"),
  getCpuCores: async () => execLinux("nproc"),
  getMemoryInfo: async () => execLinux("free -m"),
  getGpuInfo: async () => execLinux("lspci | grep -i vga"),
  getMotherboardInfo: async () => execLinux("cat /sys/class/dmi/id/board_name 2>/dev/null"),
  getBiosInfo: async () => execLinux("cat /sys/class/dmi/id/bios_version 2>/dev/null")
};

export const processes = {
  listProcesses: async () => execLinux("ps aux"),
  getProcess: async (pid) => execLinux(`ps -p ${sanitize(pid)} -o pid,user,%cpu,%mem,cmd`),
  findProcesses: async (query) => execLinux(`pgrep -fl "${sanitize(query)}"`),
  startProcess: async (command) => execLinux(`nohup ${command} >/dev/null 2>&1 &`),
  killProcess: async (pid) => execLinux(`kill ${sanitize(pid)}`),
  forceKillProcess: async (pid) => execLinux(`kill -9 ${sanitize(pid)}`),
  getProcessPath: async (pid) => execLinux(`readlink -f /proc/${sanitize(pid)}/exe`)
};

export const files = {
  listDirectory: async (path) => execLinux(`ls -la "${sanitize(path)}"`),
  getFileInfo: async (path) => execLinux(`stat "${sanitize(path)}"`),
  fileExists: async (path) => execLinux(`test -f "${sanitize(path)}" && echo true || echo false`),
  directoryExists: async (path) => execLinux(`test -d "${sanitize(path)}" && echo true || echo false`),
  createFile: async (path) => execLinux(`touch "${sanitize(path)}"`),
  createDirectory: async (path) => execLinux(`mkdir -p "${sanitize(path)}"`),
  deleteFile: async (path) => execLinux(`rm -f "${sanitize(path)}"`),
  deleteDirectory: async (path) => execLinux(`rm -rf "${sanitize(path)}"`),
  readFile: async (path) => execLinux(`cat "${sanitize(path)}"`),
  writeFile: async (path, content) => execLinux(`echo "${sanitize(content)}" > "${sanitize(path)}"`)
};

export const storage = {
  listDisks: async () => execLinux("lsblk -a"),
  listPartitions: async () => execLinux("fdisk -l 2>/dev/null || cat /proc/partitions"),
  getDiskUsage: async () => execLinux("df -h"),
  getFreeSpace: async (path = "/") => execLinux(`df -h "${sanitize(path)}"`),
  mountVolume: async (src, dest) => execLinux(`mount "${sanitize(src)}" "${sanitize(dest)}"`),
  unmountVolume: async (dest) => execLinux(`umount "${sanitize(dest)}"`)
};

export const network = {
  getNetworkAdapters: async () => execLinux("ip addr show"),
  getIpConfiguration: async () => execLinux("ip a"),
  getRoutes: async () => execLinux("ip route"),
  ping: async (host) => execLinux(`ping -c 4 ${sanitize(host)}`),
  getActiveConnections: async () => execLinux("ss -tunap || netstat -tunap"),
  getListeningPorts: async () => execLinux("ss -tuln")
};

export const firewall = {
  getFirewallStatus: async () => execLinux("ufw status || iptables -L -n -v"),
  enableFirewall: async () => execLinux("ufw enable"),
  disableFirewall: async () => execLinux("ufw disable")
};

export const services = {
  listServices: async () => execLinux("systemctl list-units --type=service --all"),
  getService: async (name) => execLinux(`systemctl status ${sanitize(name)}`),
  startService: async (name) => execLinux(`systemctl start ${sanitize(name)}`),
  stopService: async (name) => execLinux(`systemctl stop ${sanitize(name)}`),
  restartService: async (name) => execLinux(`systemctl restart ${sanitize(name)}`),
  enableService: async (name) => execLinux(`systemctl enable ${sanitize(name)}`),
  disableService: async (name) => execLinux(`systemctl disable ${sanitize(name)}`)
};

export const users = {
  listUsers: async () => execLinux("cat /etc/passwd"),
  getUser: async (username) => execLinux(`id "${sanitize(username)}"`),
  createUser: async (username) => execLinux(`useradd "${sanitize(username)}"`),
  deleteUser: async (username) => execLinux(`userdel -r "${sanitize(username)}"`)
};

export const power = {
  shutdown: async () => execLinux("shutdown -h now"),
  restart: async () => execLinux("reboot"),
  sleep: async () => execLinux("systemctl suspend")
};

export const terminal = {
  execute: async (command) => linux.command(command)
};
