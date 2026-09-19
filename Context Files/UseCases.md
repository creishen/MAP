Based on the Marine Assurance Platform (MAP) Business Requirement Document (BRD), here is the comprehensive breakdown of all **11 core Use Cases (UC-01 to UC-11)**, including their actors, preconditions, workflows, expected outputs, and expected errors/exception conditions.

---

### **UC-01: User Login**

* **Primary Actor(s):** Administrator, C Admin, Submitter, Verifier, Inspector, Approver.
* **Preconditions:** The user account is active, credentials exist or Single Sign-On (SSO) is configured, and an operational role has been assigned.
* **Main Workflow Steps:**
1. User opens the MAP application.
2. User enters login credentials or authenticates via Single Sign-On (SSO).
3. The system verifies and authenticates the user credentials.
4. The system determines the user’s assigned organization, role, and permission scope.
5. The system redirects the user to their designated role-specific dashboard.


* **Expected Output / Result:**
* Authenticated session established.
* User is redirected to their authorized dashboard with role-based access control (RBAC) restrictions applied.


* **Expected Errors & Exception States:**
* **Invalid Credentials / Authentication Failure:** Login attempt rejected; error notification displayed stating the user must have an active account or valid assigned credentials.
* **Inactive / Suspended Account:** Authentication rejected; system prevents session initialization.
* **Unassigned Role:** Access denied; user cannot access functional modules without an active role.
* **Audit Event:** All failed, unauthorized, or invalid login attempts are captured and logged in the immutable audit trail.



---

### **UC-02: Register Vessel**

* **Primary Actor(s):** Administrator (Vessel Provider / Vessel Owner).
* **Preconditions:** The Administrator account is active and authorized to manage/register fleet assets.
* **Main Workflow Steps:**
1. Administrator selects "Register Vessel".
2. Administrator inputs required particulars across the 11 asset categories (identification, classification, construction, ownership, management, statutory certificates, insurance, crew, environmental, and mandatory uploads).
3. MAP performs a cross-check for existing vessels using unique identifiers (IMO number, Official Registration Number, MMSI).
4. MAP identifies and prevents duplicate vessel registrations.
5. Administrator reviews and confirms the vessel details.
6. MAP creates the unique master vessel record.


* **Expected Output / Result:**
* A unique master vessel record is created and stored in the repository, making it available for subsequent assurance activities.
* System generates an immutable audit record documenting creation time, user ID, and baseline particulars.


* **Expected Errors & Exception States:**
* **Duplicate Vessel Registration:** If an existing vessel is found with the same IMO number or Official Registration Number, the system halts registration and displays a duplicate prevention error.
* **Mandatory Field Incompletion:** Submission blocked if core identification or statutory attributes are missing.
* **Unauthorized Organization:** Attempting to register assets outside the Vessel Provider’s administrative jurisdiction is rejected.



---

### **UC-03: Create Assurance Set**

* **Primary Actor(s):** Administrator (Vessel Provider) or C Admin (Client / Charterer Admin).
* **Preconditions:** The user is authenticated and authorized; the target vessel record exists in MAP.
* **Main Workflow Steps:**
1. User initiates "Create Assurance Set".
2. User selects the applicable target vessel.
3. User identifies participating organizations (Client, Vessel Provider, Third Parties).
4. User defines assurance scope, required statutory documents, and crew compliance criteria.
5. User toggles mandatory/optional compliance requirements (e.g., Certificate of Class, SOLAS Safety Certificates, Flag State Registry) and sets physical inspection rules.
6. MAP creates the Assurance Set transaction.
7. MAP publishes the Assurance Set to authorized participants.


* **Expected Output / Result:**
* A new Assurance Set transaction is created and linked to the target vessel and participating entities.
* Requirements checklist is generated with toggle buttons defaulted to required ("ON").
* An audit log entry is recorded.


* **Expected Errors & Exception States:**
* **Unassociated Vessel:** Submission fails if no registered target vessel is selected.
* **Unauthorized Mutation by Client (C Admin Rule):** Creation of an Assurance Set by a C Admin does *not* grant document ownership or edit/delete rights over Vessel Provider-owned documents.
* **Empty Requirements Scope:** Attempting to publish an Assurance Set without defining at least one compliance requirement triggers a configuration error.



---

### **UC-04: Assign Workflow Roles**

* **Primary Actor(s):** Administrator (Vessel Provider).
* **Preconditions:** The target Assurance Set exists; user accounts or partner organizations are configured in MAP.
* **Main Workflow Steps:**
1. Administrator opens the target Assurance Set.
2. Administrator identifies required workflow functions.
3. Administrator selects eligible participants from internal users or authorized third parties.
4. Roles are allocated (Submitter, Verifier, Approver, Inspector).
5. For Third-Party Service Providers, the Administrator defines explicit delegated scope, role, vessel, and access duration.
6. MAP validates assignment permissions and checks segregation-of-duties rules.
7. Administrator confirms assignments.
8. MAP updates the role matrix and notifies assignees.


