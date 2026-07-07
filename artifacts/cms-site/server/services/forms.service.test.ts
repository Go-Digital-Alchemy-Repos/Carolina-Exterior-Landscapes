import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPublicBySlug = vi.fn();
const mockCreateSubmission = vi.fn();
const mockCreateMessage = vi.fn();
const mockGetFormNotificationUsers = vi.fn();
const mockGetUsersByRole = vi.fn();
const mockSendContactFormEmail = vi.fn();
const mockSendManagedFormSubmissionEmail = vi.fn();
const mockCreateCrmLeadFromFormSubmission = vi.fn();

vi.mock("../storage", () => ({
  storage: {
    forms: {
      getPublicBySlug: mockGetPublicBySlug,
      createSubmission: mockCreateSubmission,
    },
    contacts: {
      createMessage: mockCreateMessage,
    },
    users: {
      getFormNotificationUsers: mockGetFormNotificationUsers,
      getUsersByRole: mockGetUsersByRole,
    },
  },
}));

vi.mock("./email.service", () => ({
  sendContactFormEmail: mockSendContactFormEmail,
  sendManagedFormSubmissionEmail: mockSendManagedFormSubmissionEmail,
}));

vi.mock("./crm.service", () => ({
  createCrmLeadFromFormSubmission: mockCreateCrmLeadFromFormSubmission,
}));

function contactField(key: string, label: string, type = "text", required = true) {
  return {
    id: key,
    key,
    label,
    type,
    required,
    options: [],
    config: {},
  };
}

describe("submitManagedFormBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendContactFormEmail.mockResolvedValue(undefined);
    mockSendManagedFormSubmissionEmail.mockResolvedValue(undefined);
    mockCreateSubmission.mockResolvedValue({ id: "submission-1" });
    mockCreateMessage.mockResolvedValue({ id: "message-1" });
    mockCreateCrmLeadFromFormSubmission.mockResolvedValue({ duplicate: false, lead: { id: "lead-1" } });
    mockGetFormNotificationUsers.mockResolvedValue([{ email: "editor@example.com" }]);
    mockGetUsersByRole.mockResolvedValue([{ email: "admin@example.com" }]);
  });

  it("emails current contact form submissions directly to the owner email", async () => {
    mockGetPublicBySlug.mockResolvedValue({
      id: "contact-form-id",
      name: "Contact Form",
      slug: "contact-form",
      fields: [
        contactField("fullName", "Full Name"),
        contactField("phone", "Phone Number", "tel"),
        contactField("email", "Email Address", "email"),
        contactField("service", "Service of Interest", "select"),
        contactField("propertyType", "Property Type", "radio"),
        contactField("city", "City / Location"),
        contactField("message", "Tell us about your project", "textarea", false),
      ],
      settings: {
        successMessage: "Thank you for reaching out.",
        notifyAdmins: true,
        storeAsContactMessage: true,
      },
    });

    const { submitManagedFormBySlug } = await import("./forms.service");

    await submitManagedFormBySlug(
      "contact-form",
      {
        fullName: "Van Orcutt",
        phone: "(803) 995-1522",
        email: "van@example.com",
        service: "Security Camera Installation",
        propertyType: "Commercial",
        city: "Fort Mill",
        message: "Need cameras for a warehouse.",
      },
      { baseUrl: "https://carolinaexteriorlandscapes.com" },
    );

    expect(mockCreateMessage).toHaveBeenCalledWith({
      name: "Van Orcutt",
      email: "van@example.com",
      subject: "Security Camera Installation - Fort Mill",
      message: expect.stringContaining("Phone Number: (803) 995-1522"),
    });
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["van@carolinaexteriorlandscapes.com"],
      "Van Orcutt",
      "van@example.com",
      expect.stringContaining("Tell us about your project: Need cameras for a warehouse."),
      "https://carolinaexteriorlandscapes.com/admin/forms",
    );
    expect(mockSendContactFormEmail.mock.calls[0][3]).toContain("Service of Interest: Security Camera Installation");
    expect(mockSendContactFormEmail.mock.calls[0][3]).toContain("Property Type: Commercial");
    expect(mockGetFormNotificationUsers).not.toHaveBeenCalled();
    expect(mockGetUsersByRole).not.toHaveBeenCalled();
  });

  it("creates a CRM lead when a managed form enables CRM ingestion", async () => {
    mockGetPublicBySlug.mockResolvedValue({
      id: "form-1",
      name: "Quote Form",
      slug: "quote",
      fields: [contactField("name", "Name"), contactField("email", "Email", "email")],
      settings: { createCrmLead: true },
    });
    const { submitManagedFormBySlug } = await import("./forms.service");

    await submitManagedFormBySlug("quote", { name: "Jane", email: "jane@example.com" });

    expect(mockCreateCrmLeadFromFormSubmission).toHaveBeenCalledWith({
      formName: "Quote Form",
      formSubmissionId: "submission-1",
      data: { name: "Jane", email: "jane@example.com" },
    });
  });

  it("does not create a CRM lead when CRM ingestion is disabled", async () => {
    mockGetPublicBySlug.mockResolvedValue({
      id: "form-1",
      name: "Quote Form",
      slug: "quote",
      fields: [contactField("name", "Name"), contactField("email", "Email", "email")],
      settings: { createCrmLead: false },
    });
    const { submitManagedFormBySlug } = await import("./forms.service");

    await submitManagedFormBySlug("quote", { name: "Jane", email: "jane@example.com" });

    expect(mockCreateCrmLeadFromFormSubmission).not.toHaveBeenCalled();
  });
});
