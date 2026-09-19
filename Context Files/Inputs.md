# Marine Assurance Platform (MAP) — Data Creation Input Specifications

This document defines the complete specification of all data inputs, parameters, validation bounds, and UI controls required for data creation across all operational modules in the Marine Assurance Platform (MAP), adhering strictly to the Business Requirements Document (BRD) and [Roles.md](file:///c:/mapFiles/Roles.md) RBAC matrix.

---

## 1. Vessel Registration Data Inputs (UC-02)

- **Target UI Screen**: Vessel Registration Screen (`scVessel` / `scVesselReg`)
- **Authorized Role**: Platform Administrator (`admin` ONLY)
- **Duplicate Check Validation**: IMO Number & Official Registration Number are checked against registered vessel records before confirmation. Matching identifiers block creation.

### 11 Particulars Categories & Fields:

1. **Category 1 — Vessel Identification**:
   - `Vessel Name`: Text input (e.g. `MV Torrens Supporter`) — *Required*
   - `IMO Number`: 7-digit numeric string (e.g. `9634721`) — *Required / Unique*
   - `Official Registration Number`: Alphanumeric string (e.g. `OSV-44-2019`) — *Required / Unique*
   - `MMSI Number`: 9-digit maritime mobile service identity (e.g. `503728940`) — *Required*
   - `Call Sign`: Radio call sign string (e.g. `VJQ4821`) — *Required*
   - `Flag State`: Country name dropdown / input (e.g. `Australia`) — *Required*
   - `Port of Registry`: Port location string (e.g. `Fremantle, WA`) — *Required*

2. **Category 2 — Classification & Notation**:
   - `Classification Society`: Recognized Org (DNV, Bureau Veritas, Lloyd's Register, ABS, RINA) — *Required*
   - `Class Notation`: Full class notation string (e.g. `1A1 SF DK(+) OFFSHORE`) — *Required*
   - `Hull Type`: Structural hull type (e.g. `Double Bottom / Double Side Steel`) — *Required*

3. **Category 3 — Construction & Dimensions**:
   - `Year Built`: 4-digit year string (e.g. `2019`) — *Required*
   - `Shipyard / Builder`: Builder shipyard name (e.g. `Damen Shipyards Group`) — *Required*
   - `Length Overall (LOA)`: Metric length in meters (e.g. `83.4 m`) — *Required*
   - `Beam`: Metric beam width in meters (e.g. `18.0 m`) — *Required*
   - `Draft`: Maximum operational draft in meters (e.g. `5.8 m`) — *Required*

4. **Category 4 — Tonnage & Propulsion**:
   - `Gross Tonnage (GT)`: Metric tonnage (e.g. `3,250 GT`) — *Required*
   - `Deadweight Tonnage (DWT)`: Carrying capacity (e.g. `4,100 DWT`) — *Required*
   - `Dynamic Positioning Class`: DP rating (e.g. `DP2 (Kongsberg K-Pos)`) — *Required*
   - `Main Engine Type / Power`: Propulsion system specs — *Required*

5. **Category 5 — Ownership & Management**:
   - `Registered Vessel Owner`: Vessel Provider organization — *Required*
   - `ISM Manager / Fleet Operator`: Technical management organization — *Required*

6. **Category 6 — Statutory Certificates & Expiries**:
   - `Certificate of Class Number`: Certificate reference string — *Required*
   - `Class Expiry Date`: Date string / calendar picker — *Required*
   - `SOLAS Safety Cert Number & Expiry`: Statutory safety cert details — *Required*
   - `MARPOL Annex I-VI Cert & Expiry`: Environmental cert details — *Required*

7. **Category 7 — Insurance & P&I Coverage**:
   - `P&I Club Name`: Protection & Indemnity Club name — *Required*
   - `Policy / Certificate Number`: Insurance policy number — *Required*
   - `Policy Expiry Date`: Coverage expiration date — *Required*

8. **Category 8 — Crew & Safety Particulars**:
   - `Safe Manning Count`: Minimum required crew complement count — *Required*
   - `Master Name & CoC Number`: Captain name & STCW endorsement — *Required*
   - `Chief Engineer Name & CoC`: Chief engineer credentials — *Required*

9. **Category 9 — Environmental & Energy Efficiency**:
   - `EEXI / CII Rating`: Energy efficiency index rating — *Required*
   - `Ballast Water Management System`: BWMS equipment type — *Required*

10. **Category 10 — Vessel Operating Status**:
    - `Status Configurator`: Dropdown select (`In Operations`, `In Transit`, `Dry Docking`, `Lay-up`, `Port Stay`, `Under Charter`) — *Editable by Vessel Owner / Submitter / Admin*

11. **Category 11 — Document Attachments**:
    - `Master Certificate Upload`: PDF / ZIP file upload input for master class registry package.

---

## 2. Assurance Set Creation Data Inputs (UC-03 / UC-11)

- **Target UI Screen**: Create Assurance Set Screen (`scCreateSet`)
- **Authorized Roles**: Administrator (`admin`) & C Admin / Charterer Admin (`cadmin` / `client`)

### Input Fields:

1. **Target Vessel Selection**:
   - `Vessel`: Dropdown select from registered vessels (`MV Torrens Supporter`, `MV Dampier Ranger`, etc.) — *Required*
2. **Assurance Set Identification**:
   - `Campaign / Set Title`: Text input (e.g. `Southern Basin Offshore Charter 2026`) — *Required*
   - `Initiating Organization`: Auto-filled based on active user organization — *Required*
   - `Initiating Role`: Indicator badge (`Provider Admin Created` vs `C Admin · Client Created`)
3. **Mandatory & Optional Requirement Matrix**:
   - `Class Certificate Toggle`: Active / Required status toggle
   - `SOLAS Safety Cert Toggle`: Active / Required status toggle
   - `Flag State Registration Toggle`: Active / Required status toggle
   - `Minimum Safe Manning Toggle`: Active / Required status toggle
   - `Crew Medical Fitness (ENG1) Toggle`: Active / Required status toggle
   - `STCW Endorsement Toggle`: Active / Required status toggle
   - `OVID / IMCA Report Toggle`: Active / Required status toggle
   - `MARPOL Environmental Toggle`: Active / Required status toggle
   - `Custom Requirement Add`: Text input field to append custom assurance requirements.
4. **Workflow & Delegation Options**:
   - `Target Charter Date`: Calendar date picker input — *Required*
   - `Mandatory On-Site Visual Inspection`: Toggle switch (`Mandatory` vs `Document-Only`)
   - `Delegated Verification Scope`: Select verification scope parameters.

---

## 3. User Account Creation & Role Assignment Data Inputs (UC-04)

- **Target UI Screen**: Add User Modal (`#mapAddUserModal`) & Role Assignment Screen (`scRoles`)
- **Authorized Role**: Administrator (`admin` ONLY)

### Input Fields:

1. **Full Name**: Text input (`name`) — *Required*
2. **Email Address**: Text input (`email`) — *Required / Validated format / Unique email check*
3. **Organization**: Dropdown select (`org`) — *Required* (e.g. `Northwind Marine Pty Ltd`, `Southern Basin Energy`, `Meridian Marine Surveyors`)
4. **Role Selection**: Radio / dropdown choice (`role`) — *Required*:
   - `admin`: Platform Administrator
   - `cadmin`: Client / Charterer Admin
   - `submitter` / `provider`: Vessel Provider Submitter
   - `verifier`: Third-Party Verifier
   - `inspector`: On-Site Inspector
   - `approver`: Assurance Manager / Approver
5. **Designation / Job Title**: Text input (`designation`) — *Optional / Defaults to 'Team Member'*
6. **Delegated Access Scope & Duration**: Target organization, vessel ID, expiry timestamp.

---

## 4. Document Upload & AI Metadata Extraction Data Inputs (UC-05 / BR-5)

- **Target UI Screen**: Upload Screen (`scUpload`) & Add Document Modal (`#mapAddDocModal`)
- **Authorized Roles**: Administrator (`admin`) & Submitter (`provider` / `submitter`)

### Input Fields:

1. **Document Name / Title**: Text input (`name`) — *Required* (e.g. `Certificate of Class — MV Torrens Supporter`)
2. **Document Scope**: Radio selection (`Vessel` vs `Crew` vs `Organization`) — *Required*
3. **Owner Organization**: Text / select (`owner`) — *Required*
4. **Document / Certificate Type**: Select input (`docType`) — Class Certificate, SOLAS, Flag State, Manning, STCW, ENG1, OVID, MARPOL.
5. **Certificate Number**: Text input (`certNo`) — *Extracted via AI / Editable*
6. **Issuing Authority**: Text input (`issuer`) — *Extracted via AI / Editable* (e.g. `DNV Marine Assurance`)
7. **Issue & Expiry Dates**: Date pickers (`issueDate`, `expiry`) — *Extracted via AI / Editable*
8. **Document File Attachment**: File upload input (`ext`: PDF, PNG, JPG, ZIP) — *Required*

---

## 5. Physical Survey & Visual Inspection Findings Data Inputs (UC-09)

- **Target UI Screen**: Inspector Protocol Screen (`scInspector` / Vessel Inspection Section)
- **Authorized Role**: Inspector (`inspector` ONLY)

### Input Fields:

1. **Overall Inspection Outcome**: Outcome selector (`Satisfactory`, `Pass with Observations`, `Deficiency Flagged`, `Pending Inspection`) — *Required*
2. **Inspector Name & Organization**: Inspector badge & uploader name string — *Auto-filled*
3. **Inspection Date**: Date string / picker — *Required*
4. **Executive Inspection Summary**: Multiline text area for summary survey notes — *Required*
5. **Checklist Item Breakdown Inputs**:
   - `Area / System`: Inspection category (e.g. `Life Saving Appliances`)
   - `Standard Reference`: IMO/SOLAS rule reference (e.g. `SOLAS Ch. III / LSA Code`)
   - `Item Status`: Select (`Satisfactory`, `Observation`, `Deficiency`)
   - `Observations / Findings`: Detailed text description of survey finding.
6. **Corrective Action Plan (CAPA)**: CAPA Title & Reference input (e.g. `CAPA-118`).
7. **Inspection Evidence Attachments**: Multi-file attachment uploader for survey reports, photo packs, and test certificates.

---

## 6. Verification Decision & Defect Feedback Data Inputs (UC-08)

- **Target UI Screen**: Verifier Workstation (`scVerifier`)
- **Authorized Roles**: Administrator (`admin`) & Verifier (`verifier` ONLY)

### Input Fields:

1. **Verification Action Choice**: Action button selection (`Verify & Route to Approval` vs `Flag Exception / Request Correction` vs `Reject`) — *Required*
2. **Extracted vs Verified Metadata Confirmation**: Checkbox / input verification for 13 vessel attributes and 11 crew attributes.
3. **Defect Comments / Rationale**: Mandatory text area input for detailing defects when flagging exceptions or returning documents to Submitter.
4. **Next Stage Routing**: Destination path selector (Forward to Inspector for Visual Survey vs Forward to Approver Gate).

---

## 7. Approver Gate Sign-Off & Authorization Data Inputs (UC-10)

- **Target UI Screen**: Approver Gate Screen (`scApprover`)
- **Authorized Roles**: Administrator (`admin`) & Approver (`approver` ONLY)

### Input Fields:

1. **Gate Decision Choice**: Decision button (`Approve Assurance Set` vs `Return for Correction` vs `Issue Rejection`) — *Required*
2. **Readiness Score Verification**: Confirmation of calculated readiness score percentage.
3. **Executive Authorization Comments**: Multiline text area for executive approval notes and sign-off rationale.

---

## 8. Screen-Level Data Input Summary Matrix

| Data Creation Module                    | Target UI Screen                 | Primary Authorized Roles                | Input Controls & Fields                                                                                                         |
| :-------------------------------------- | :------------------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **Vessel Registration (UC-02)**         | `scVessel` / `scVesselReg`       | Administrator (`admin`)                 | 11 Categories, 35+ fields (IMO, Official No, MMSI, Call Sign, Class, LOA, GT, DWT, DP Class, Owner Org, Status, Cert upload)    |
| **Create Assurance Set (UC-03/UC-11)**  | `scCreateSet`                    | Admin (`admin`), C Admin (`cadmin`)     | Vessel select, Set title, Charterer name, 9 requirement toggles, Target charter date, Visual inspection flag                    |
| **User Creation & Role Assign (UC-04)** | `#mapAddUserModal` / `scRoles`   | Administrator (`admin`)                 | Full Name, Email (unique check), Org select, Role (Admin, C Admin, Submitter, Verifier, Inspector, Approver), Designation       |
| **Document Upload (UC-05/BR-5)**        | `scUpload` / `#mapAddDocModal`   | Admin (`admin`), Submitter (`provider`) | Doc Title, Scope (Vessel/Crew), Owner, Doc Type, Cert No, Issuer, Issue Date, Expiry Date, File attachment                      |
| **Physical Inspection (UC-09)**         | `scInspector` / `scVesselDetail` | Inspector (`inspector`)                 | Overall Outcome, Inspection Date, Executive Summary, Checklist Item Status & Findings, CAPA reference, Photo/Report attachments |
| **Document Verification (UC-08)**       | `scVerifier`                     | Admin (`admin`), Verifier (`verifier`)  | Decision (Verify/Exception/Reject), Metadata verification check, Mandatory Defect Comments, Route selection                     |
| **Approver Gate Sign-off (UC-10)**      | `scApprover`                     | Admin (`admin`), Approver (`approver`)  | Gate Decision (Approve/Return/Reject), Readiness score check, Executive sign-off comments                                       |
