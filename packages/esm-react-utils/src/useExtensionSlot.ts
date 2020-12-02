import { useContext, useEffect, useState } from "react";
import {
  registerExtensionSlot,
  unregisterExtensionSlot,
  extensionStore,
  ExtensionStore,
  updateExtensionSlotInfo,
} from "@openmrs/esm-extensions";
import { ModuleNameContext } from "./ModuleNameContext";

export function useExtensionSlot(actualExtensionSlotName: string) {
  const extensionSlotModuleName = useContext(ModuleNameContext);

  if (!extensionSlotModuleName) {
    throw Error(
      "ModuleNameContext has not been provided. This should come from openmrs-react-root-decorator"
    );
  }

  const [
    [attachedExtensionSlotName, extensionIdsToRender],
    setState,
  ] = useState<[string | undefined, Array<string>]>([undefined, []]);

  useEffect(() => {
    registerExtensionSlot(extensionSlotModuleName, actualExtensionSlotName);
    updateExtensionSlotInfo(actualExtensionSlotName);
    return () =>
      unregisterExtensionSlot(extensionSlotModuleName, actualExtensionSlotName);
  }, []);

  useEffect(() => {
    const update = (state: ExtensionStore) => {
      const slotInfo = Object.values(state.slots).find((slotDef) =>
        slotDef.matches(actualExtensionSlotName)
      );

      if (slotInfo) {
        const instance = slotInfo.instances[extensionSlotModuleName];

        if (
          instance &&
          (attachedExtensionSlotName !== slotInfo.name ||
            extensionIdsToRender !== instance.assignedIds)
        ) {
          setState([slotInfo.name, instance.assignedIds]);
        }
      }
    };
    update(extensionStore.getState());
    return extensionStore.subscribe((state) => update(state));
  }, [
    attachedExtensionSlotName,
    extensionIdsToRender,
    extensionSlotModuleName,
  ]);

  return {
    extensionSlotModuleName,
    attachedExtensionSlotName,
    extensionIdsToRender,
  };
}
