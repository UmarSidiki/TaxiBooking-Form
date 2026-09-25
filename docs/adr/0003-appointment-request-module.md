# Appointment-request module via Settings

Some operators need availability confirmation before taking payment; others keep instant book. Hard-replacing instant book would break existing deployments. We store `enableAppointmentRequest` on Settings (default off) so one codebase serves both: when on, customers submit an Appointment request, the operator Quotes or confirms cash / declines, and Booking Confirmed plus Partner notify happen only after `upcoming`.
