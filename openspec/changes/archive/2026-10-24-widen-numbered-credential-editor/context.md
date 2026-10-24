The editor uses native textarea wrap=off with a synchronized, aria-hidden gutter; blank and comment lines keep their visual positions without consuming record numbers. Raw credentials remain unchanged and retries number the current batch from 1.

Verification: 5 component tests, 4 browser cases (light/dark at 1440px and 390px, with 320x480 short-screen checks), typecheck/build and focused ESLint pass. Browser tests use synthetic API fixtures and do not submit login. Strict change validation passes. Repository-wide strict spec validation reports existing placeholder-purpose/long-requirement warnings across 55 of 57 specs; these are outside this change.

Deployment: installed static assets updated after a restricted backup; old hashed assets retained and index switched atomically without restart. All 4 browser cases also pass against port 2455 using synthetic API fixtures. Normal repository spec validation: 57 passed, 0 failed.
