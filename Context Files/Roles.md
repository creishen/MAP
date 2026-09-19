Based on the Marine Assurance Platform (MAP) Business Requirements Document (BRD), here is the detailed breakdown of core responsibilities, permitted actions ("What they CAN do"), restrictions ("What they CANNOT do"), and the specific UI/screen permissions for each user role.

---

### 1. Administrator (Vessel Provider / Vessel Owner Admin)

* **Primary Stakeholder:** Vessel Provider / Vessel Owner.
* **Core Responsibilities:** Manages Vessel Provider administrative activities, including vessel registration, user administration, operational role assignments, and Assurance Set creation when initiated by the Vessel Provider.

#### What They CAN Do:

* **User Authentication & Dashboard:** Log in via credentials or Single Sign-On (SSO) and access the Admin Dashboard.
* **Vessel Registration (UC-02):** Register unique vessel records and enter extensive particulars across all 11 categories (identification, classification, construction, ownership, management, statutory certificates, insurance, crew/safety, environmental, and document attachments).
* **Create Assurance Sets (UC-03):** Initiate an Assurance Set for a vessel, identify participating organizations, and define mandatory/optional assurance requirements.
* **Assign Workflow Roles (UC-04):** Assign Submitter, Verifier, Approver, and Inspector roles to eligible internal users or authorized third parties.
* **Third-Party Access Delegation:** Define delegated scope, organization, vessel, Assurance Set, and access duration for third-party participants.
* **Access Screen Modules:** The Administrator has full access across all operational screens:
* Document Upload Screen
* Verifier UI Screen
* Approver UI Screen
* Inspector UI Screen


* **Audit Trail Visibility:** View and search the tamper-evident audit logs across the compliance lifecycle.

#### What They CANNOT Do:

* **Register Duplicate Vessels:** Cannot register duplicate vessels if matching unique vessel identifiers (e.g., IMO, Official Registration Number) already exist in the platform.
* **Tamper with Audit Logs:** Cannot edit, overwrite, or delete audit trail records through standard application functions.
* **Violate Segregation of Duties:** Cannot assign conflicting roles to a single participant if restricted by specific assurance rules or segregation-of-duty guidelines.

---

### 2. C Admin (Client Admin / Charterer Admin)

* **Primary Stakeholder:** Client / Charterer.
* **Core Responsibilities:** Represents the Client/Charterer administrative function; initiates client-driven Assurance Sets, defines client compliance requirements, and reviews assurance readiness.

#### What They CAN Do:

* **User Authentication & Dashboard:** Log in and access the Client/Charterer administrative interface.
* **Create Assurance Sets (UC-03, UC-11):** Initiate an Assurance Set for a registered vessel and specify charterer compliance requirements (statutory certificates, vessel information, crew clearances, and inspection mandates).
* **Review Assurance Data:** View information, uploaded documents, extraction validation results, and overall verification/inspection status made available by the Vessel Provider.
* **Hold Dual Roles When Permitted:** Can be granted Verifier access if the assurance agreement designates the Client as the reviewing party.

#### What They CANNOT Do:

* **Edit/Delete Provider Documents:** **Strictly prohibited** from editing, replacing, deleting, or managing any documents owned or submitted by the Vessel Provider.
* **General Administrative Control:** Does not have administrative rights over the Vessel Provider’s organization, users, or vessel master registries.
* **Access Restricted Screens:** Cannot access the Document Upload, Approver, or Inspector UI screens unless explicitly granted those operational roles.

---

### 3. Submitter

* **Primary Stakeholder:** Vessel Provider / Vessel Owner (or delegated Third-Party Provider).
* **Core Responsibilities:** Uploads, maintains, updates, and resubmits all required vessel, crew, and supporting assurance evidence.

#### What They CAN Do:

* **Upload Documents (UC-05):** Upload required statutory certificates and crew qualifications via the Document Upload Screen.
* **Pre-Assurance Document Management (BR-5, Scenario 4):** Upload and maintain reusable vessel and crew documents in MAP independently, even before an Assurance Set exists.
* **Associate Existing Documents:** Link previously uploaded, valid master documents to newly created Assurance Sets.
* **Resolve Document Exceptions (UC-07):** Receive automated system notifications for missing information, expired certificates, metadata mismatches, or low-confidence values, and resubmit corrected files.
* **Document Versioning:** Maintain version history when re-uploading or updating certificates.

#### What They CANNOT Do:

* **Verify Documents:** **No access** to the Verifier UI Screen; cannot evaluate or verify their own submissions.
* **Approve Assurance Items:** **No access** to the Approver UI Screen; cannot approve certificates or close an Assurance Set.
* **Conduct Visual Inspections:** **No access** to the Inspector UI Screen; cannot record visual or on-site survey findings.

---

### 4. Verifier

* **Primary Stakeholder:** Independent Marine Surveyor, Client/Charterer representative, or designated internal compliance reviewer.
* **Core Responsibilities:** Reviews submitted documents, automated OCR extraction results, and validation checks to confirm whether compliance requirements are met.

#### What They CAN Do:

* **Access Verifier Screen (UC-08):** Access the dedicated Verifier UI Screen to review pending documents.
* **Inspect Metadata & Validation:** Compare original uploaded certificates against extracted metadata (13 vessel attributes, 11 crew attributes), validation rules, and vessel master data.
* **Make Verification Decisions:**
* **Verify:** Confirm the document satisfies the requirement.
* **Request Correction:** Return the item to the Submitter with mandatory comments detailing defects.
* **Reject:** Reject the document with formal rationale.


