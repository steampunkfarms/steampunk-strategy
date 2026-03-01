  
All projects  
Steampunk TARDIS

Parsing cross-repository project reports  
Last message 15 minutes ago  
Consolidating project spaces for unified site management  
Last message 5 hours ago  
Streamlining Meta earnings data into Tardis  
Last message 5 days ago  
Streamlining Meta earnings data into Tardis  
Last message 5 days ago  
TARDIS phase 2 completion instructions  
Last message 5 days ago  
Resuming from checkpoint files  
Last message 5 days ago  
Next.js 15 and React 19 upgrade plan with zero-downtime deployment  
Last message 5 days ago  
Site overview and tech stack analysis  
Last message 6 days ago  
Building "The Bridge" nonprofit accounting platform  
Last message 6 days ago  
Memory  
Only you  
Purpose & context Padrona operates Steampunk Farms, a 501(c)(3) animal sanctuary in Ranchita, California, alongside Cleanpunk Soaps as a social enterprise. The organization manages a sophisticated four-application digital infrastructure including Rescue Barn (public sanctuary website), Studiolo (donor relationship management), Postmaster (AI-powered content automation), and Cleanpunk Shop (e-commerce). The sanctuary generates revenue through multiple streams including social media monetization, with Meta earnings from The Cleanpunk Shop Facebook page. The operation involves complex financial tracking with seasonal cost patterns, commingled purchasing across shared accounts, and the need for comprehensive compliance and monitoring systems. Success is measured through effective animal care delivery, donor relationship management, and maintaining financial transparency for nonprofit operations. Current state All four applications have been successfully upgraded to Next.js 16.1.6 and React 19.2.4, with production deployments completed across Postmaster, Studiolo, Cleanpunk Shop, and Rescue Barn. The financial management system "TARDIS" (formerly "The Bridge") has completed Phase 2 development and now includes comprehensive transaction tracking, seasonal cost analysis, and Gmail-based expense categorization. Recent implementations include Meta remittance processing capabilities that allow drag-and-drop upload of earnings notices for automatic parsing and income categorization. The system actively tracks feed costs from multiple vendors including Elston's Hay & Grain and Star Milling, with established seasonal baseline pricing patterns. A reconciliation system is in place for managing commingled purchases across Amazon, Chewy, and Tractor Supply accounts where farm and personal expenses occasionally cross over. On the horizon An Orchestrator service is planned to consolidate cron jobs scattered across the four applications into a central scheduling and logging system. GitHub Actions deploy notification webhooks and Vercel Blob with Claude Vision for receipt OCR are prioritized for immediate implementation to complement the existing financial tracking infrastructure. The annual reconciliation process for commingled purchasing accounts will require ongoing attention, with the system designed to detect suspected cross-over purchases during Gmail scanning and queue them for review. Key learnings & principles Seasonal pricing patterns are normal market behavior rather than cost creep \- hay prices predictably cycle from post-harvest lows ($11.50-$12.00 per bale) to depletion season peaks ($15.84), making year-over-year comparisons more meaningful than month-over-month changes. Methodical upgrade approaches with thorough testing and staged rollouts minimize deployment risks across complex multi-application ecosystems. Commingled purchasing is an operational reality that requires systematic annual reconciliation rather than real-time separation. The hub-and-spoke data distribution pattern centered on Postmaster effectively manages content syndication and data flow across multiple platforms. Approach & patterns Financial operations follow a comprehensive tracking methodology with automatic Gmail scanning for expense categorization, seasonal baseline management for cost monitoring, and structured reconciliation sessions for resolving commingled purchases. Technology upgrades use detailed pre-merge checklists covering Prisma alignment, type/lint sweeps, preview deployment testing, and staged rollout sequences. Development work is systematically handed off to Claude Code for multi-repository scope and deep codebase integration requirements, with comprehensive technical specifications following established handoff document patterns. The organization maintains a unified Vercel team structure with specific project IDs and deployment workflows across all applications. Tools & resources The technology stack spans Next.js applications deployed on Vercel, with Supabase for public applications and Neon PostgreSQL for internal systems. Authentication uses Supabase OAuth for public apps and NextAuth with Azure AD for internal access. AI integration leverages Anthropic's Claude API for content automation and document parsing. Financial data flows through Prisma-based database schemas with comprehensive models for transactions, vendors, cost tracking, and reconciliation management. Development operations utilize Desktop Commander for multi-repository management, GitHub Actions for deployment workflows, and systematic handoff specifications for complex implementation tasks.

