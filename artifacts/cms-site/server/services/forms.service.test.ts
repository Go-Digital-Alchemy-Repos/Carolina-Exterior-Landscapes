import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPublicBySlug = vi.fn();
const mockCreateSubmission = vi.fn();
const mockCreateMessage = vi.fn();
const mockGetFormNotificationUsers = vi.fn();
const mockGetUsersByRole = vi.fn();
const mockGetEmailNotificationSettings = vi.fn();
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
    settings: {
      getDecryptedCategory: mockGetEmailNotificationSettings,
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
    mockCreateCrmLeadFromFormSubmission.mockResolvedValue({
      duplicate: false,
      lead: { id: "lead-1" },
    });
    mockGetFormNotificationUsers.mockResolvedValue([{ email: "editor@example.com" }]);
    mockGetUsersByRole.mockResolvedValue([{ email: "admin@example.com" }]);
    mockGetEmailNotificationSettings.mockResolvedValue({});
  });

  it("emails contact form submissions to the configured contact recipient", async () => {
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
    mockGetEmailNotificationSettings.mockResolvedValue({
      contact_form_recipient_email: "contact-team@example.com",
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
      { baseUrl: "https://carolinaexteriorlandscapes.com", clientIp: "203.0.113.42" },
    );

    expect(mockCreateMessage).toHaveBeenCalledWith({
      name: "Van Orcutt",
      email: "van@example.com",
      subject: "Security Camera Installation - Fort Mill",
      message: expect.stringContaining("Phone Number: (803) 995-1522"),
    });
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["contact-team@example.com"],
      "Van Orcutt",
      "van@example.com",
      expect.stringContaining("Tell us about your project: Need cameras for a warehouse."),
      "https://carolinaexteriorlandscapes.com/admin/forms",
      {
        formName: "Contact Form",
        phone: "(803) 995-1522",
        subject: "Security Camera Installation - Fort Mill",
        sourcePage: "contact-form",
      },
    );
    expect(mockSendContactFormEmail.mock.calls[0][3]).toContain(
      "Service of Interest: Security Camera Installation",
    );
    expect(mockSendContactFormEmail.mock.calls[0][3]).toContain("Property Type: Commercial");
    expect(mockGetFormNotificationUsers).not.toHaveBeenCalled();
    expect(mockGetUsersByRole).not.toHaveBeenCalled();
    expect(mockCreateCrmLeadFromFormSubmission).toHaveBeenCalledWith({
      formName: "Contact Form",
      formSubmissionId: "submission-1",
      clientIp: "203.0.113.42",
      data: {
        fullName: "Van Orcutt",
        phone: "(803) 995-1522",
        email: "van@example.com",
        service: "Security Camera Installation",
        propertyType: "Commercial",
        city: "Fort Mill",
        message: "Need cameras for a warehouse.",
      },
    });
  });

  it("falls back to the contact form owner when no user is assigned", async () => {
    mockGetFormNotificationUsers.mockResolvedValue([]);
    mockGetPublicBySlug.mockResolvedValue({
      id: "contact-form-id",
      name: "Contact Form",
      slug: "contact-form",
      fields: [
        contactField("fullName", "Full Name"),
        contactField("email", "Email Address", "email"),
        contactField("message", "Message", "textarea"),
      ],
      settings: { notifyAdmins: true, storeAsContactMessage: true },
    });
    const { submitManagedFormBySlug } = await import("./forms.service");

    await submitManagedFormBySlug("contact-form", {
      fullName: "Jane Homeowner",
      email: "jane@example.com",
      message: "Need a quote",
    });

    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["van@carolinaexteriorlandscapes.com"],
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("emails residential quote submissions through the contact notification path", async () => {
    mockGetPublicBySlug.mockResolvedValue({
      id: "residential-quote-id",
      name: "Residential Quote Form",
      slug: "residential-quote",
      fields: [
        contactField("name", "Full Name"),
        contactField("email", "Email Address", "email"),
        contactField("phone", "Phone Number", "tel"),
        contactField("servicesInterested", "Services Needed", "checkbox", false),
        contactField("sourcePage", "Source Page", "hidden", false),
      ],
      settings: {
        successMessage: "Thanks.",
        notifyAdmins: true,
        storeAsContactMessage: true,
      },
    });
    mockGetEmailNotificationSettings.mockResolvedValue({
      quote_form_recipient_email: "quotes@example.com",
    });
    mockGetFormNotificationUsers.mockResolvedValue([]);

    const { submitManagedFormBySlug } = await import("./forms.service");

    await submitManagedFormBySlug(
      "residential-quote",
      {
        name: "Jane Homeowner",
        email: "jane@example.com",
        phone: "(704) 555-0123",
        servicesInterested: ["Mulch", "Drainage"],
        sourcePage: "/get-a-quote",
      },
      { baseUrl: "https://carolinaexteriorlandscapes.com" },
    );

    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["quotes@example.com"],
      "Jane Homeowner",
      "jane@example.com",
      expect.stringContaining("Services Needed: Mulch, Drainage"),
      "https://carolinaexteriorlandscapes.com/admin/forms",
      {
        formName: "Residential Quote Form",
        phone: "(704) 555-0123",
        subject: "Mulch, Drainage",
        sourcePage: "/get-a-quote",
      },
    );
    expect(mockGetFormNotificationUsers).not.toHaveBeenCalled();
    expect(mockGetUsersByRole).not.toHaveBeenCalled();
  });

  it("uses the same configured quote recipient for commercial quote submissions", async () => {
    mockGetPublicBySlug.mockResolvedValue({
      id: "commercial-quote-id",
      name: "Commercial Quote Form",
      slug: "commercial-quote",
      fields: [
        contactField("contactName", "Contact Name"),
        contactField("email", "Email", "email"),
        contactField("subject", "Subject"),
        contactField("message", "Message"),
      ],
      settings: { notifyAdmins: true, storeAsContactMessage: true },
    });
    mockGetEmailNotificationSettings.mockResolvedValue({
      quote_form_recipient_email: "quotes@example.com",
    });

    const { submitManagedFormBySlug } = await import("./forms.service");
    await submitManagedFormBySlug("commercial-quote", {
      contactName: "Pat Manager",
      email: "pat@example.com",
      subject: "Commercial maintenance",
      message: "Requesting a proposal.",
    });

    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["quotes@example.com"],
      "Pat Manager",
      "pat@example.com",
      "Requesting a proposal.",
      expect.anything(),
      expect.objectContaining({ formName: "Commercial Quote Form" }),
    );
  });

  it("falls back to the existing contact owner when no recipient is configured", async () => {
    mockGetFormNotificationUsers.mockResolvedValue([]);
    mockGetPublicBySlug.mockResolvedValue({
      id: "contact-form-id",
      name: "Contact Form",
      slug: "contact-form",
      fields: [
        contactField("name", "Name"),
        contactField("email", "Email", "email"),
        contactField("subject", "Subject"),
        contactField("message", "Message"),
      ],
      settings: { notifyAdmins: true, storeAsContactMessage: true },
    });

    const { submitManagedFormBySlug } = await import("./forms.service");
    await submitManagedFormBySlug("contact-form", {
      name: "Jane",
      email: "jane@example.com",
      subject: "Question",
      message: "Can you help?",
    });

    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      ["van@carolinaexteriorlandscapes.com"],
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
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

  it.each(["residential-quote", "commercial-quote"])(
    "always sends %s submissions to the CRM pipeline",
    async (slug) => {
      mockGetPublicBySlug.mockResolvedValue({
        id: `${slug}-id`,
        name: "Quote Form",
        slug,
        fields: [contactField("name", "Name"), contactField("email", "Email", "email")],
        settings: { createCrmLead: false },
      });
      const { submitManagedFormBySlug } = await import("./forms.service");

      await submitManagedFormBySlug(slug, { name: "Jane", email: "jane@example.com" });

      expect(mockCreateCrmLeadFromFormSubmission).toHaveBeenCalledWith({
        formName: "Quote Form",
        formSubmissionId: "submission-1",
        data: { name: "Jane", email: "jane@example.com" },
      });
    },
  );
});
