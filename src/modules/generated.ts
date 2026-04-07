import type { AppModule } from "@/lib/modules/contracts";

import { moduleDefinition as module0 } from "@/extensions/commerce/module";
import { moduleDefinition as module1 } from "@/extensions/marketing/module";
import { moduleDefinition as module2 } from "@/extensions/saas/module";

export const installedModules: AppModule[] = [module0, module1, module2];
