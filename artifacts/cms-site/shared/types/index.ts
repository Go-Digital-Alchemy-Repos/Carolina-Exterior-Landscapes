export const UserRole = {
  ADMIN: "admin",
  EDITOR: "editor",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AdminPermission = {
  CONTENT: "content",
  DESIGN: "design",
} as const;
export type AdminPermission = (typeof AdminPermission)[keyof typeof AdminPermission];

export const DocCategory = {
  GETTING_STARTED: "Getting Started",
  USER_MANAGEMENT: "User Management",
  CMS: "CMS",
  FORMS: "Forms",
  MEDIA: "Media",
  SEO: "SEO",
  API_REFERENCE: "API Reference",
  SYSTEM_ARCHITECTURE: "System Architecture",
} as const;
export type DocCategory = (typeof DocCategory)[keyof typeof DocCategory];
