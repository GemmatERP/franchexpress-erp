# WhatsApp Templates Reference & Creation Guide

This document lists all the **WhatsApp Message Templates** required by FranchExpress ERP. To enable automated notifications for every shipment stage, you must submit and get these approved in your **Meta WhatsApp Manager**.

---

## 📋 Summary Table of Active Templates

| # | Template Name | Recipient | Trigger Status | Body Variables (Count) | Call Button | Status |
|---|---|---|---|---|---|---|
| 1 | `fe_rcvr_processing` | Consignee (Receiver) | Booked, Processing, Pending | `{{1}}` (Name), `{{2}}` (AWB) (2) | No | Active |
| 2 | `fe_rcvr_in_transit` | Consignee (Receiver) | Shipped, Transit, In Transit | `{{1}}` (Name), `{{2}}` (AWB) (2) | No | Active |
| 3 | `fe_rcvr_out_delivery` | Consignee (Receiver) | Out for/of Delivery | `{{1}}` (Name), `{{2}}` (AWB) (2) | No | Active |
| 4 | `fe_rcvr_delivered` | Consignee (Receiver) | Delivered | `{{1}}` (Name), `{{2}}` (AWB) (2) | No | Active |
| 5 | `fe_sndr_processing` | Consignor (Sender) | Booked, Processing, Pending | `{{1}}` (Name), `{{2}}` (AWB), `{{3}}` (Receiver Name) (3) | No | Active |
| 6 | `fe_sndr_in_transit` | Consignor (Sender) | Shipped, Transit, In Transit | `{{1}}` (Name), `{{2}}` (AWB), `{{3}}` (Receiver Name) (3) | No | Active |
| 7 | `fe_sndr_out_delivery` | Consignor (Sender) | Out for/of Delivery | `{{1}}` (Name), `{{2}}` (AWB), `{{3}}` (Receiver Name) (3) | No | Active |
| 8 | `fe_sndr_delivered` | Consignor (Sender) | Delivered | `{{1}}` (Name), `{{2}}` (AWB), `{{3}}` (Receiver Name) (3) | No | Active |
| 9 | `fe_rcvr_returned` | Consignee (Receiver) | Returned | `{{1}}` (Name), `{{2}}` (AWB) (2) | Yes (+91 90424 11159) | **Active** |
| 10| `fe_sndr_returned` | Consignor (Sender) | Returned | `{{1}}` (Name), `{{2}}` (AWB), `{{3}}` (Receiver Name) (3) | Yes (+91 90424 11159) | **Active** |

> [!NOTE]
> All other statuses like `'Reached Destination'` and `'Holding at HUB'` are bypassed. The ERP notifications dispatcher has been configured to silently ignore these statuses to prevent sending unwanted notifications or generating errors for unmapped templates.

---

## 🆕 Returned Status Mappings (Created & Active)

The templates below correspond to the specific `'Returned'` status mapping. They utilize native WhatsApp Call buttons so that users can tap a button to dial instead of copy-pasting numbers from the text body.

### 1. `fe_rcvr_returned` (Consignee - Returned)
* **Category**: Utility
* **Language**: English
* **Header**: Shipment Returned
* **Body Text**:
  ```text
  Dear {{1}}, your FranchExpress shipment *(AWB {{2}})* has been returned to the sender. For support, call us. — *Gemmat x FranchExpress Team*
  ```
* **Buttons**:
  * Type: Phone Number
  * Button Text: `Call Support`
  * Phone Number: `+91 90424 11159`
* **Sample Values**:
  * `{{1}}` = `Ramesh Kumar`
  * `{{2}}` = `FE-001234`

---

### 2. `fe_sndr_returned` (Consignor - Returned)
* **Category**: Utility
* **Language**: English
* **Header**: Shipment Returned
* **Body Text**:
  ```text
  Dear {{1}}, your FranchExpress shipment *(AWB {{2}})* to {{3}} has been returned to you. For support, call us. — *Gemmat x FranchExpress Team*
  ```
* **Buttons**:
  * Type: Phone Number
  * Button Text: `Call Support`
  * Phone Number: `+91 90424 11159`
* **Sample Values**:
  * `{{1}}` = `Suresh Babu`
  * `{{2}}` = `FE-001234`
  * `{{3}}` = `Ramesh Kumar`

---

## 🛠️ Step-by-Step Meta Developer Portal Guide

1. Log in to [developers.facebook.com](https://developers.facebook.com) and click **My Apps**.
2. Select your **FranchExpress ERP** app.
3. In the left sidebar under **WhatsApp**, select **API Setup** or **WhatsApp Manager** (or click the settings gear next to WhatsApp).
4. In WhatsApp Manager, go to **Message Templates** under the Account/Suite menu.
5. Click **Create Template**:
   * **Category**: Select `Utility`.
   * **Name**: Use the exact names from above (e.g., `fe_rcvr_returned`).
   * **Language**: Select `English` (and/or any other translation if needed).
6. Under **Template content**:
   * Add the matching **Header** text.
   * Paste the **Body Text** exactly as written above.
   * Under **Buttons**, click **Add Button**, select **Phone Number**, type **Call Support** for the label, and input `+91 90424 11159`.
7. Fill in the requested **Sample Values** for each variable `{{1}}`, `{{2}}`, etc.
8. Click **Submit** in the top right.