Last updated 3 days ago

Instructions  
tardis refers to the tardis.steampunkstudiolo.org site in the filesystem folders as steampunk-strategy and on vercel as steampunk-strategy-lyndbb8k7-steampunk-studiolo.vercel.app ALWAYS read your attached file efficient-file-handling-instructions.md

Files  
1% of project capacity used

FAMILY\_OF\_SITES.md  
166 lines

md

efficient-file-handling-instructions.md  
62 lines

md

efficient-file-handling-instructions.md  
3.33 KB •62 lines  
•  
Formatting may be inconsistent from source

\# File Handling & Token Efficiency Rules

\#\# 1\. Write to filesystem, not chat  
Files over \~30 lines go directly to the filesystem. Chat is for status updates, not file dumps.

\- \*\*Under 30 lines:\*\* Chat output is fine  
\- \*\*30–200 lines:\*\* Write directly via \`Filesystem:write\_file\` in a single call  
\- \*\*200+ lines:\*\* Use \`Desktop Commander:write\_file\` with chunked append (first chunk mode: 'rewrite', subsequent mode: 'append', max 25–30 lines per chunk)

\#\# 2\. Always-allow filesystem paths  
These directories are pre-authorized — no need to check permissions:  
\- \`/Users/ericktronboll/Projects\` — all repos and steampunk-strategy/docs/  
\- \`/Users/ericktronboll/Desktop/work-folder\` — scratch space

\#\# 3\. Two-tier documentation pattern  
\- \*\*Tier 1 (attachments, always in context):\*\* FAMILY\_OF\_SITES.md (\~165 lines) \+ this file. Use for quick lookups — Vercel IDs, domains, connection map, data flows.  
\- \*\*Tier 2 (filesystem, read on demand):\*\* Full reference library at \`/Users/ericktronboll/Projects/steampunk-strategy/docs/\`. Use \`view\` tool to read site reference cards, voice architecture docs, roadmap, and TARDIS operational docs before building specs or handoffs.  
\- \*\*Rule:\*\* Always read relevant Tier 2 docs before writing handoff specs or planning cross-site work.

\#\# 4\. Staging and checkpoints  
When building multiple related files or doing multi-step work:

1\. Stage on Claude's computer first (\`/home/claude/\[project-name\]/\`)  
2\. Save a \`CHECKPOINT.md\` after each major milestone:  
   \- What's completed, what files exist with sizes  
   \- What remains, any decisions or patterns established  
   \- Destination path on user's filesystem  
3\. Transfer to user's filesystem only when verified correct  
4\. Next session can read the checkpoint and resume without asking

\#\# 5\. Transfer pattern  
Moving files from Claude's computer to user's filesystem:  
\- Read via \`bash\_tool: cat /home/claude/...\`  
\- Write via \`Filesystem:write\_file\` with full content  
\- Verify with \`Filesystem:get\_file\_info\` after writing (or batch verify)  
\- To share a file for download: copy to \`/mnt/user-data/outputs/\` then call \`present\_files\`

\#\# 6\. Never re-read files you just wrote  
After writing, confirm only: filename, line count, location. User can inspect the file themselves.

\#\# 7\. Batch verification  
After writing multiple files, verify all at once with \`Filesystem:list\_directory\` on the target folder. Don't read each file back individually.

\#\# 8\. Recovery protocol  
If a session times out or context gets compacted:  
1\. Check \`/home/claude/\` for staged work or CHECKPOINT.md  
2\. Check memory edits for current state  
3\. Resume from where work left off — don't restart or ask what was happening

\#\# 9\. Handoff specs  
When creating Claude Code handoff documents:  
\- Write to \`/Users/ericktronboll/Projects/steampunk-strategy/docs/handoffs/\`  
\- Read relevant Tier 2 reference cards and voice docs first  
\- Check \`docs/roadmap.md\` for deferred items that intersect  
\- Spec must include: target repo(s), files affected, database changes, cross-site implications, acceptance criteria, deferred items

\#\# 10\. Doc maintenance  
When completing work that changes site architecture, routes, schemas, or patterns:  
\- Update the relevant Tier 2 reference card  
\- Update roadmap.md if deferred items were added or completed  
\- If FAMILY\_OF\_SITES.md needs updating, write it to filesystem and present via \`present\_files\` for re-attachment