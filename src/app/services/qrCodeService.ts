// QR Code Generation and Scanning Service
import QRCode from 'qrcode';

export interface QRData {
  serialNumber: string;
  transactionHash: string;
  timestamp: number;
}

class QRCodeService {
  // Generate QR code as data URL
  async generateQRCode(data: QRData): Promise<string> {
    try {
      const jsonData = JSON.stringify(data);
      const qrDataUrl = await QRCode.toDataURL(jsonData, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  // Parse QR code data
  parseQRData(qrString: string): QRData | null {
    try {
      const data = JSON.parse(qrString);
      if (data.serialNumber && data.transactionHash && data.timestamp) {
        return data as QRData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }

  // Download QR code as image
  downloadQRCode(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const qrCodeService = new QRCodeService();
