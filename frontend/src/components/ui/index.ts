// ──────────────────────────────────────────────
// ui barrel — public API (backward compatible).
// Canonical homes: form/, modal/, cards/, carousel/,
// layout/, feedback/, data-display/, controls/.
// ──────────────────────────────────────────────
export { FormField, FormInput, FormButton, FormTextarea, FormAlert, FormModalFooter } from './form'
export { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmDeleteModal, EntityModalAction, FormModal, formInputClass } from './modal'
export { EntityCardSkeleton, CardError, CardEmpty, StatsGrid, EntityCard, StatusBadge } from './cards'
export { TextCarousel } from './carousel'
export { PageLayout, PanelHeader, SectionTitle, ViewHeader, Breadcrumbs } from './layout'
export type { BreadcrumbItem } from './layout'
export { Toast, EmptyState, ReloadNotificationBanner, SkeletonGrid, SkeletonChartCard } from './feedback'
export type { ToastData } from './feedback'
export { ActivityFeed, Expandable, ExpandableTable, StarRating, ShowMore, DetailInfoGrid } from './data-display'
export type { ActivityEntry } from './data-display'
export { Toggle, DropdownAction, DropdownFilter, DateRangePicker, FilterSelect, Tooltip } from './controls'
