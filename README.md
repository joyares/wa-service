# wa-service — WhatsApp Automation for Friends Online ISP

WhatsApp automation service for Friends Online ISP. Sends payment confirmations, welcome messages, invoices, and bulk notices to customers via WhatsApp.

## Features

- ✅ Payment confirmation after bill payment
- 🎉 Welcome message + credentials for new customers  
- 📋 Monthly invoice reminders
- 📢 Bulk notice to all customers
- ⚠️ Maintenance notices
- 🤖 FAQ auto-reply bot (bill, speed, package, office queries)
- 🔐 API key authentication
- 📱 QR code web viewer

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your details
```

### 3. Start service
```bash
npm start
```

### 4. Scan QR code
Open browser: `http://localhost:3000/qr`
Scan with WhatsApp → Settings → Linked Devices

---

## API Endpoints

All POST endpoints require `x-api-key` header (set in .env).

### GET /status
Check if WhatsApp is connected.

### GET /qr
View QR code in browser.

### POST /send-payment
```json
{
  "phone": "01712345678",
  "customerName": "রহিম সাহেব",
  "amount": "600",
  "invoiceNo": "INV-001",
  "dueDate": "01 Dec 2026",
  "month": "November 2026"
}
```

### POST /send-welcome
```json
{
  "phone": "01712345678",
  "customerName": "করিম সাহেব",
  "username": "karim123",
  "password": "pass@123",
  "customerId": "FO-0042",
  "package": "20Mbps",
  "expiryDate": "31 Nov 2026"
}
```

### POST /send-invoice
```json
{
  "phone": "01712345678",
  "customerName": "জামাল সাহেব",
  "invoiceNo": "INV-002",
  "amount": "700",
  "dueDate": "10 Dec 2026",
  "month": "December 2026"
}
```

### POST /send-notice
```json
{
  "phones": ["01712345678", "01812345678"],
  "title": "গুরুত্বপূর্ণ নোটিশ",
  "message": "আমাদের অফিস ১০ নভেম্বর বন্ধ থাকবে।"
}
```

### POST /send-maintenance
```json
{
  "phones": ["01712345678", "01812345678"],
  "startTime": "রাত ২টা",
  "endTime": "ভোর ৪টা",
  "reason": "ফাইবার আপগ্রেড",
  "area": "Kallyanpur Block-A"
}
```

---

## isp360 Integration (PHP)

```php
class WhatsAppHelper {
    private $apiUrl = 'http://localhost:3000';
    private $apiKey;

    public function __construct() {
        $this->apiKey = config('wa.api_key');
    }

    public function sendPayment($phone, $name, $amount, $invoiceNo) {
        return $this->post('/send-payment', [
            'phone'        => $phone,
            'customerName' => $name,
            'amount'       => $amount,
            'invoiceNo'    => $invoiceNo,
            'dueDate'      => date('d M Y', strtotime('+1 month')),
        ]);
    }

    private function post($endpoint, $data) {
        $ch = curl_init($this->apiUrl . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($data),
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->apiKey,
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $result = curl_exec($ch);
        curl_close($ch);
        return json_decode($result, true);
    }
}
```

---

## Production (PM2)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Run Tests

```bash
# Start service first, then:
npm test
```
