# Aqours: a simple hackathon guide

Updated **24 October 2026** from the project architecture, requirements, and current app guides. This guide uses plain words for a team presentation. It describes implemented behavior and calls out known limits. See [verification](verification.md) for the detailed evidence and open checks.

## What is Aqours?

Imagine a neighborhood has a water help desk. A customer can tell the desk, “Our water stopped,” and the water team can see the report, organize related reports, and tell customers what is happening.

Aqours is that help desk on a phone and a computer. Customers use the Android app. Supplier staff and administrators use the supplier website. A shared API checks who is signed in, applies the rules, and saves information in the database.

## 1. Tech stack: what it is and why we use it

| Part | In simple words | Why this project uses it |
| --- | --- | --- |
| **TypeScript** | JavaScript with labels that help catch mistakes. | The phone app, website, and API can share the same language and public data shapes. Types help catch mismatched fields while building. |
| **React Native + Expo** | Tools for making a phone app using React. | Customers need a phone app for Android features such as location, camera/photo selection, and secure sign-in. The project already uses Expo, so it keeps that setup. |
| **React + Vite** | Tools for making a website and running it during development. | Supplier staff need a bigger screen for report lists, maps, settings, and work queues. React builds the screens; Vite provides the web development and build tools. |
| **Express** | A small server that receives requests and sends back answers. | The API is the shared front desk: it checks sign-in, permissions, report rules, and service requests for both apps. |
| **PostgreSQL** | A database that keeps related records organized. | Reports, customers, updates, and water stock need to stay connected and consistent. Database transactions help keep linked changes together, such as reserving pickup water. |
| **Prisma** | A helper that lets the API work with database records through TypeScript. | It describes the database models and helps the server read and change records in a structured way. |
| **Docker Compose** | A way to run the database in a project container. | It gives the team a repeatable local PostgreSQL setup instead of requiring everyone to configure a database by hand. |
| **Leaflet** | A map library for websites. | The supplier website uses it to show customer/report locations, filters, and map clusters. A cluster is only a visual grouping; it does not prove there is an outage. |
| **MapLibre React Native** | A map library for native phone apps. | The Android app uses it for an interactive report-location preview in a native Aqours build. Expo Go shows coordinates instead because it does not include the required native map module. |
| **Geoapify** | A service that can suggest map coordinates for a typed address. | Address search can help place a report on the map. The API keeps the provider key on the server. If provider setup is missing or fails, address-based reporting can still continue for staff review. |
| **Open-Meteo** | An online weather service. | Aqours shows current weather and a seven-day forecast as helpful context. Weather does not decide whether water is safe or whether an outage exists. |

**Map note:** The original requirement named MapLibre GL JS for the supplier map. The current supplier website implementation uses Leaflet; the Android app uses MapLibre React Native. The map technology on each screen follows the implementation currently in the repository.

## 2. Main functions: who uses what?

### Customer: report a problem and follow what happens

Customers use the Android app. Think of it as a small notebook that sends a page to the water team and keeps the reply.

| Function | What it is for | How it works |
| --- | --- | --- |
| **Sign in and see Home** | See information for the customer's own water connection. | The customer signs in. Home shows relevant published notices, links to reports and assistance, and ways to see service updates. |
| **Report a water problem** | Tell the supplier about no water, low pressure, a leak, or a water-quality concern. | The customer chooses a problem, adds details and when it started, picks the saved address or another location, and may add a photo. GPS is optional. The app sends the report and shows its tracking reference and status. |
| **See reports and messages** | Check progress or answer a supplier question. | The customer opens their own report to read its status, messages, and history, then can reply when more information is requested. |
| **Read updates and notices** | Learn about a shared incident or official advisory. | The app shows supplier-published information that applies to the customer's saved service connection. Private notes and other customers' reports are hidden. |
| **Get a suggested next step** | Understand what the supplier recommends doing next. | Aqours uses written rules, the customer's answers, reports, and current notices to show an explanation and choices. The customer chooses whether to request help; seeing a suggestion does not submit a request. |
| **Ask for help** | Request a callback, a site inspection, or water pickup support. | The customer chooses a service and sends its details. The app shows a request receipt and later status. Staff acceptance and an appointment or available water are separate steps. Pickup is collection, not home delivery. |
| **See notifications and weather** | Keep up with app updates and general weather. | The customer can check saved updates and current/seven-day weather. Weather is informational, not a water-safety warning. |
| **Manage account settings** | Check saved connection details, change a password, or sign out. | Account settings show supplier-maintained connection details and the available account actions. There is no public self-sign-up. |

### Supplier staff: review reports and organize the response

Staff use the supplier website. Think of it as the water team's work board.

| Function | What it is for | How it works |
| --- | --- | --- |
| **Overview and inbox** | Find new reports and see work that needs attention. | Staff review report queues and basic operational measures, then open an individual report to respond, ask a question, assign an owner, or set a priority with a reason. |
| **Customer/report map** | See where customers and reported issues are located. | Staff filter a list and map, inspect locations, and open a report. Clusters help with display when many points are close together; they do not prove the real outage boundary or connect reports automatically. |
| **Incidents and updates** | Group reports that staff has reviewed as part of one larger event. | Staff confirms or changes report links, tracks the incident, keeps private notes for the team, and deliberately publishes a separate customer update. Customers see the published update, not internal notes. |
| **Messages** | Read and answer customer conversations. | Staff opens a report conversation, sends a customer-visible reply, and keeps the exchange with that report's history. |
| **Assistance queue** | Fulfill customer requests. | Staff assigns an owner, accepts or explains why help is unavailable, agrees on a time, records progress, and saves the outcome for callbacks, inspections, or water-support requests. |
| **Pickup and distribution** | Offer and track water collection sessions. | Staff maintains pickup sites, hours, and available liters. Accepting a request reserves stock; staff later records collection using its pickup reference. The API protects the stock from being promised twice. |
| **Weather and monitoring** | Review weather context and configured pickup-site warnings. | Staff can view weather and, where a site has monitoring configured, review forecast/stock warnings. A warning is a prompt to review, not a promise of future water stock. |

