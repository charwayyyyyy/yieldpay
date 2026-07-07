# YieldPay AI Testing Checklist

Use this checklist to verify the end-to-end functionality of YieldPay AI.

1.  [ ] Farmer registers crop by USSD (simulate via POST to `/api/ussd`).
2.  [ ] Crop appears on buyer marketplace (`/` route).
3.  [ ] Buyer funds crop by submitting the form.
4.  [ ] Transaction created with `pending` status.
5.  [ ] Moolre payment returns checkout URL.
6.  [ ] Webhook receives successful payment (`/api/webhooks/moolre`).
7.  [ ] Subscription created for the buyer.
8.  [ ] Crop funding amount updates.
9.  [ ] Farmer receives disbursement via Moolre Disbursement API.
10. [ ] Farmer receives SMS alert.
11. [ ] Farmer updates crop progress by USSD.
12. [ ] Buyer dashboard (`/dashboard`) reflects the new stage.
13. [ ] Farmer files insurance claim by USSD.
14. [ ] AI processes claim (`/api/insurance/process`).
15. [ ] Claim is stored with AI decision and confidence.
16. [ ] Approved claim triggers payout disbursement.
17. [ ] SMS sent to farmer with insurance decision.
