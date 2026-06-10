# FranchExpress ERP — Notification Service Recommendation

## Recommended Stack (Best Value for India)

### Phase 1 — Launch (₹0–₹500/month)
| Service    | Type       | Free Tier              | Per Unit Cost | Setup |
|------------|------------|------------------------|---------------|-------|
| Fast2SMS   | SMS        | ₹50 free (~100 SMS)   | ₹0.15–0.25   | Easy  |
| Wati.io    | WhatsApp   | 1000 conv/month free   | $0.05/conv    | Medium|

### Phase 2 — Scale (>500 consignments/month)
| Service    | Type       | Monthly Cost  | Notes |
|------------|------------|---------------|-------|
| MSG91      | SMS        | ₹0.12/SMS     | Best DLT compliance India |
| Interakt   | WhatsApp   | ₹2,499/month  | Indian startup, good support |

### Phase 3 — Enterprise
| Service    | Type       | Monthly Cost  | Notes |
|------------|------------|---------------|-------|
| Twilio     | SMS+WA     | Pay as you go | Most reliable globally |
| Kaleyra    | SMS+WA     | Custom        | India-focused enterprise |

## Quick Start
1. Sign up at fast2sms.com → get API key
2. Add to .env.local: FAST2SMS_API_KEY=your_key
3. Set NOTIFICATION_PROVIDER=fast2sms
4. Done — SMS sends automatically on new consignment

## Free Forever Option
Set NOTIFICATION_PROVIDER=none to disable notifications.
The app works fully without any notification service configured.
