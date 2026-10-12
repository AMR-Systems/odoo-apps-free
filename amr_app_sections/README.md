# App Sections

Organize your Odoo home menu into collapsible sections.

- **Version**: 20.0.1.0.0
- **Odoo**: 20.0 Enterprise (Odoo.sh and on-premise)
- **License**: LGPL-3
- **Publisher**: AMR Systems

## What it does

The home menu shows every installed app as one long grid. App Sections lets
each user group those tiles into named, collapsible sections:

- Create any number of sections and rename them at any time.
- Drag and drop apps within a section, between sections, and onto collapsed
  sections. Each tile also has a "Move to section" menu, which works on
  touch screens and with assistive tools.
- Reorder whole sections by dragging their header, or with the Move up and
  Move down entries in the section menu.
- Collapse sections you rarely need. The collapsed state is saved.
- One section is the catch-all: deleting a section moves its apps there and
  newly installed apps appear there automatically.
- "Restore default layout" brings back the standard home menu.

Every user has their own layout, saved on the server, so it follows them to
any browser or device. Until a user adds their first section, their home
menu looks and behaves exactly like standard Odoo.

## Security

The module changes presentation only. It never grants or removes access:
apps a user cannot see are never shown, even if they were saved in a layout
earlier, and a user can read and change only their own layout.

## Installation

Install the module like any other Odoo module. No configuration is needed.
To start organizing, open the home menu and click "Add section".

## Languages

English and Polish. Each user sees the interface in their own language.

## Requirements and limitations

- Odoo 20.0 Enterprise (the home menu is an Enterprise feature). Not
  available for Odoo Online, which does not run custom modules.
- A layout change made in one browser tab is not mirrored live into other
  open tabs. If a stale tab tries to save, that save is refused, the latest
  saved layout is loaded and the user is told: nothing is overwritten
  silently.
- Keyboard: arrow keys and Tab move the highlight through section headers
  and apps, Enter opens the highlighted app or collapses and expands the
  highlighted section.

## Technical notes

- Layouts are stored per user on `res.users.settings`, the same mechanism
  the standard home menu uses for its app order. Uninstalling the module
  removes the stored layouts and restores the standard home menu untouched.
- The standard app order (used before sections are enabled and after a
  reset) is kept as-is.
- The module does not call any external service and sends no data anywhere.

## Support

Report problems through the Odoo Apps support channel for this module, or
at support@amrsystems.pl. Support is best effort, without an SLA.
