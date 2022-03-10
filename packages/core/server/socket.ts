import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { SocketEvent } from '../typings/server';

const wss = new WebSocketServer({
  port: 3366,
}, () => {
  console.log('wss启动成功');
});
let app: WebSocket | null = null;
let target: WebSocket | null = null;

function handleEvent(message: string, ws: WebSocket) {
  const data: SocketEvent = JSON.parse(message);
  console.log(`收到来自【${data.id}】的信息：\n${JSON.stringify(data, null, 2)}`);
  switch (data.type) {
    case 'init':
      if (data.id === 'app') {
        app = ws;
      } else if (data.id === 'target') {
        target = ws;
      }
      break;
    case 'dragover':
    case 'drop':
      if (data.id === 'target' || !target) {
        return;
      }
      target.send(message);
      break;
    default:
      break;
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    handleEvent(data.toString('utf-8'), ws);
  });
});