* **Expected Output / Result:**
* Workflow responsibilities are allocated to authorized participants.
* Delegated scope, vessel boundaries, and expiration dates are applied to Third-Party Service Providers.
* Role allocation changes are recorded in the audit trail.


* **Expected Errors & Exception States:**
* **Segregation-of-Duties Violation:** System displays a rule-violation alert if an incompatible combination of operational roles is assigned to a single user (e.g., Verifier attempting to approve their own verifications).
* **Expired / Undefined Third-Party Delegation:** Third-party access is denied or rejected if an explicit duration or scope has not been authorized.
* **Ineligible Participant:** Assigning a non-existent or inactive user is rejected.



---

### **UC-05: Upload and Maintain Vessel and Crew Documents**

* **Primary Actor(s):** Submitter.
* **Preconditions:** Submitter is authenticated; target vessel or crew record exists (Note: An Assurance Set is **not** required prior to uploading).
* **Main Workflow Steps:**
1. Submitter opens the target vessel, crew master record, or active Assurance Set.
2. Submitter selects the target document category/type.
3. Submitter uploads the digital document file.
4. MAP performs initial file validation (format, completeness, legibility threshold $\ge 200\text{ DPI}$).
5. Submitter enters or confirms applicable metadata attributes.
6. MAP stores, timestamps, and versions the document file.
7. If an Assurance Set exists, MAP maps the document to the corresponding compliance requirement.
8. If no Assurance Set exists, MAP retains the document in the pre-assurance master vault for future selection.


* **Expected Output / Result:**
* Certificate/document is securely stored and versioned against the vessel, crew member, or Assurance Set.
* Document becomes immediately eligible for automated OCR parsing and validation.
* Version delta and upload actions are captured in the audit trail.


* **Expected Errors & Exception States:**
* **Legibility Rule Failure:** File is rejected or flagged if resolution is below 200 DPI, pages are missing, or the digital stamp/signature is unreadable.
* **Unsupported File Format:** Attempting to upload unsupported extensions triggers a file-type error.
* **Unauthorized Role Access:** Users without the Submitter or Admin role attempting to access the upload screen are blocked.



---

### **UC-06: Extract and Validate Document Data**

* **Primary Actor(s):** MAP System / Automated Document Processing Service.
* **Preconditions:** A supported, legible document has been uploaded successfully by a Submitter.
* **Main Workflow Steps:**
1. System processes the document using OCR / document extraction engines.
2. System extracts structured certificate attributes:
* *Vessel (13 fields):* Certificate Title, Number, Type, Issuer, Issue Date, Expiry Date, Vessel Name, IMO Number, Flag State, Vessel Type, Owner/Operator, Survey Date, Confidence Score.
* *Crew (11 fields):* Crew Name, Passport/ID, Rank, Certificate Type, Issuing Body, Issue Date, Expiry Date, Vessel Assignment, Nationality, Training Date, Confidence Score.


3. Extracted metadata is cross-checked against vessel/crew master records and assurance rules.
4. System checks mandatory fields, expiration thresholds, validity buffers, and authority accreditation.
5. Confidence scores are calculated and recorded.
6. System categorizes document outcome (Validated vs. Exception Flagged).


* **Expected Output / Result:**
* Extracted metadata is populated in structured data fields.
* Documents satisfying all rules advance to the Verifier work queue.
* Data extraction results and validation scores are logged in the audit trail.


* **Expected Errors & Exception States:**
* **Low-Confidence Extraction Exception:** Triggered if extraction confidence falls below threshold ($<95\%$ for vessel certificates, $<90\%$ for crew certificates); flagged for human review.
* **Validity Rule Breach:** Certificate is flagged as non-compliant if expired or expiring within 6 months of the planned charter date without an approved extension flag.
* **Identity Mismatch Exception:** Flagged if extracted IMO Number, Vessel Name, Flag State, or Vessel Type does not have a 100% exact match with the registered project asset.
* **Unrecognized Issuing Authority:** Flagged if issuing body is not an accredited Flag State administration or recognized IACS classification society.



---

### **UC-07: Notify and Resolve Document Issues**

