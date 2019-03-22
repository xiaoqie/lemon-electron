import path from 'path';
import {isShell} from "./shell";


function getDisplayNameByCmdline(cmdline) {
    const exec = path.basename(cmdline.split(' ')[0]);
    if (isShell(exec)) {
        const args = cmdline.split(' ');
        args.shift();
        for (const arg of args) {
            if (arg[0] === '-') {
                args.shift();
            } else {
                break;
            }
        }
        return getDisplayName({cmdline: args.join(' '), comm: ''});
    }
    if (['env', 'cross-env'].includes(exec)) {
        const args = cmdline.split(' ');
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
        return getDisplayName({cmdline: args.join(' '), comm: ''});
    }
    return exec;
}

export function getDisplayName(proc) {
    let fromCmdline;
    let fromComm;
    let displayName;
    if (proc.cmdline) {
        fromCmdline = getDisplayNameByCmdline(proc.cmdline);
    }
    let start = 0;
    let end = proc.comm.length;
    if (proc.comm.startsWith('(')) {
        start += 1;
    }
    if (proc.comm.endsWith(')')) {
        end -= 1;
    }
    fromComm = proc.comm.substring(start, end);
    if (fromCmdline && fromCmdline.includes(fromComm)) {
        displayName = fromCmdline;
    } else {
        displayName = fromComm;
    }
    return displayName;
}
