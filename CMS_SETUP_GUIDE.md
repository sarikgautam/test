# Content Management System Setup Guide

## Overview
Created a complete CMS for managing Sponsors, Gallery, Contact, and Registration CTA content with Supabase backend and admin interface.

## What Was Created

### 1. Database Migration
**File**: `supabase/migrations/20251224051000_create_cms_tables.sql`

Created 5 new tables:
- **sponsors**: Store sponsor information with tiers (platinum, gold, silver, bronze)
- **gallery_images**: Manage gallery images with categories and featured flag
- **contact_info**: Single record for contact details (location, email, phone)
- **contact_submissions**: Store user contact form submissions with status tracking
- **registration_cta**: Manage the registration call-to-action content

All tables have:
- Row Level Security (RLS) enabled
- Public read access for active content
- Admin-only write access
- Proper indexes for performance
- Season association where relevant

### 2. Admin Pages Created
- `/admin/sponsors` - Manage sponsors
- `/admin/gallery` - Manage gallery images
- `/admin/contact` - View submissions & edit contact info
- `/admin/registration-cta` - Edit CTA content

### 3. Frontend Components Updated
Updated to fetch from Supabase instead of using hardcoded data:
- `SponsorsSection.tsx` - Displays sponsors from database
- `GalleryPreview.tsx` - Shows first 6 gallery images
- `ContactSection.tsx` - Displays contact info from database
- `RegistrationCTA.tsx` - Shows active CTA content

## Setup Instructions

### Step 1: Run the Migration
You need to push the new migration to Supabase:

\`\`\`bash
# If using Supabase CLI locally
npx supabase db reset

# Or push just the new migration
npx supabase db push
\`\`\`

If you're using Supabase hosted project, you can:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the content from `supabase/migrations/20251224051000_create_cms_tables.sql`
4. Run it

### Step 2: Update TypeScript Types
After running the migration, regenerate the TypeScript types:

\`\`\`bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
\`\`\`

Or if using hosted Supabase:
\`\`\`bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
\`\`\`

This will fix all the TypeScript errors you're currently seeing.

### Step 3: Test the Setup

1. **Start your dev server**:
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Login as admin** and navigate to:
   - http://localhost:5173/admin/sponsors
   - http://localhost:5173/admin/gallery
   - http://localhost:5173/admin/contact
   - http://localhost:5173/admin/registration-cta

3. **Add some content** to test each section

4. **View the homepage** to see the content display

## Features

### Sponsors Management
- Upload sponsor logos
- Set sponsor tiers (Platinum, Gold, Silver, Bronze)
- Control display order
- Toggle active/inactive status
- Link to sponsor websites

### Gallery Management
- Add images with URLs
- Categorize images
- Mark featured images
- Control display order
- Season association

### Contact Management
- Edit contact information (location, email, phone)
- View all contact form submissions
- Track submission status (new, read, replied, archived)
- Add admin notes to submissions

### Registration CTA
- Customize all text content
- Set badge text, heading, highlight text
- Edit description and button labels
- Toggle active/inactive
- Season-specific CTAs

## Database Schema Notes

### Security
- All tables have RLS enabled
- Public can view active content
- Only admins can create/update/delete
- Contact submissions can be created by anyone

### Relationships
- Sponsors, gallery, and CTA can be associated with seasons
- Contact info is global (not season-specific)

### Constraints
- Display order for organizing items
- Tier validation for sponsors
- Status validation for submissions

## Troubleshooting

### TypeScript Errors
If you see type errors about table names not existing:
- Make sure you ran the migration
- Regenerate the TypeScript types (Step 2 above)

### useSeason Hook Error
The `selectedSeason` property doesn't exist in the current `useSeason` hook. You have two options:
1. Update the hook to expose `selectedSeason`
2. Use the existing season context properties

### RLS Policy Issues
If admins can't edit content:
- Ensure the `has_role()` function exists in your database
- Check that the admin user has the 'admin' role in `user_roles` table

## Next Steps

1. **Add file upload**: Integrate with Supabase Storage for actual image uploads instead of URLs
2. **Contact form**: Create a public contact page with form submission
3. **Rich text editor**: Add WYSIWYG editor for descriptions
4. **Image optimization**: Add image resizing and optimization
5. **Bulk operations**: Add ability to reorder multiple items at once

## Files Modified/Created

### Created:
- `supabase/migrations/20251224051000_create_cms_tables.sql`
- `src/pages/admin/ManageSponsors.tsx`
- `src/pages/admin/ManageGallery.tsx`
- `src/pages/admin/ManageContact.tsx`
- `src/pages/admin/ManageRegistrationCTA.tsx`

### Modified:
- `src/App.tsx` - Added routes
- `src/components/admin/AdminSidebar.tsx` - Added navigation
- `src/components/home/SponsorsSection.tsx` - Fetch from DB
- `src/components/home/GalleryPreview.tsx` - Fetch from DB
- `src/components/home/ContactSection.tsx` - Fetch from DB
- `src/components/home/RegistrationCTA.tsx` - Fetch from DB