* **Primary Actor(s):** MAP System (Automated Trigger) & Submitter.
* **Preconditions:** Automated validation (UC-06) or Verifier review (UC-08) has identified missing information, expiry, metadata mismatch, low confidence, or poor readability.
* **Main Workflow Steps:**
1. System identifies and logs the specific document validation failure or defect.
2. System creates an exception record containing the vessel, Assurance Set, document type, and issue description.
3. System sends an automated email notification and in-app alert to the responsible Submitter.
4. Notification provides specific corrective guidance and re-upload instructions.
5. System records delivery status, recipient, date, and time in the notification log.
6. System dispatches reminder notifications based on configured schedules (e.g., 90-day expiry notice, 7-day overdue escalation).
7. Submitter reviews the defect and uploads corrected/renewed evidence.


* **Expected Output / Result:**
* Submitter is informed of compliance exceptions with actionable instructions.
* Document status changes to "Correction Requested" or "Pending Re-upload".
* Notification history and delivery timestamps are retained in the audit trail.


* **Expected Errors & Exception States:**
* **Notification Delivery Failure:** Network or email gateway timeouts logged in the system audit trail.
* **Unresolved Overdue Exception:** If corrections are not submitted within configured deadlines, system triggers overdue escalations.
* **Re-Submission Mismatch:** If re-uploaded evidence still violates validation rules, the system keeps the exception open and re-alerts the Submitter.



---

### **UC-08: Verify Document**

* **Primary Actor(s):** Verifier.
* **Preconditions:** Document has passed automated OCR validation and is queued with status "Pending Verification"; user is the designated Verifier.
* **Main Workflow Steps:**
1. Verifier accesses the assigned Assurance Set and opens the pending document.
2. Verifier reviews original certificate file alongside extracted metadata and system validation flags.
3. Verifier compares information with vessel master records, crew registers, and supporting evidence.
4. Verifier enters evaluation comments where required.
5. Verifier executes one of three decisions: **Verify**, **Request Correction**, or **Reject**.
6. If verified and visual inspection is required by the Assurance Set, the item routes to the Inspector.
7. If verified and no visual inspection is required, the item routes directly to the Approver.
8. If correction is requested, the item is returned to the Submitter with mandatory comments.
9. Decision, rationale, user ID, and timestamp are captured in the audit trail.


* **Expected Output / Result:**
* Document compliance status transitions to "Verified", "Correction Requested", or "Rejected".
* Verified requirements route forward to inspection or executive approval.
* Verification decision, comments, date, and user details are written to the audit log.


* **Expected Errors & Exception States:**
* **Missing Comment on Rejection/Correction:** System blocks submission if a Verifier attempts to reject or request corrections without providing explanatory comments.
* **Unauthorized Screen Access:** Submitters, Inspectors, and Approvers attempting to execute verification decisions are denied access.
* **Unverified Pre-requisites:** Verifier cannot verify items with unresolved critical system validation exceptions without manual override documentation.



---

### **UC-09: Perform Visual / Vessel Inspection (Optional)**

* **Primary Actor(s):** Inspector.
* **Preconditions:** Visual/physical vessel inspection is mandated by the Assurance Set; an authorized Inspector has been assigned.
* **Main Workflow Steps:**
1. Inspector accesses the assigned inspection activity and reviews vessel/assurance scope.
2. Inspector conducts the visual or physical vessel inspection on-site.
3. Inspector documents survey findings, observations, and compliance comments.
4. Inspector uploads and attaches photographic evidence and survey reports.
5. Inspector records inspection outcomes and logs any corrective and preventive actions (CAPA).
6. Inspector formally submits the inspection dossier.
7. MAP routes the inspection outcome to the Approver or returns deficiencies for corrective action.


* **Expected Output / Result:**
* Inspection report, condition findings, photographic evidence, and CAPA logs are recorded against the Assurance Set.
* Requirement advances to the executive approval workflow.
* Inspector actions and evidence uploads are recorded in the audit trail.


* **Expected Errors & Exception States:**
* **Substitution Restriction (Business Rule):** The Inspector role **shall not replace the Verifier role** for routine document and certificate verification.
* **Incomplete Survey Protocol:** Submission blocked if mandatory inspection checklist sections or condition outcomes are left unrecorded.
* **Unresolved Critical Inspection Defect:** Severe physical deficiencies route the requirement into a corrective action hold rather than advancing to approval.



---

### **UC-10: Approve Document and Assurance Set**

* **Primary Actor(s):** Approver.
* **Preconditions:** Applicable assurance requirements have completed verification; all mandated physical inspection activities are finished; user holds the Approver role.
* **Main Workflow Steps:**
1. Approver opens the verified Assurance Set dossier.
2. Approver reviews verified certificates, extracted metadata, Verifier comments, and on-site inspection findings.
3. Approver evaluates the calculated Compliance Readiness Score.
4. Approver executes a decision: **Approve**, **Reject**, or **Return for Correction**.
5. Approver inputs formal sign-off comments and authentication.
6. When all mandatory statutory documents, crew requirements, and inspections are approved, MAP marks the Assurance Set as "Complete / Approved".


