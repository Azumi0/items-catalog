# Home Item Catalog

Self-hosted home inventory and item catalog progressive web application designed for household users on Synology NAS.

## Language

### Core Entities

**Item**:
A physical possession cataloged in the system with a description, category, and images.
_Avoid_: Product, article, entry

**Category**:
A classification grouping related items together.
_Avoid_: Tag, folder, collection

**User**:
An authenticated household member with full access to browse and manage the catalog.
_Avoid_: Account, client, admin

### Media & Storage

**Original Image**:
The uncompressed original photo uploaded for an item, stored in persistent storage.
_Avoid_: Full picture, raw photo

**Thumbnail**:
An optimized WebP image generated from an original photo for fast catalog browsing.
_Avoid_: Preview, icon, miniature

**Author Snapshot**:
The immutable copy of the creator's username stored on an item (`createdByName`) to preserve attribution if the user is deleted.
_Avoid_: User stamp, creator tag
