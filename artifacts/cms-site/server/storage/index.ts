import { UserStorage } from "./user.storage";
import { ContactStorage } from "./contact.storage";
import { DocsStorage } from "./docs.storage";
import { PasswordResetStorage } from "./password-reset.storage";
import { SettingsStorage } from "./settings.storage";
import { EmailTemplateStorage } from "./email-template.storage";
import { ActivityStorage } from "./activity.storage";
import { NotificationStorage } from "./notification.storage";
import { CmsPagesStorage } from "./cms-pages.storage";
import { CmsPageRevisionsStorage } from "./cms-page-revisions.storage";
import { CmsMediaStorage } from "./cms-media.storage";
import { CmsSectionsStorage } from "./cms-sections.storage";
import { SeoSettingsStorage } from "./seo-settings.storage";
import { RedirectsStorage } from "./redirects.storage";
import { CmsMenusStorage } from "./cms-menus.storage";
import { CmsSidebarsStorage } from "./cms-sidebars.storage";
import { FormsStorage } from "./forms.storage";
import { EditorLocksStorage } from "./editor-locks.storage";

export const storage = {
  users: new UserStorage(),
  contacts: new ContactStorage(),
  docs: new DocsStorage(),
  passwordResets: new PasswordResetStorage(),
  settings: new SettingsStorage(),
  emailTemplates: new EmailTemplateStorage(),
  activity: new ActivityStorage(),
  notifications: new NotificationStorage(),
  cmsPages: new CmsPagesStorage(),
  cmsPageRevisions: new CmsPageRevisionsStorage(),
  cmsMedia: new CmsMediaStorage(),
  cmsSections: new CmsSectionsStorage(),
  seoSettings: new SeoSettingsStorage(),
  redirects: new RedirectsStorage(),
  cmsMenus: new CmsMenusStorage(),
  cmsSidebars: new CmsSidebarsStorage(),
  forms: new FormsStorage(),
  editorLocks: new EditorLocksStorage(),
};