* **Expected Output / Result:**
* Formal assurance approval is issued; overall Assurance Set status updates to "Approved" or "Certified".
* Compliance readiness index reaches final certified status.
* Final approval decision, user ID, comments, and timestamp are captured in the immutable audit log.


* **Expected Errors & Exception States:**
* **Incomplete Assurance Gate:** Approver cannot complete or approve an Assurance Set if any mandatory statutory certificate or required inspection remains unverified, expired, or rejected.
* **Missing Sign-off Justification:** System blocks rejections or returns if the Approver does not record formal feedback comments.
* **Unauthorized User:** Non-Approvers attempting to issue final authorization are blocked by RBAC.



---

### **UC-11: C Admin – Create Assurance Set & Review Assurance Status**

* **Primary Actor(s):** C Admin (Client Admin / Authorized Charterer User).
* **Preconditions:** The C Admin is authenticated and associated with a registered vessel in MAP.
* **Main Workflow Steps:**
1. C Admin logs into MAP and accesses the Admin Dashboard.
2. C Admin selects the "Create Assurance Set" function explicitly provided for client administration.
3. C Admin creates the Assurance Set and defines charterer compliance requirements to be fulfilled by the Vessel Provider.
4. C Admin views information, certificates, and supporting documents made available by the Vessel Provider.
5. C Admin views real-time automated validation and Verifier verification statuses.
6. C Admin tracks outstanding requirements, exception flags, and pending actions.
7. C Admin monitors the overall compliance and approval status of the Assurance Set.


* **Expected Output / Result:**
* Client-defined Assurance Set is initiated and published to the Vessel Provider.
* Read-only visibility into verification statuses, inspection results, and readiness scores is provided to the Client.
* Audit trail records Assurance Set creation by the Client Admin.


* **Expected Errors & Exception States:**
* **Document Mutation Prohibition (Strict Business Rule):** The C Admin role **shall not permit the user to edit, replace, delete, or manage** Vessel Provider-owned documents. Any attempt by a C Admin to edit, upload over, or delete provider evidence is blocked by the system.
* **Unauthorized Tenant Administration:** C Admin attempting to access administrative functions of the Vessel Provider’s organization, fleet master records, or internal users is denied access.
* **Permission-Based Access Boundary:** Client access to Vessel Provider records remains strictly permission-based; viewing unauthorized vessel documents outside the assigned assurance scope is restricted.



---

### Quick Reference Matrix of Expected Outputs & Exceptions

| Use Case ID | Use Case Name                   | Primary Expected Output                                               | Primary Error / Exception Condition                                          |
| ----------- | ------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **UC-01**   | **User Login**                  | Authenticated session with role-tailored dashboard redirect.          | Invalid credentials; inactive account; unassigned role; event logged.        |
| **UC-02**   | **Register Vessel**             | Master vessel record created across 11 structural categories.         | Duplicate vessel detected (IMO/MMSI); missing mandatory attributes.          |
| **UC-03**   | **Create Assurance Set**        | New assurance transaction linked to vessel and required certificates. | Target vessel unassociated; empty compliance scope.                          |
| **UC-04**   | **Assign Workflow Roles**       | Operational roles allocated with third-party scopes and durations.    | Segregation-of-duties violation; undefined third-party duration.             |
| **UC-05**   | **Upload & Maintain Documents** | File stored and versioned; associated with assurance set or vault.    | Resolution $<200\text{ DPI}$; missing stamp/signature; unreadable file.      |
| **UC-06**   | **Extract & Validate Data**     | Structured metadata populated; clean items routed to Verifier.        | Confidence $<95\%$ (vessel) / $<90\%$ (crew); expiry $<6$ mos; IMO mismatch. |
| **UC-07**   | **Notify & Resolve Issues**     | Alerts and corrective guidance dispatched to Submitter.               | Unresolved overdue exception; notification delivery failure.                 |
| **UC-08**   | **Verify Document**             | Item verified; routed to Inspector or Approver.                       | Rejection/correction submitted without required comments.                    |
| **UC-09**   | **Visual / Vessel Inspection**  | Survey findings, CAPA logs, and photos attached to dossier.           | Inspector attempting to verify documents; incomplete survey protocol.        |
| **UC-10**   | **Approve Assurance Set**       | Assurance Set authorized and closed as "Approved / Certified".        | Attempting to approve set with missing, expired, or unverified items.        |
| **UC-11**   | **C Admin Assurance Review**    | Client requirements defined; read-only compliance tracking.           | Client attempting to edit, replace, or delete provider documents.            |