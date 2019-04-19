import path from 'path';

export function parseCommand(cmdline) {
    return cmdline.split(' ');
}

export function isPython(exec: string): boolean {
    return /^python((\d\.\d)|\d)*$/.test(exec);
}

export function isInterpreter(proc): boolean {
    const exe = path.basename(proc.exe);
    return proc.isShell || isPython(exe) || ['perl'].includes(exe);
}

export function distillCmdline(cmdline, isShell) {
    const exec = path.basename(parseCommand(cmdline)[0]);
    const args = cmdline.split(' ');
    if (isShell) {
        args.shift();
        for (const arg of args) {
            if (arg[0] === '-') {
                args.shift();
            } else {
                break;
            }
        }
        if (args.join(' ')) {
            return distillCmdline(args.join(' '));
        }
    }
    if (['env', 'cross-env'].includes(exec)) {
        args.shift();
        for (const arg of Object.values(args)) {
            if (arg[0] === '-') {
                args.shift();
            } else {
                break;
            }
        }
        for (const arg of Object.values(args)) {
            if (arg.includes('=')) {
                args.shift();
            } else {
                break;
            }
        }
        return distillCmdline(args.join(' '));
    }
    if (isPython(exec) || ['perl'].includes(exec)) {
        args.shift();
        for (const arg of Object.values(args)) {
            if (arg[0] === '-') {
                args.shift();
            } else {
                break;
            }
        }
        if (args.join(' ')) {
            return distillCmdline(args.join(' '));
        }
    }
    return exec;
}

function distillCmdlineForWine(cmdline) {
    return distillCmdline(cmdline.replace(/Program Files/g, 'Program_Files').replace(/\\/g, '/'));
}

export function parseComm(comm) {
    if (!comm) return "";

    let start = 0;
    let end = comm.length;
    if (comm.startsWith('(')) {
        start += 1;
    }
    if (comm.endsWith(')')) {
        end -= 1;
    }
    return comm.substring(start, end);
}

export function getDisplayName(proc) {
    const fromComm = parseComm(proc.comm);
    let fromCmdline;
    if (proc.cmdline) {
        if (proc.type !== 'wine') {
            fromCmdline = distillCmdline(proc.cmdline, proc.isShell);
        } else {
            fromCmdline = distillCmdlineForWine(proc.cmdline);
        }
    }
    let displayName;
    if (fromCmdline && (fromCmdline.includes(fromComm) || isInterpreter(proc))) {
        displayName = fromCmdline;
    } else {
        displayName = fromComm;
    }
    return displayName;
}

export function procUniqueID(proc) {
    return proc.pid + proc.comm + proc.cmdline;
}
