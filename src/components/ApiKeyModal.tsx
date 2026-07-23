import React from "react";
import SettingsModal, { SettingsModalProps, SettingsTab } from "./SettingsModal";

export type ApiKeyModalProps = SettingsModalProps;

export default function ApiKeyModal(props: ApiKeyModalProps) {
  return <SettingsModal {...props} defaultTab="apikeys" />;
}

export { SettingsModal };