* **Route Workflow Items:** Forward verified items to the Inspector (if visual inspection is mandated) or directly to the Approver (if no inspection is needed).

#### What They CANNOT Do:

* **Upload Documents:** **No access** to the Document Upload Screen; cannot upload or alter submitted certificates directly.
* **Approve Assurance Sets:** **No access** to the Approver UI Screen; cannot grant final regulatory/charter approval.
* **Perform Physical Inspections:** **No access** to the Inspector UI Screen; cannot conduct visual inspections in place of an Inspector.

---

### 5. Inspector

* **Primary Stakeholder:** Marine Surveyor / On-site Inspector (often an authorized Third-Party Service Provider).
* **Core Responsibilities:** Conducts physical on-site or visual vessel inspections and records condition findings and defect evidence.

#### What They CAN Do:

* **Access Inspector Screen (UC-09):** Access the dedicated Inspector UI Screen to manage assigned inspection activities.
* **Review Technical Vessel Information:** View relevant vessel particulars and assurance data prior to conducting on-site surveys.
* **Record Survey Findings:** Document visual findings, inspector comments, checklist outcomes, and condition results.
* **Attach Field Evidence:** Upload and attach supporting evidence (photographs, survey reports, CAPA items).
* **Submit Inspection Outcomes:** Formally submit inspection results to advance the requirement to the approval phase or return it for corrective action.

#### What They CANNOT Do:

* **Perform Routine Document Verification:** **Business Rule:** The Inspector role **shall not replace the Verifier role** for routine certificate and document verification.
* **Upload Vessel/Crew Certificates:** **No access** to the Document Upload Screen.
* **Approve Assurance Sets:** **No access** to the Approver UI Screen; cannot issue final assurance sign-off.
* **Access Verifier Queue:** **No access** to the routine Verifier UI Screen.

---

### 6. Approver

* **Primary Stakeholder:** Vessel Owner Executive, Chartering Authority, or designated Marine Assurance Manager.
* **Core Responsibilities:** Applies formal approval criteria, evaluates compliance readiness scores, and approves verified documents and the overall Assurance Set.

#### What They CAN Do:

* **Access Approver Screen (UC-10):** Access the dedicated Approver UI Screen to evaluate verified dossiers.
* **Evaluate Complete Evidence:** Review original certificates, extracted data, Verifier comments, and Inspector findings/evidence.
* **Assess Compliance Readiness:** Evaluate calculated readiness scores and compliance criteria.
* **Make Approval Decisions:**
* **Approve:** Formally approve individual requirements.
* **Return for Correction:** Send items back into the workflow with mandatory comments.
* **Reject:** Issue a final rejection on requirements or the Assurance Set.


* **Complete Assurance Set:** Officially authorize and complete the Assurance Set once all mandatory statutory certificates and requirements are approved.

#### What They CANNOT Do:

* **Upload Documents:** **No access** to the Document Upload Screen.
* **Perform Initial Document Verification:** **No access** to the Verifier UI Screen.
* **Conduct Field Inspections:** **No access** to the Inspector UI Screen.
* **Approve Unverified Documents:** Cannot approve documents that have not successfully completed the automated validation and Verifier review stages.

---

### 7. Non-Operational External Stakeholders

#### A. Third-Party Service Provider

* **Nature:** Independent entities (surveyors, technical experts, brokers, insurance providers) appointed on an as-needed basis.
* **Assigned Roles:** Can be assigned any operational role (**Submitter, Verifier, Approver, or Inspector**) under delegated authority.
* **Restrictions:** Access is strictly time-bound and limited only to the specific organization, vessel, Assurance Set, and role assigned; they cannot access broader Client or Vessel Provider data.

#### B. Shipping Regulator / External Authority

* **Nature:** External governing bodies (e.g., AMSA, Flag State administrations) requiring compliance records.
* **What They CAN Do:** Receive controlled reports, audit trail exports, compliance records, and statistics generated by authorized MAP users.
* **What They CANNOT Do:** Do not hold standard user roles and **do not directly participate** in the everyday MAP assurance workflow.

---

### Summary Table: Screen-Level Access Control (RBAC)

| Module / UI Screen                       | Administrator | C Admin      | Submitter   | Verifier    | Inspector   | Approver    |
| ---------------------------------------- | ------------- | ------------ | ----------- | ----------- | ----------- | ----------- |
| **Login Screen (UC-01)**                 | ✅ Access      | ✅ Access     | ✅ Access    | ✅ Access    | ✅ Access    | ✅ Access    |
| **Vessel Registration Screen (UC-02)**   | ✅ Access      | ❌ No Access  | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **Create Assurance Set (UC-03 / UC-11)** | ✅ Access      | ✅ Access     | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **Role Assignment Screen (UC-04)**       | ✅ Access      | ❌ No Access  | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access |
| **Document Upload Screen (UC-05)**       | ✅ Access      | ❌ No Access  | ✅ Access    | ❌ No Access | ❌ No Access | ❌ No Access |
| **Verifier UI Screen (UC-08)**           | ✅ Access      | ❌ No Access* | ❌ No Access | ✅ Access    | ❌ No Access | ❌ No Access |
| **Inspector UI Screen (UC-09)**          | ✅ Access      | ❌ No Access  | ❌ No Access | ❌ No Access | ✅ Access    | ❌ No Access |
| **Approver UI Screen (UC-10)**           | ✅ Access      | ❌ No Access  | ❌ No Access | ❌ No Access | ❌ No Access | ✅ Access    |

**Note: A C Admin may only access the Verifier screen if explicitly assigned a dual Verifier role under the assurance agreement.*