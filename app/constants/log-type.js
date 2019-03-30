export interface SystemLog {
    MemAvailable: number,
    MemTotal: number,
    SwapFree: number,
    SwapTotal: number,
    ncpus: number,
    cpus: Object,
    gpu_fan_speed: number,
    gpu_graphics_clock: number,
    gpu_mem_clock: number,
    gpu_memory_free: number,
    gpu_memory_total: number,
    gpu_name: string,
    gpu_power_draw: number,
    gpu_power_limit: number,
    gpu_shared_memory_free: number,
    gpu_shared_memory_total: number,
    gpu_sm_clock: number,
    gpu_temp: number,
    gpu_video_clock: number,
    nv_dec_usage: number,
    nv_enc_usage: number,
    nv_gpu_usage: number,
    nv_mem_usage: number
}

export interface ProcessLog {
    children: Object,
    cmdline: string,
    comm: string,
    cpu_usage: number,
    disk_read: number,
    disk_write: number,
    gpu_memory_used: number,
    mem: number,
    net_receive: number,
    net_send: number,
    nv_dec_usage: number,
    nv_enc_usage: number,
    nv_mem_usage: number,
    nv_sm_usage: number,
    nv_type: string,
    ppid: number,
    resident_mem: number,
    service: string,
    shared_mem: number,
    virtual_mem: number,
    // not in raw format
    disk_total: number,
    gpu_usage_total: number,
    isGenesis: boolean,
    isSpawner: boolean,
    net_total: number,
    type: string,
    cgroup: string,
    cwd: string,
    exe: string
}

export function processLog() {
    return {
        children: {},
        cmdline: "",
        comm: "",
        cpu_usage: 0,
        disk_read: 0,
        disk_write: 0,
        gpu_memory_used: 0,
        mem: 0,
        net_receive: 0,
        net_send: 0,
        nv_dec_usage: 0,
        nv_enc_usage: 0,
        nv_mem_usage: 0,
        nv_sm_usage: 0,
        nv_type: "",
        ppid: 0,
        resident_mem: 0,
        service: "",
        shared_mem: 0,
        virtual_mem: 0,
        disk_total: 0,
        gpu_usage_total: 0,
        isGenesis: false,
        isSpawner: false,
        net_total: 0,
        type: "",
        cgroup: "",
        exe: "",
        cwd: ""
    }
}

export interface Log {
    sys: SystemLog,
    proc: Array<ProcessLog>
}

