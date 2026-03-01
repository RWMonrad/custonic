# Design System Mapping - Custonic Prototypes → Next.js Routes

## Prototype to Route Mapping

| Prototype | File | Next.js Route | Description |
|-----------|------|---------------|-------------|
| code1/screen1 | Landing Page | `/[locale]/(marketing)/page.tsx` | Marketing landing with hero, features, pricing |
| code2/screen2 | Dashboard | `/[locale]/(app)/dashboard/page.tsx` | Main app dashboard with KPIs and widgets |
| code3/screen3 | Contract Details | `/[locale]/(app)/contracts/[id]/page.tsx` | Contract analysis with findings and metadata |
| code4/screen4 | Upload & Analyze | `/[locale]/(app)/upload/page.tsx` | File upload interface with queue management |
| code5/screen5 | Notification Center | Component overlay | Right-side sheet/drawer from AppLayout |
| code6/screen6 | Notification Settings | `/[locale]/(app)/settings/notifications/page.tsx` | Notification preferences and settings |
| code7/screen7 | Alerts Inbox | `/[locale]/(app)/alerts/page.tsx` | Risk alerts and notifications management |
| code8/screen8 | Vendors & Portfolio | `/[locale]/(app)/vendors/page.tsx` | Vendor management and portfolio overview |
| code9/screen9 | Savings & Analytics | `/[locale]/(app)/analytics/page.tsx` | Cost savings analytics and insights |
| code10/screen10 | Organization Management | `/[locale]/(app)/org/page.tsx` | Organization settings and member management |
| code11/screen11 | Roles & Permissions | `/[locale]/(app)/roles/page.tsx` | Role-based access control configuration |

## Design System Requirements

### Color Tokens
- **Primary Background**: #111621 (landing base, new app background)
- **Secondary Background**: #0F172A (old app base, now background-alt)
- **Card Surface**: #1E293B
- **Border**: #334155
- **Primary**: #2563EB
- **Accent**: #60A5FA
- **Success**: #10B981
- **Warning**: #F59E0B
- **Danger**: #EF4444

### Typography
- **Primary**: Inter (next/font)
- **Monospace**: JetBrains Mono (limited use for labels/data)

### Icons
- Replace Material Symbols with lucide-react
- Maintain consistent icon sizing and styling

### Layout Patterns
- **Marketing**: Full-width sections with centered content
- **App**: Fixed sidebar + topbar + scrollable content
- **Mobile**: Responsive collapsible sidebar
- **Overlays**: Right-side sheets for notifications

### Component Library
- SidebarNav with active states
- Topbar with search and actions
- Card variants (base, KPI, risk)
- Data tables with sorting/filtering
- Upload zones with progress indicators
- Settings forms with toggles
- Permission matrices for roles

## Implementation Notes

- Dark mode is primary (class-based strategy)
- No hardcoded colors in components
- Reusable components in `src/shared/ui`
- Consistent spacing using Tailwind tokens
- Responsive design from mobile up
- Accessibility considerations (ARIA labels, keyboard nav)
