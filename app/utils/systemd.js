const dbus = require('dbus-native');
const path = require('path');

function invoke(args) {
    const bus = dbus.systemBus();
    return new Promise((resolve, reject) => {
        bus.invoke(args, (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
            bus.connection.end();
        });
    });
}

async function getUnitByPID(pid) {
    let out;
    try {
        out = await invoke({
            path: '/org/freedesktop/systemd1',
            destination: 'org.freedesktop.systemd1',
            interface: 'org.freedesktop.systemd1.Manager',
            member: 'GetUnitByPID',
            signature: 'u',
            body: [parseInt(pid)]
        });
    } catch (e) {
        return null;
    }
    let result = '';
    let lastI = -1;
    for (let i = 0; i < out.length; i++) {
        if (out[i] === '_') {
            result += out.substring(lastI + 1, i);
            result += String.fromCharCode(parseInt(out.substring(i + 1, i + 3), 16));
            i += 2;
            lastI = i;
        }
    }
    result += out.substring(lastI + 1);
    return path.basename(result);
}

async function getUnitsByPIDs(pids) {
    const result = {};
    for await (const pid of pids) {
        result[pid] = await getUnitByPID(pid);
    }
    return result;
}

const cache = {};
export async function fetchUnits(procs) {
    const result = {};
    for await (const pid of Object.keys(procs)) {
        const proc = procs[pid];
        const id = pid + proc.comm + proc.cmdline;
        if (id in cache) {
            result[pid] = cache[id];
        } else {
            result[pid] = await getUnitByPID(pid);
            cache[id] = result[pid];
        }
    }
    return result;
}

// getUnitsByPIDs([2001, 20964]).then(out => console.log(out)).catch(err => console.log(err));
