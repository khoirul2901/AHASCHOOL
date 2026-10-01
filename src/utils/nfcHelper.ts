// Helper for Web NFC (NDEFReader) and USB NFC Readers

export interface NfcReadResult {
  serialNumber: string;
  records?: { recordType: string; data: string }[];
}

export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function formatNfcUid(rawUid: string): string {
  if (!rawUid) return '';
  // Remove non-hex characters
  const clean = rawUid.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  if (clean.length >= 8 && clean.length % 2 === 0) {
    // Group in pairs: 04:A2:3F:B1...
    return clean.match(/.{1,2}/g)?.join(':') || clean;
  }
  return rawUid.toUpperCase().trim();
}

export class NfcReaderManager {
  private ndefReader: any = null;
  private abortController: AbortController | null = null;
  private isScanning = false;

  public async startScan(
    onReading: (result: NfcReadResult) => void,
    onError?: (err: Error) => void
  ): Promise<boolean> {
    if (!isWebNfcSupported()) {
      onError?.(new Error('Web NFC tidak didukung di browser ini. Gunakan Chrome di Android atau reader USB NFC.'));
      return false;
    }

    try {
      this.abortController = new AbortController();
      // @ts-ignore
      this.ndefReader = new window.NDEFReader();
      await this.ndefReader.scan({ signal: this.abortController.signal });
      this.isScanning = true;

      this.ndefReader.addEventListener('reading', (event: any) => {
        let serial = event.serialNumber || '';
        const parsedRecords: { recordType: string; data: string }[] = [];

        if (event.message && event.message.records) {
          for (const record of event.message.records) {
            try {
              const textDecoder = new TextDecoder(record.encoding || 'utf-8');
              parsedRecords.push({
                recordType: record.recordType,
                data: textDecoder.decode(record.data),
              });
            } catch (e) {
              // ignore binary decoding errors
            }
          }
        }

        onReading({
          serialNumber: formatNfcUid(serial),
          records: parsedRecords,
        });
      });

      this.ndefReader.addEventListener('readingerror', () => {
        onError?.(new Error('Gagal membaca kartu NFC. Pastikan kartu ditempelkan dengan stabil.'));
      });

      return true;
    } catch (err: any) {
      this.isScanning = false;
      onError?.(err);
      return false;
    }
  }

  public stopScan() {
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (e) {
        // ignore
      }
      this.abortController = null;
    }
    this.ndefReader = null;
    this.isScanning = false;
  }

  public getScanningState(): boolean {
    return this.isScanning;
  }
}

export const nfcManager = new NfcReaderManager();
