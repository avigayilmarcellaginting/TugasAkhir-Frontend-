import { BluetoothSerial } from '@bintangf/capacitor-bluetooth-serial';
import EscPosEncoder from 'esc-pos-encoder';

export default class PrinterService {
    
    /**
     * Get a list of paired or available Bluetooth devices (SPP Profile)
     * @returns {Promise<Array>} Array of devices [{ address: string, class: number, id: string, name: string }]
     */
    static async getDevices() {
        try {
            const result = await BluetoothSerial.list();
            return result.devices || [];
        } catch (error) {
            console.error('Error fetching Bluetooth devices:', error);
            throw new Error('Gagal mengambil daftar perangkat Bluetooth. Pastikan Bluetooth aktif dan izin diberikan.');
        }
    }

    /**
     * Connect to a specific Bluetooth MAC address
     * @param {string} macAddress 
     */
    static async connect(macAddress) {
        try {
            await BluetoothSerial.connect({ address: macAddress });
            return true;
        } catch (error) {
            console.error('Error connecting to printer:', error);
            throw new Error(`Gagal terhubung ke printer (${macAddress}). Pastikan printer menyala.`);
        }
    }

    /**
     * Check if currently connected to a device
     */
    static async isConnected() {
        try {
            const result = await BluetoothSerial.isConnected();
            return result.connected;
        } catch (error) {
            return false;
        }
    }

    /**
     * Disconnect the currently connected Bluetooth device
     */
    static async disconnect() {
        try {
            await BluetoothSerial.disconnect();
            return true;
        } catch (error) {
            console.error('Error disconnecting:', error);
            return false;
        }
    }

    /**
     * Format Rupiah without symbol, just number formatting
     */
    static formatRp(num) {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num || 0);
    }

    /**
     * Pad text for left-right alignment based on character limit.
     * Example: "Subtotal" (left) | "Rp 10.000" (right) -> "Subtotal               Rp 10.000"
     */
    static alignLeftRight(leftText, rightText, maxChars) {
        const leftStr = String(leftText);
        const rightStr = String(rightText);
        const spacesRequired = maxChars - (leftStr.length + rightStr.length);
        if (spacesRequired > 0) {
            return leftStr + ' '.repeat(spacesRequired) + rightStr;
        }
        return leftStr.substring(0, maxChars - rightStr.length - 1) + " " + rightStr;
    }

    /**
     * Print standard transaction receipt
     * @param {Object} transaction 
     * @param {string} paperSize - '58mm' or '80mm'
     */
    static async printReceipt(transaction, paperSize = '58mm') {
        // CPL: Characters Per Line.
        // 58mm -> ~32 chars
        // 80mm -> ~48 chars
        const maxChars = paperSize === '80mm' ? 48 : 32;

        try {
            const encoder = new EscPosEncoder();
            
            // Build Receipt Content
            let result = encoder.initialize();

            // Store Title / Branch Name
            const branchName = transaction?.branch?.name || 'KasirPro UMKM';
            result.align('center').bold(true).line(branchName).bold(false);
            
            // Transaction Info
            const dateStr = transaction.created_at ? new Date(transaction.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID');
            result.line('Struk Pembayaran')
                  .align('left')
                  .line(`Tanggal : ${dateStr}`);
                  
            if (transaction?.customer_name) {
                result.line(`Pel: ${transaction.customer_name}`.toUpperCase());
            }
            if (transaction?.customer_phone) {
                result.line(`Telp: ${transaction.customer_phone}`);
            }

            // Separator
            result.line('-'.repeat(maxChars));

            // Details
            const details = transaction?.details || [];
            details.forEach(detail => { // Corrected: Using the passed parameter 'detail'
                const itemName = detail.product?.name || 'Item';
                const qtyPrice = `${detail.quantity} x ${this.formatRp(detail.price)}`;
                const subtotal = this.formatRp(detail.subtotal);
                
                result.line(itemName);
                result.line(this.alignLeftRight(qtyPrice, subtotal, maxChars));
            });

            // Separator
            result.line('-'.repeat(maxChars));

            // Summary
            result.line(this.alignLeftRight('Subtotal', this.formatRp(transaction.subtotal || 0), maxChars));
            
            if (transaction.discount_amount > 0) {
                result.line(this.alignLeftRight('Diskon', `-${this.formatRp(transaction.discount_amount)}`, maxChars));
            }

            result.line(this.alignLeftRight('Total', this.formatRp(transaction.total_amount || 0), maxChars));
            
            // Separator
            result.line('-'.repeat(maxChars));

            result.line(this.alignLeftRight('Tunai', this.formatRp(transaction.cash_amount || 0), maxChars));
            result.line(this.alignLeftRight('Kembali', this.formatRp(transaction.change_amount || 0), maxChars));

            // Footer
            result.line(' ')
                  .align('center')
                  .line('Terima kasih atas kunjungan Anda!')
                  .line(`Kasir: ${transaction?.user?.name || 'Kasir'}`)
                  .line(`Trx: ${transaction?.transaction_code}`)
                  .line(' ')
                  .line(' ')
                  .line(' ');

            // Encode to Uint8Array buffer
            const buffer = result.encode();

            // Convert Uint8Array to Array for JSON transmission to capacitor plugin
            // Capacitor plugin expects a string or Array of bytes
            const data = Array.from(buffer);

            // Send via Bluetooth
            await BluetoothSerial.write({ data });
            
            return true;

        } catch (error) {
            console.error('Print Error:', error);
            throw new Error('Gagal mencetak struk. ' + error.message);
        }
    }
}
