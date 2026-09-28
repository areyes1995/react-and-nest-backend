// ──────────────────────────────────────────────
// SidebarSection — A titled group of nav links
// ──────────────────────────────────────────────

import SidebarLinkItem, { type SidebarLinkItemProps } from './SidebarLinkItem'
import SidebarDropdown, { type SidebarDropdownProps } from './SidebarDropdown'
import { useAppTranslation } from '@i18n/useAppTranslation'

export interface SidebarSectionProps {
  title: string
  items?: SidebarLinkItemProps[]
  dropdown?: SidebarDropdownProps
}

export default function SidebarSection({ title, items, dropdown }: SidebarSectionProps) {
  const { t } = useAppTranslation()
  return (
    <div>
      {/* Un título vacío indica un bloque sin cabecera (accesos principales). */}
      {title !== '' && (
        <h3 className="text-xs font-medium text-[var(--text-muted)] mb-2 px-2">
          {t(title)}
        </h3>
      )}
      {dropdown ? (
        <SidebarDropdown {...dropdown} />
      ) : (
        <nav className="space-y-0.5 text-sm">
          {items?.map((item, idx) => (
            <SidebarLinkItem key={idx} {...item} />
          ))}
        </nav>
      )}
    </div>
  )
}