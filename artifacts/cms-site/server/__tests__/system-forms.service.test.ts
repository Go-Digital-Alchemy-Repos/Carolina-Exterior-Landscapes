import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetBySlug = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../storage", () => ({
  storage: {
    forms: {
      getBySlug: mockGetBySlug,
      create: mockCreate,
      update: mockUpdate,
    },
  },
}));

vi.mock("../utils/logger", () => ({
  logger: {
    app: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  },
}));

describe("ensureSystemForms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves edited fields on existing system forms", async () => {
    mockGetBySlug.mockImplementation(async (slug: string) => {
      if (slug === "residential-quote") {
        return {
          id: "residential-quote-id",
          name: "Custom Residential Quote Form",
          slug: "residential-quote",
          description: "Custom quote description",
          kind: "contact",
          isSystem: true,
          isActive: true,
          fields: [
            {
              id: "message",
              key: "message",
              label: "How can we help?",
              type: "textarea",
              placeholder: "Tell us what you need",
              helpText: "",
              required: true,
              width: "full",
              options: [],
              config: {},
            },
          ],
          settings: {
            submitButtonText: "Send",
            successMessage: "Custom contact success",
            createCrmLead: true,
            notifyAdmins: true,
            storeAsContactMessage: true,
          },
        };
      }

      return undefined;
    });

    const mod = await import("../services/system-forms.service");
    await mod.ensureSystemForms();

    const contactUpdate = mockUpdate.mock.calls.find(
      ([id]: [string]) => id === "residential-quote-id"
    );

    expect(contactUpdate).toBeTruthy();
    expect(contactUpdate[1].name).toBe("Custom Residential Quote Form");
    expect(contactUpdate[1].fields).toHaveLength(1);
    expect(contactUpdate[1].fields[0].label).toBe("How can we help?");
    expect(contactUpdate[1].settings.successMessage).toBe("Custom contact success");
    expect(contactUpdate[1].settings.createCrmLead).toBe(true);
  });

  it("creates missing system forms on a clean install", async () => {
    mockGetBySlug.mockResolvedValue(undefined);

    const mod = await import("../services/system-forms.service");
    await mod.ensureSystemForms();

    expect(mockCreate).toHaveBeenCalledTimes(3);
    const createdSlugs = mockCreate.mock.calls.map(([form]) => form.slug);
    expect(createdSlugs).toEqual(
      expect.arrayContaining([
        "contact-form",
        "residential-quote",
        "commercial-quote",
      ])
    );
    const contactForm = mockCreate.mock.calls.find(([form]) => form.slug === "residential-quote")?.[0];
    expect(contactForm.settings.createCrmLead).toBe(true);
    const serviceField = contactForm.fields.find((field: { key: string }) => field.key === "servicesInterested");
    expect(serviceField.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Drainage Solutions" }),
      ]),
    );
  });
});
