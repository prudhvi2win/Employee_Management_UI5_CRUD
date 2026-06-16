Here is a complete, production-ready `README.md` draft for your project. It captures both the business purpose and the technical underpinnings of your application's architecture for your future reference.

---

# Employee Management System — Workspace Portal

An enterprise-grade SAPUI5 application built on the **OData v4** specification utilizing a responsive **Master-Detail (SplitApp)** architectural layout. This portal serves as a unified workspace for managing internal HR data operations including personnel directory records, legal tracking data, and administrative sub-modules.

---

## 1. Functional Overview

The application workspace splits responsibilities dynamically across a two-pane layout to maximize operational efficiency:

### Left Pane: Navigation Master Menu

Acts as the central command hub for the application. It provides quick access to three independent functional modules:

* **Manage Employees:** The primary operations dashboard for reviewing, creating, modifying, and deleting workforce profiles.
* **Leave Requests:** A dedicated portal area tracking employee absences and availability (placeholder implementation).
* **Upload Resumes:** An attachment ingest tool configured to handle file uploads for processing job application documents (placeholder implementation).

### Right Pane: Context-Driven Detail Area

Swaps content dynamically based on the selection made in the Left Pane. Within the **Manage Employees** workspace, it executes a two-stage view sequence:

1. **Worklist / Directory State (`EmployeeList.view`):** Renders a high-performance tabular overview of all saved employees fetching data asynchronously from the server.
2. **Transactional Form State (`EmployeeDetail.view`):** Displays deep structural information (Personal Data, Passport Details, and an editable sub-table for multi-row Address Management) embedded natively via reusable XML Fragments.

---

## 2. Technical Architecture & Data Flow

This application is built intentionally to bypass standard data-binding limitations when managing deep relationships in single-point-of-truth transaction UI screens.

### Core Architectural Patterns Explained

#### 1. Split Application Architecture (`sap.m.SplitApp`)

Instead of nesting complex `show/hide` visual properties inside a single monolithic view, the application splits views across target layout areas configured inside the `manifest.json`.

* The Left Pane targets the `masterPages` control aggregation.
* The Right Pane targets the `detailPages` control aggregation.

#### 2. Isolated Sandbox Draft Pattern (`JSONModel` vs. `ODataModel`)

Direct Two-Way binding to a live server OData layout can cause partial, unvalidated data modifications to hit the database instantly, or corrupt row states if a user hits "Cancel".

* **The Strategy:** The app reads clean backend data but instantly isolates it into a client-side sandbox `JSONModel` named `"draft"`.
* **The Benefit:** All frontend typing, input changes, and adding/deleting rows happen inside this temporary local model container. The live database remains completely untouched until the user explicitly hits the **Save** button.

#### 3. Native OData v4 Deep Read Handling

OData v4 removes the legacy `.read()` methods and `.results` object arrays found in OData v2. Data loading is executed via an asynchronous Context Binding (`bindContext`):

```javascript
var oContextBinding = oModel.bindContext("/Employees(" + sID + ")", null, {
    "$expand": "addresses,passportDetail"
});
oContextBinding.requestObject().then(function (oData) { ... });

```

This forces the network layer to explicitly fetch the 1-to-1 Passport details and 1-to-Many Address associations in a single combined HTTP network transaction.

---

## 3. Directory Layout and File Manifest

The codebase maps directly to standard SAP Fiori architectural layouts:

```text
webapp/
├── component.js                  # Application Bootstrapper and Router Initialization
├── manifest.json                 # Global App Configurations, Model Definitions & Router Targets
│
├── controller/
│   ├── App.controller.js         # Base App Window controller
│   ├── Master.controller.js      # Left Pane menu navigation traffic logic
│   ├── EmployeeList.controller.js# Master list table row-selection routing handlers
│   └── EmployeeDetail.controller.js # Heavy CRUD engine handling Sandbox payloads & OData actions
│
└── view/
    ├── App.view.xml              # Shell Container declaring the <SplitApp> control
    ├── Master.view.xml           # Left Pane UI menu layout
    ├── EmployeeList.view.xml     # Right Pane Worklist overview grid table
    ├── EmployeeDetail.view.xml   # Right Pane Transactional profile manager surface
    └── fragments/
        └── EmployeeForm.fragment.xml # Reusable layout form holding the structural fields

```

---

## 4. Routing Blueprint

Navigation paths are governed entirely by the hash-routing engine inside the `manifest.json`.

| Route Name | Address Hash Pattern | Left Master Target | Right Detail Target | Purpose |
| --- | --- | --- | --- | --- |
| `EmployeeList` | `""` (Default) | `Master.view` | `EmployeeList.view` | Loads initial view with Employee grid |
| `EmployeeDetail` | `#/ManageEmployee/{id}` | `Master.view` | `EmployeeDetail.view` | Loads deep edit/view form for an ID |
| `EmployeeDetail` | `#/ManageEmployee/new` | `Master.view` | `EmployeeDetail.view` | Initialises blank draft payload |
| `LeaveRequests` | `#/Workspace/LeaveRequests` | `Master.view` | `LeaveRequests.view` | Switches right side to Leave dashboard |
| `UploadResumes` | `#/Workspace/UploadResumes` | `Master.view` | `UploadResumes.view` | Switches right side to Document Uploader |

---

## 5. Cheat-Sheet: Adding a New Field

If the business requirements expand (e.g., adding a `Mobile Number` field to an employee profile), update the code in these three specific locations:

1. **Database Layer:** Ensure the field exists in your backend metadata entity schema.
2. **Controller Default Blueprint (`EmployeeDetail.controller.js`):** Add the field placeholder value to the `_initBlankDraft` structure so creation requests initialize cleanly:
```javascript
_initBlankDraft: function() {
    this.getView().setModel(new JSONModel({
        name: "", mobile: "", ...
    }), "draft");
}

```


3. **UI Content Layer (`EmployeeForm.fragment.xml`):** Bind an input control directly to your sandbox model path layout:
```xml
<Label text="Mobile Number" />
<Input value="{draft>/mobile}" editable="{= ${viewModel>/mode} !== 'view' }" />

```


## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Tue Jun 16 2026 13:00:32 GMT+0530 (India Standard Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.23.0|
|**Generation Platform**<br>Visual Studio Code|
|**Template Used**<br>Basic V4|
|**Service Type**<br>OData URL|
|**Service URL**<br>http://localhost:4004/odata/v4/employee/|
|**Module Name**<br>employee|
|**Application Title**<br>Employee Management Application|
|**Namespace**<br>com.emp|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.149.0|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>True, see https://www.npmjs.com/package/@sap-ux/eslint-plugin-fiori-tools#rules for the eslint rules.|

## employee

Employee Management Application

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  To launch the generated application, run the following from the generated application root folder:

```
    npm start
```

- It is also possible to run the application using mock data that reflects the OData Service URL supplied during application generation.  In order to run the application with Mock Data, run the following from the generated app root folder:

```
    npm run start-mock
```

#### Backend

This project uses a CAP (Cloud Application Programming) server as the backend. The CAP server can be run locally to practice this SAP UI5 project.

To start the CAP server locally:

```
    cd ../
    cds watch
```

The CAP server will be available at `http://localhost:4004` by default.

Backend server repository: https://github.com/prudhvi2win/Employee_Management_CAPM

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)


