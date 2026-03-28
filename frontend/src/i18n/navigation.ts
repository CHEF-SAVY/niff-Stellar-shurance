import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers — use these instead of next/navigation
// to ensure locale prefix is preserved on route changes.
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
