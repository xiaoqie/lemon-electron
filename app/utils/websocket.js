let ws: WebSocket;
export function connect(url, callback) {
    const tryConnect = () => {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        console.log("connecting");

        ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('connected');
        };

        ws.onclose = () => {
            console.log('disconnected');
            callback({});
        };

        ws.onmessage = (data) => {
            callback(JSON.parse(data.data));
        };
    };
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send("heartbeat");
        } else {
            callback({});
        }
        tryConnect()
    }, 5000);
    tryConnect();
}
