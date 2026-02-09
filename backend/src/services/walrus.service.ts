import { config } from '../config/env';

export class WalrusService {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor() {
    this.publisherUrl = config.walrus.publisher;
    this.aggregatorUrl = config.walrus.aggregator;
  }

  async uploadMetadata(metadata: any): Promise<{ blobId: string; blobObject: any }> {
    try {
      const response = await fetch(`${this.publisherUrl}/v1/blobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.newlyCreated || !result.newlyCreated.blobObject) {
        throw new Error('Invalid response from Walrus publisher');
      }

      return {
        blobId: result.newlyCreated.blobObject.id,
        blobObject: result.newlyCreated.blobObject,
      };
    } catch (error) {
      console.error('[WalrusService] Upload error:', error);
      throw new Error(`Failed to upload metadata to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMetadata(blobId: string): Promise<any> {
    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`);

      if (!response.ok) {
        throw new Error(`Walrus fetch failed: ${response.statusText}`);
      }

      const text = await response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('[WalrusService] Download error:', error);
      throw new Error(`Failed to retrieve metadata from Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMetadataURI(blobId: string): string {
    return `https://aggregator.testnet.walrus.space/v1/blobs/${blobId}`;
  }

  async checkBlobStatus(blobId: string): Promise<{ exists: boolean; dehydrated: boolean }> {
    try {
      const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}/info`);

      if (!response.ok) {
        return { exists: false, dehydrated: false };
      }

      const info = await response.json();
      return {
        exists: true,
        dehydrated: info.dehydrated || false,
      };
    } catch (error) {
      return { exists: false, dehydrated: false };
    }
  }
}

export const walrusService = new WalrusService();
