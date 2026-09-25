# Taxi Booking Operator Desk

One operator’s booking, dispatch, and affiliate overflow domain. Customers book transfers; staff assign Drivers or Partners; Partners settle money with the operator.

## Language

### People

**Customer**:
The person who books and pays for a transfer. Captured per transfer; the operator may record one on their behalf.
_Avoid_: Client, account, user (when meaning the passenger)

**Driver**:
Operator staff who is push-assigned to a ride. No in-app pay.
_Avoid_: Chauffeur account, employee (in product copy)

**Partner**:
Affiliate overflow company that may accept or be assigned a ride.
_Avoid_: Vendor, marketplace seller, account

**Assignee**:
The party responsible for fulfilling the ride under exclusive dispatch.
_Avoid_: Owner, handler

### Booking modes

**Booking**:
The transfer the operator has committed to fulfil and dispatch (`upcoming`).
_Avoid_: Reservation, order, job

**Appointment request**:
Customer submission before the operator confirms availability. Not a confirmed booking.
_Avoid_: Booking (until upcoming), reservation (when unpaid)

**Request review**:
The operator's decision on an Appointment request: quote it, confirm it as cash, or decline it.
_Avoid_: accept / reject (those are outcomes, not the action), partner review (that is the margin step)

**Quote**:
Operator-confirmed price with a pay link (`awaiting_payment`).
_Avoid_: Invoice (until paid), estimate (that is indicative rate)

**Operator booking**:
A Booking entered by the operator rather than by the Customer.
_Avoid_: Manual booking, walk-in booking, phone booking (those are formats, not the concept)

**Pay link**:
Tokenized customer URL to pay a Quote. Unusable after confirm, decline, or successful payment.
_Avoid_: Invoice link, checkout (instant book)

### Dispatch

**Partner review**:
Operator sets the margin before offering or assigning a non-exempt ride to Partners.
_Avoid_: Partner approval (that is account status), verify

**Overflow marketplace**:
The window where eligible Partners may claim an open ride.
_Avoid_: Auction, bidding

### Money

**Manual price**:
An operator-set fare that replaces the computed fare and is final.
_Avoid_: Custom price, override, adjustment (a computed reduction is a discount)

**Operator margin**:
The operator’s keep as a percentage of the customer fare.
_Avoid_: Commission, fee (when meaning this cut)

**Partner share**:
The Partner’s portion of the fare after operator margin (`partnerPayoutAmount`).
_Avoid_: Earnings (ambiguous with counters), payout amount alone

**Payout balance**:
What the operator still owes the Partner for completed online rides.
_Avoid_: Wallet, lodge

**Remittance balance**:
What the Partner still owes the operator (cash settlement with margin).
_Avoid_: Debt, lodge

**Settlement entry**:
An immutable ledger row that explains a balance change.
_Avoid_: Lodge, transaction (generic), log

**Cash settlement mode**:
Setting that chooses whether cash rides leave all cash with the Partner or take an operator margin.
_Avoid_: Cash policy

**Dispatch assignee mode**:
Setting that chooses exclusive assignee versus allowing both Driver and Partner.
_Avoid_: Assignment policy
