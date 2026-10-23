"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { NotifyPermission } from "@/hooks/useWeatherNotifications";
import type { NotifySettings } from "@/lib/notifications";

interface Props {
  open: boolean;
  placeName: string | null;
  settings: NotifySettings;
  permission: NotifyPermission;
  onChange: (settings: NotifySettings) => void;
  onTest: () => void;
  onClose: () => void;
}

const LEADS: NotifySettings["leadHours"][] = [1, 2, 3];

function permissionNote(permission: NotifyPermission): string | null {
  if (permission === "unsupported")
    return "Este navegador não mostra notificações. No iPhone, instale o app (Compartilhar → Adicionar à Tela de Início, iOS 16.4 ou mais novo) e abra-o por lá.";
  if (permission === "denied")
    return "As notificações estão bloqueadas para este site. Libere-as nas configurações do navegador e volte aqui.";
  return null;
}

export default function NotificationSheet(props: Props) {
  const { open, placeName, settings, permission, onChange, onTest, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const blocked = permission === "unsupported" || permission === "denied";
  const note = permissionNote(permission);

  return (
    <dialog
      ref={dialogRef}
      className="sheet notify-sheet"
      aria-label="Avisos"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2>Avisos</h2>
          <button type="button" className="round-button" onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </header>

        <p className="notify-intro">
          Notificações para {placeName ?? "a cidade aberta"}. São opcionais: o navegador só pede
          permissão quando você liga uma delas.
        </p>

        {note && <p className="notify-note error">{note}</p>}

        <div className="notify-options">
          <label className="notify-row">
            <span>
              <strong>Chuva chegando</strong>
              <small>“Vai chover em ~1h” quando a previsão indicar chuva.</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={settings.rain}
              disabled={blocked}
              onChange={(e) => onChange({ ...settings, rain: e.target.checked })}
            />
          </label>
          {settings.rain && (
            <div className="notify-lead" role="radiogroup" aria-label="Antecedência">
              <span>Antecedência</span>
              {LEADS.map((lead) => (
                <button
                  key={lead}
                  type="button"
                  role="radio"
                  aria-checked={settings.leadHours === lead}
                  className={settings.leadHours === lead ? "active" : undefined}
                  onClick={() => onChange({ ...settings, leadHours: lead })}
                >
                  {lead}h
                </button>
              ))}
            </div>
          )}
          <label className="notify-row">
            <span>
              <strong>Alertas graves</strong>
              <small>
                Granizo, chuva muito forte, rajadas acima de 80 km/h, calor ou frio extremo.
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={settings.severe}
              disabled={blocked}
              onChange={(e) => onChange({ ...settings, severe: e.target.checked })}
            />
          </label>
        </div>

        {permission === "granted" && (settings.rain || settings.severe) && (
          <button type="button" className="locate-button" onClick={onTest}>
            <BellRing size={16} aria-hidden /> Enviar notificação de teste
          </button>
        )}

        <p className="sheet-hint">
          Os avisos são gerados no seu aparelho, sem servidor: chegam enquanto o Atmospherix estiver
          aberto ou numa aba em segundo plano. Com o app fechado não há aviso.
        </p>
      </div>
    </dialog>
  );
}
