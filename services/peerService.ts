import Peer, { DataConnection } from 'peerjs';
import { PeerMessage } from '../types';

class PeerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  
  private onDataCallback: ((data: unknown) => void) | null = null;
  private onOpenCallback: ((id: string) => void) | null = null;
  private onConnectedCallback: ((conn: DataConnection) => void) | null = null;
  private onDisconnectedCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;

  initialize(
    onOpen: (id: string) => void,
    onData: (data: unknown) => void,
    onConnected: (conn: DataConnection) => void,
    onDisconnected: () => void,
    onError: (err: any) => void
  ) {
    this.destroy(); // Ensure no existing peer instance is running

    this.onOpenCallback = onOpen;
    this.onDataCallback = onData;
    this.onConnectedCallback = onConnected;
    this.onDisconnectedCallback = onDisconnected;
    this.onErrorCallback = onError;
    
    // Connect to your live signaling server on Render.
    this.peer = new Peer(undefined, {
      host: 'ultimaterps.onrender.com', // Your Render URL
      secure: true,      // Required for HTTPS connections on Render
      port: 443,         // Default port for HTTPS
      path: '/peerjs/myapp' // The path we configured in server.js
    });


    this.peer.on('open', (id) => {
      this.onOpenCallback?.(id);
    });

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn);
      this.onConnectedCallback?.(conn);
    });

    this.peer.on('error', (err) => {
      console.error("PeerJS error:", err);
      this.onErrorCallback?.(err);
    });
    
    this.peer.on('disconnected', () => {
        // This is the peer server connection, not peer-to-peer
    });
  }

  private setupConnection(conn: DataConnection) {
      this.connection = conn;
      this.connection.on('data', (data) => {
          this.onDataCallback?.(data);
      });
      this.connection.on('open', () => {
          // Connection is ready to be used
      });
      this.connection.on('close', () => {
          this.onDisconnectedCallback?.();
          this.connection = null;
      });
      this.connection.on('error', (err) => {
          console.error('PeerJS connection error:', err);
          this.onErrorCallback?.(err);
      });
  }

  connect(peerId: string) {
    if (!this.peer) {
      this.onErrorCallback?.({type: "Peer not initialized"});
      return;
    }
    const conn = this.peer.connect(peerId);
    this.setupConnection(conn);
  }

  sendMessage(message: PeerMessage) {
    if (this.connection) {
      this.connection.send(message);
    }
  }

  destroy() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

const peerService = new PeerService();
export default peerService;
