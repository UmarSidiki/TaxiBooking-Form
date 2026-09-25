# Settings-driven partner cash settlement and dispatch exclusivity

Operators disagree on whether cash overflow rides leave all cash with the Partner and whether a ride may have both a Driver and a Partner. Hardcoding either side forces forks. We store `partnerCashSettlement` (`keep_cash` | `operator_margin`) and `dispatchAssigneeMode` (`exclusive` | `allow_both`) on Settings so one codebase serves both policies, with defaults matching the historical product (`keep_cash`, `exclusive`).
