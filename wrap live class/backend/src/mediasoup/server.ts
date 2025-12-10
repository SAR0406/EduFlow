import * as mediasoup from 'mediasoup';
import { Worker, Router } from 'mediasoup/node/lib/types';
import { config, numWorkers } from './config';

export class MediasoupServer {
  private workers: Worker[] = [];
  private nextWorkerIdx = 0;
  private routers: Map<string, Router> = new Map();

  async init() {
    console.log(`Creating ${numWorkers} MediaSoup workers...`);
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: config.worker.logLevel,
        logTags: config.worker.logTags,
        rtcMinPort: config.worker.rtcMinPort,
        rtcMaxPort: config.worker.rtcMaxPort,
      });

      worker.on('died', () => {
        console.error(`MediaSoup worker died, PID: ${worker.pid}`);
        setTimeout(() => process.exit(1), 2000);
      });

      this.workers.push(worker);
      console.log(`Worker ${i + 1} created, PID: ${worker.pid}`);
    }

    console.log('MediaSoup server initialized successfully');
  }

  getWorker(): Worker {
    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  async createRouter(roomId: string): Promise<Router> {
    const worker = this.getWorker();
    const router = await worker.createRouter({
      mediaCodecs: config.router.mediaCodecs,
    });

    this.routers.set(roomId, router);
    console.log(`Router created for room: ${roomId}`);
    
    return router;
  }

  getRouter(roomId: string): Router | undefined {
    return this.routers.get(roomId);
  }

  deleteRouter(roomId: string) {
    const router = this.routers.get(roomId);
    if (router) {
      router.close();
      this.routers.delete(roomId);
      console.log(`Router closed for room: ${roomId}`);
    }
  }

  getWorkers(): Worker[] {
    return this.workers;
  }
}

export const mediasoupServer = new MediasoupServer();
