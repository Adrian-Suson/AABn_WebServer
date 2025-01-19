import open from "open";
import os from "os";

function getNetworkIp() {
  const ifaces = os.networkInterfaces();
  for (const dev in ifaces) {
    if (ifaces[dev]) {
      for (const detail of ifaces[dev]) {
        if (detail.family === "IPv4" && !detail.internal) {
          return detail.address;
        }
      }
    }
  }
  return "";
}

const networkIp = getNetworkIp();
const networkAddress = `http://${networkIp}:5173`; // Adjust port if needed

open(networkAddress);
