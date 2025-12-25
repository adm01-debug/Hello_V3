# Webhooks

## Overview
Webhooks allow you to receive real-time notifications when events occur.

## Event Types
- `call.started` - Call initiated
- `call.ended` - Call completed
- `transcription.completed` - Transcription ready
- `contact.created` - New contact added
- `user.updated` - User profile changed

## Configuration
Configure webhooks in Settings > Webhooks:
1. Add webhook URL
2. Select events to subscribe
3. Save webhook secret for verification

## Payload Format
```json
{
  "id": "evt_123",
  "type": "call.ended",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "callId": "call_456",
    "duration": 120,
    "status": "completed"
  }
}
```

## Verification
Each webhook includes `X-Webhook-Signature` header:
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Retry Policy
- Failed webhooks are retried 3 times
- Exponential backoff: 1s, 5s, 25s
- After 3 failures, webhook is disabled
