import { BadRequestException, Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'pooti-accounting-receipts';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB decoded — client compresses well below this; this is a backstop, not the target size.

/**
 * Same Application Default Credentials pattern as SheetsService: locally the
 * key file from GOOGLE_APPLICATION_CREDENTIALS, on Cloud Run the attached
 * service account — no branching, no key file in production.
 */
@Injectable()
export class ImagesService {
  private readonly storage = new Storage();

  /** dataUrl is a browser `canvas.toDataURL()` string: "data:image/jpeg;base64,...." */
  async uploadReceiptImage(dataUrl: string, businessDate: string): Promise<string> {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new BadRequestException('imageBase64 must be a jpeg/png/webp data URL');
    }
    const [, mimeType, base64] = match;
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Image too large — please retake or let the app compress it further');
    }

    const extension = mimeType.split('/')[1];
    const objectName = `receipts/${businessDate}/${randomUUID()}.${extension}`;
    const file = this.storage.bucket(BUCKET_NAME).file(objectName);

    await file.save(buffer, { contentType: mimeType, resumable: false });

    return `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`;
  }
}
