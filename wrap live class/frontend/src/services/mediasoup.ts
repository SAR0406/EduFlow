import * as mediasoup from 'mediasoup-client';
import { Device } from 'mediasoup-client';
import { Transport, Producer, Consumer } from 'mediasoup-client/lib/types';
import { socketService } from './socket';

class MediasoupService {
  private device: Device | null = null;
  private sendTransport: Transport | null = null;
  private recvTransport: Transport | null = null;
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();

  async init(rtpCapabilities: any) {
    try {
      this.device = new Device();
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      console.log('✅ MediaSoup device loaded');
    } catch (error) {
      console.error('Failed to load MediaSoup device:', error);
      throw error;
    }
  }

  async createSendTransport(roomId: string): Promise<Transport> {
    return new Promise((resolve, reject) => {
      socketService.emit(
        'create-transport',
        { roomId, direction: 'send' },
        async (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          if (!this.device) {
            reject(new Error('Device not initialized'));
            return;
          }

          try {
            this.sendTransport = this.device.createSendTransport(response);

            this.sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
              socketService.emit(
                'connect-transport',
                {
                  transportId: this.sendTransport!.id,
                  dtlsParameters,
                },
                (response: any) => {
                  if (response.error) {
                    errback(new Error(response.error));
                  } else {
                    callback();
                  }
                }
              );
            });

            this.sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
              socketService.emit(
                'produce',
                {
                  transportId: this.sendTransport!.id,
                  kind,
                  rtpParameters,
                },
                (response: any) => {
                  if (response.error) {
                    errback(new Error(response.error));
                  } else {
                    callback({ id: response.producerId });
                  }
                }
              );
            });

            resolve(this.sendTransport);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async createRecvTransport(roomId: string): Promise<Transport> {
    return new Promise((resolve, reject) => {
      socketService.emit(
        'create-transport',
        { roomId, direction: 'recv' },
        async (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          if (!this.device) {
            reject(new Error('Device not initialized'));
            return;
          }

          try {
            this.recvTransport = this.device.createRecvTransport(response);

            this.recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
              socketService.emit(
                'connect-transport',
                {
                  transportId: this.recvTransport!.id,
                  dtlsParameters,
                },
                (response: any) => {
                  if (response.error) {
                    errback(new Error(response.error));
                  } else {
                    callback();
                  }
                }
              );
            });

            resolve(this.recvTransport);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  async produce(track: MediaStreamTrack): Promise<string> {
    if (!this.sendTransport) {
      throw new Error('Send transport not created');
    }

    const producer = await this.sendTransport.produce({ track });
    this.producers.set(producer.id, producer);
    
    return producer.id;
  }

  async consume(producerId: string): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      if (!this.recvTransport || !this.device) {
        reject(new Error('Receive transport or device not initialized'));
        return;
      }

      socketService.emit(
        'consume',
        {
          transportId: this.recvTransport.id,
          producerId,
          rtpCapabilities: this.device.rtpCapabilities,
        },
        async (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          try {
            const consumer = await this.recvTransport!.consume({
              id: response.id,
              producerId: response.producerId,
              kind: response.kind,
              rtpParameters: response.rtpParameters,
            });

            this.consumers.set(consumer.id, consumer);

            const stream = new MediaStream([consumer.track]);
            resolve(stream);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  closeProducer(producerId: string) {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
    }
  }

  closeConsumer(consumerId: string) {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  cleanup() {
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());
    this.producers.clear();
    this.consumers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    this.device = null;
  }

  getDevice(): Device | null {
    return this.device;
  }
}

export const mediasoupService = new MediasoupService();
export default mediasoupService;
