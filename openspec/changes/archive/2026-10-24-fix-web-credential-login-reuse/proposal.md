# Reuse existing account during web credential login

The dashboard credential-login flow currently routes converted OAuth credentials through the generic import path, which may create a second row when the stored account lacks workspace metadata or when import-without-overwrite is enabled. Make this explicit web reauthentication path replace the single unambiguous matching account in place, preserving its local identity and account history while keeping ordinary auth.json imports unchanged.

Remove the unused standalone macOS desktop packaging artifacts and their active deployment requirements so the maintained product surface is the web dashboard and existing server launcher.
