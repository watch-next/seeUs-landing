# Changelog

## Sprint 4 - Blog Comments System

### Added

- Anonymous comments with persistent identity.
- Nested replies.
- Edit and delete support for comment owners only.
- Like system with optimistic UI.
- Comment reporting system.
- User mention support (`@username`).
- Pagination for comment lists.
- Empty state for posts without comments.
- Loading skeletons during initial fetch.
- Comment counters.
- Reply context banner.
- Delete confirmation dialog.
- Accessible keyboard navigation.

### Improved

- Anonymous ownership persistence after page reload.
- Comment rendering reliability.
- Reply loading and hierarchy.
- Mention mapping between frontend and backend.
- BottomDialog accessibility:
  - focus trapping
  - Escape key support
  - keyboard tab cycling
  - focus restoration
  - ARIA improvements
- UX polish across the entire comments section.
- Optimistic updates for likes.
- Better loading and submission states.

### Fixed

- Fixed ownership detection after reload.
- Fixed reply rendering.
- Fixed mention hydration (`comment_id` mapping).
- Fixed report category mismatch (`offensive_language`).
- Fixed delete confirmation flow.
- Fixed anonymous like/report support for users without previous comments.
- Fixed CommentAuthSelector contract mismatch.
- Fixed several runtime inconsistencies discovered during the final audit.

### Architecture

- Comment authentication remains fully isolated from the Admin authentication system.
- Prepared the authentication layer for future Google/Facebook providers without affecting the current implementation.
- Extended Supabase RPCs to support likes and reports.
- Preserved the existing project architecture with minimal changes.
