import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CrmLead } from "@shared/schema";

const mockFindDuplicateLead = vi.fn();
const mockCreateLead = vi.fn();
const mockUpdateLead = vi.fn();
const mockCreateNote = vi.fn();
const mockGetClientBySourceLeadId = vi.fn();
const mockCreateClient = vi.fn();
const mockCreateClientNote = vi.fn();
const mockGetDecryptedCategory = vi.fn();
const mockUpsertSetting = vi.fn();
const mockInvalidateCategory = vi.fn();
const mockSendCrmLeadNotificationEmail = vi.fn();

vi.mock("../storage", () => ({
  storage: {
    settings: {
      getDecryptedCategory: mockGetDecryptedCategory,
      upsertSetting: mockUpsertSetting,
      invalidateCategory: mockInvalidateCategory,
    },
    crm: {
      findDuplicateLead: mockFindDuplicateLead,
      createLead: mockCreateLead,
      updateLead: mockUpdateLead,
      createNote: mockCreateNote,
      getClientBySourceLeadId: mockGetClientBySourceLeadId,
      createClient: mockCreateClient,
      createClientNote: mockCreateClientNote,
    },
  },
}));

vi.mock("./email.service", () => ({
  sendCrmLeadNotificationEmail: mockSendCrmLeadNotificationEmail,
}));

vi.mock("../utils/logger", () => ({
  logger: {
    email: { warn: vi.fn() },
  },
}));

function lead(overrides: Partial<CrmLead> = {}): CrmLead {
  return {
    id: "lead-1",
    name: "Jane Homeowner",
    email: "jane@example.com",
    phone: "7045551212",
    company: null,
    message: "Need lawn care",
    stage: "new",
    source: "manual",
    externalId: null,
    formSubmissionId: null,
    formData: {},
    metadata: {},
    ownerId: null,
    nextFollowUpAt: null,
    createdAt: new Date("2026-07-07T12:00:00.000Z"),
    updatedAt: new Date("2026-07-07T12:00:00.000Z"),
    ...overrides,
  };
}

describe("crm service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindDuplicateLead.mockResolvedValue(undefined);
    mockCreateLead.mockImplementation(async (data) => ({ ...lead(), ...data, id: "new-lead" }));
    mockUpdateLead.mockImplementation(async (id, data) => ({ ...lead({ id }), ...data }));
    mockCreateNote.mockResolvedValue({ id: "note-1" });
    mockGetClientBySourceLeadId.mockResolvedValue(undefined);
    mockCreateClient.mockImplementation(async (data) => ({ id: "client-1", ...data }));
    mockCreateClientNote.mockResolvedValue({ id: "client-note-1" });
    mockGetDecryptedCategory.mockResolvedValue({});
    mockUpsertSetting.mockResolvedValue({});
    mockSendCrmLeadNotificationEmail.mockResolvedValue(undefined);
  });

  it("creates a new lead with normalized inbound data", async () => {
    const { createOrUpdateCrmLead } = await import("./crm.service");
    const result = await createOrUpdateCrmLead({
      name: "  Jane Homeowner  ",
      email: "jane@example.com",
      phone: "",
      company: "",
      message: "  Yard cleanup  ",
      source: "",
    });

    expect(result.duplicate).toBe(false);
    expect(mockCreateLead).toHaveBeenCalledWith(expect.objectContaining({
      name: "Jane Homeowner",
      email: "jane@example.com",
      phone: null,
      company: null,
      message: "Yard cleanup",
      source: "manual",
    }));
  });

  it("updates duplicate leads and writes a note", async () => {
    mockFindDuplicateLead.mockResolvedValue(lead({ metadata: { first: true }, formData: { old: "yes" } }));
    const { createOrUpdateCrmLead } = await import("./crm.service");

    const result = await createOrUpdateCrmLead({
      name: "Jane",
      email: "JANE@example.com",
      source: "website_form",
      message: "New message",
      metadata: { formName: "Quote" },
      formData: { new: "yes" },
    }, "user-1");

    expect(result.duplicate).toBe(true);
    expect(mockFindDuplicateLead).toHaveBeenCalledWith({ email: "JANE@example.com", phone: null });
    expect(mockUpdateLead).toHaveBeenCalledWith("lead-1", expect.objectContaining({
      message: "New message",
      metadata: { first: true, formName: "Quote" },
      formData: { old: "yes", new: "yes" },
    }));
    expect(mockCreateNote).toHaveBeenCalledWith({
      leadId: "lead-1",
      body: "Duplicate lead received from website_form. Existing lead was updated.",
      createdById: "user-1",
    });
  });

  it("infers lead fields from form data", async () => {
    const { inferCrmLeadFromFormData } = await import("./crm.service");
    expect(inferCrmLeadFromFormData({
      name: { firstName: "Jane", lastName: "Homeowner" },
      email: "jane@example.com",
      tel: "7045551212",
      organization: "Jane LLC",
      comments: "Need a quote",
    })).toEqual({
      name: "Jane Homeowner",
      email: "jane@example.com",
      phone: "7045551212",
      company: "Jane LLC",
      message: "Need a quote",
    });
  });

  it("infers commercial quote aliases from form data", async () => {
    const { inferCrmLeadFromFormData } = await import("./crm.service");
    expect(inferCrmLeadFromFormData({
      contactName: "Morgan Manager",
      companyName: "Acme HOA",
      email: "morgan@example.com",
      phone: "7045551313",
      notes: "Need monthly grounds maintenance.",
    })).toEqual({
      name: "Morgan Manager",
      email: "morgan@example.com",
      phone: "7045551313",
      company: "Acme HOA",
      message: "Need monthly grounds maintenance.",
    });
  });

  it("creates individual and business clients from won leads without duplicates", async () => {
    const { ensureClientForWonLead } = await import("./crm.service");

    await ensureClientForWonLead(lead({ company: null }), "user-1");
    expect(mockCreateClient).toHaveBeenLastCalledWith(expect.objectContaining({ clientType: "individual", preferredContactMethod: "email" }));

    await ensureClientForWonLead(lead({ id: "lead-2", company: "Acme HOA" }), "user-1");
    expect(mockCreateClient).toHaveBeenLastCalledWith(expect.objectContaining({ clientType: "business", companyName: "Acme HOA" }));

    mockGetClientBySourceLeadId.mockResolvedValue({ id: "client-existing", sourceLeadId: "lead-2" });
    const existing = await ensureClientForWonLead(lead({ id: "lead-2", company: "Acme HOA" }), "user-1");
    expect(existing.id).toBe("client-existing");
    expect(mockCreateClient).toHaveBeenCalledTimes(2);
  });
});
