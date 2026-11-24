# SmartFix department experience update

## Product scope and implementation
Preserve the current React/Vite + Express/Mongoose application and its role-based navigation. Customers can choose the right provider type for the work: technicians for simple repairs, engineers for complex work requiring coordination, and companies for design/build/property-check projects. All three provider types receive large, photo-forward cards and a public profile with their bio, experience/ratings or team information, affiliation where relevant, and previous-work portfolio. Customers can book an engineer or company through a project request that records a provider, provider role, description and scheduled time; existing technician repair bookings remain unchanged.

Engineer and company Team pages become member directories with large cards and only Explore and Remove actions; email invitations remain in Applications & offers rather than Team. Public professional profiles let members explore people and portfolios. Incoming company offers to engineers include an inline company portfolio view. Company inbox results are restricted to customer project requests and engineer applications. Engineer inboxes also receive customer project requests addressed to them.

Provide persistent light/dark mode, improve the technician navbar with distinct translated destinations, and keep all newly introduced and existing visible department/navigation copy in synchronized English and Arabic dictionaries.

## Project structure
- `client/src/pages/Customer.tsx`: provider-intent entry points and technician directory cards.
- `client/src/pages/Providers.tsx`: cross-role provider directory, customer project booking form, and public provider profiles.
- `client/src/pages/Team.tsx`: larger engineer/company team cards with Explore and Remove actions only.
- `client/src/pages/Inbox.tsx`: role-appropriate request/application inbox, including company-offer portfolios.
- `client/src/pages/WorkHistory.tsx`, `WorkspaceTabs.tsx`, `App.tsx`: translated copy and clearer department navigation.
- `client/src/i18n/en.ts`, `ar.ts`: paired translations for all new UI strings; parity tests remain authoritative.
- `client/src/main.tsx`, `client/src/App.tsx`, `client/src/styles.css`: persisted light/dark theme and responsive styling.
- `server/src/models.ts`, `server/src/app.ts`: provider-targeted customer requests, public provider discovery/profile endpoints, role-specific request lists, inbox filtering, and request status handling.

## Design
Reuse SmartFix's orange/navy identity and rounded 3D cards. Provider directories use roomy responsive cards with prominent role portraits, clear specialty/experience, and explicit Explore and Book actions. Light mode remains the default; dark mode uses the same orange accent over deep navy surfaces with readable contrast. Maintain Arabic RTL and Cairo typography across both themes. Actions remain explicit and reversible, and role-specific content is hidden from unauthorized department views.
