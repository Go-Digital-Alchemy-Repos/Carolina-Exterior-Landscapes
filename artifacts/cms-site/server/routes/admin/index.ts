import { Router } from "express";
import { authenticateToken, requireAdminPermission, requireRole } from "../../middleware/auth";
import dashboardRoutes from "./dashboard.routes";
import usersRoutes from "./users.routes";
import cmsRoutes from "./cms.routes";
import cmsMediaRoutes from "./cms-media.routes";
import cmsSectionsRoutes from "./cms-sections.routes";
import cmsSeoRoutes from "./cms-seo.routes";
import cmsRedirectsRoutes from "./cms-redirects.routes";
import cmsAuditRoutes from "./cms-audit.routes";
import cmsMenusRoutes from "./cms-menus.routes";
import cmsSidebarsRoutes from "./cms-sidebars.routes";
import systemBackupsRoutes from "./system-backups.routes";
import formsRoutes from "./forms.routes";
import editorLocksRoutes from "./editor-locks.routes";

const router = Router();

router.use(authenticateToken);

router.use("/", requireRole("admin"), dashboardRoutes);
router.use("/users", requireRole("admin"), usersRoutes);
router.use("/cms", requireAdminPermission("content"), cmsRoutes);
router.use("/cms", requireAdminPermission("content"), cmsMediaRoutes);
router.use("/cms", requireAdminPermission("content", "design"), cmsSectionsRoutes);
router.use("/cms", requireAdminPermission("content"), cmsSeoRoutes);
router.use("/cms", requireAdminPermission("content"), cmsRedirectsRoutes);
router.use("/cms", requireAdminPermission("content"), cmsAuditRoutes);
router.use("/cms", requireAdminPermission("design"), cmsMenusRoutes);
router.use("/cms", requireAdminPermission("design"), cmsSidebarsRoutes);
router.use("/", requireAdminPermission("content"), formsRoutes);
router.use("/editor-locks", requireRole("admin", "editor"), editorLocksRoutes);
router.use("/", requireRole("admin"), systemBackupsRoutes);

export default router;
