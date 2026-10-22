Selected Work — four-project rebuild for kailor

Includes:
- frontend/src/pages/Public/Home/SelectedWork/SelectedWork.tsx
- frontend/src/pages/Public/Home/SelectedWork/SelectedWork.css
- frontend/public/documents/selected-work/{avenor,northline,morrow,manufacturing-qc}-scope.pdf

Installation from the kailor repo root:

  unzip -o ~/Downloads/kailor-selected-work-rebuild.zip

Before installing, back up your existing SelectedWork.tsx and SelectedWork.css if they contain uncommitted edits you want to preserve.

Requires existing avatar files in frontend/public/clients/17.jpeg through 20.jpeg.

Behaviour:
- four horizontally browsable projects with keyboard and touch/scroll navigation
- solid-charcoal project tile; large title centred; circular avatar, smaller title and short description at bottom-left
- white/transparent project details to the right, including project name, short headline, explanation and link to scope PDF
- scroll-linked section fade in/out and per-slide float-in entrance on reveal
- Explore all projects links to /work (existing route; the page itself is currently a placeholder)
- Start a project opens the established ConversationModal via useConversation

Scope links open in a new tab. The three named client-like scenarios are illustrative project concepts; Manufacturing QC is an independent engineering project. Avatars should not be presented as verified client portraits unless separately confirmed.

This archive does not change other homepage sections or the /work route.