### Supplier admin: manage the supplier's setup

Admins use the same supplier website and can do staff work too. Think of an admin as a staff member who also has the keys to set up the help desk.

| Extra function | What it is for | How it works |
| --- | --- | --- |
| **Manage accounts and service connections** | Give the right people the right accounts and connect customer accounts to supplier-maintained addresses. | Admin provisions or updates accounts and service connections. Customers cannot choose another person's connection to gain access. |
| **Manage service zones** | Organize which service areas a notice or pickup option applies to. | Admin maintains supplier zones and explicit connection associations. Drawing a map outline alone does not prove that a property is supplied by that zone. |
| **Manage approved guidance and rules** | Maintain the text and rules used to explain customer next steps. | Admin updates versioned approved content and decision rules. Staff can use the approved guidance but cannot publish or edit official advisories. |
| **Publish or lift official advisories** | Tell the right customers about a planned interruption or water-quality restriction. | Admin selects the audience and publishes the notice. A water-quality restriction stays in effect until an authorized admin explicitly lifts it. |
| **Review administration history** | Understand important setup and publishing changes. | The system retains an audit history for relevant administrative and operational actions. |

### How one report travels through Aqours

1. A customer sends a report from the phone app.
2. The API checks the sign-in, checks that the customer owns the records they are asking to see, and checks that the report details make sense.
3. The API saves the report and its history in PostgreSQL. A photo is uploaded and stored separately behind access checks.
4. Staff sees the report in the supplier work board and reviews it. Staff may connect it to an incident after checking.
5. Staff publishes a customer update when one is ready. Private team notes stay private.
6. The customer checks the app for their own report and the published update. The customer can reply or ask for a separate assistance service.

Each customer's report remains their own record even when staff connects it to a shared incident. The API checks permissions too, so hiding a button in the app is not the only protection.

## 3. Questions the hackathon judges may ask

### “What problem are you solving?”

Water problems can be hard to report and hard for a supplier to organize. Aqours gives customers one place to report and follow up, and gives supplier staff one place to review reports and share updates.

### “Who is this for?”

Customers use the Android app. Supplier staff and admins use the website. This release is set up for one supplier and fictional demonstration accounts.

### “How do you know there is a real outage?”

Aqours does not decide that a real outage exists just because several pins are close together. Staff reviews reports and decides whether to link them to an incident and publish an update.

### “How do you protect customer information?”

The API checks a person's role and ownership for private records such as reports and photos. Customers can see their own records and published information, but not other households' raw locations, reports, or staff notes.

### “Can the app promise an appointment or water as soon as someone asks?”

No. A request first goes to staff for review. A pickup request reserves liters only when staff accepts it, and staff records collection separately. Pickup means collection at a listed site, not delivery to a home.

### “What happens if location or a map does not work?”

GPS is optional. Customers can use their saved address, and the report form can keep an address for staff review when coordinates are unavailable. The list/form remains usable if map tiles fail. Typed-address suggestions depend on the Geoapify service being configured and reachable.

### “Is the recommendation made by AI?”

No. The current release uses explainable rules, customer answers, and current information. Academic approval of this decision-support approach has not been externally verified.

### “Are the notices and water availability real?”

The built-in demonstration data is fictional. Demo notices and seeded water availability are examples for a presentation, not live public-health instructions or a real supplier's inventory.

### “What happens if the internet or weather provider is unavailable?”

The apps show loading or error states rather than claiming a failed request worked. Weather can be retried and does not change report or advisory data. Aqours does not currently provide a durable offline report queue or push/SMS/email notifications.

### “How would you show the project in a short demo?”

Use a prepared fictional customer account: submit one report, sign in as staff to review it and publish an update, then return to the customer account to show the update and report history. If time allows, request one assistance service and show its separate staff review. Avoid using a seeded fictional advisory as real safety advice.

## Limits to say clearly

- The customer product targets Android; the supplier workspace is a web app.
- The development seed and example notices/stock are fictional.
- Geoapify address search needs private provider configuration. Missing configuration is reported instead of inventing a map point.
- General weather depends on an external provider and is not water-quality advice.
- Rules-based recommendations are implemented, but their academic acceptance is not established here.
- There is no AI decision-maker, public sign-up, home delivery, durable offline queue, or external push/SMS/email notification delivery in this release.
- Build and automated checks do not prove every device, live provider, deployment, or real supplier workflow. Use the [verification ledger](verification.md) for what has actually been checked.

## Helpful project documents

- [Requirements and role permissions](requirements.md)
- [Architecture and system boundaries](architecture.md)
- [Database schema](schema.md)
- [Local setup and workspace guide](workspace.md)
- [Demo accounts and scenarios](demo.md)
- [Verification evidence and limits](verification.md)
