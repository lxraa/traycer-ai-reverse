# Changelog

## Release Notes

### 2.13.5

- Added support for hand off to Antigravity.

### 2.13.4

- Fixed the failures observed in the plan generation.

### 2.13.3

- Bug fixes.

### 2.13.2

- Bug fixes.

### 2.13.1

- Resolved issues with plan iteration.
- Bug fixes and performance improvements.

### 2.13.0

- Streaming Plans:
  - Plans now stream in real time, letting you watch Traycer build the plan as it thinks.
  - Improved plan generation performance with more detailed and actionable steps delivered faster.
- Context Gathering Agents and tool-call visibility:
  - Traycer now surfaces the specialized sub-agents it spins up for complex tasks.
  - You can see which sub-agents are active, which tools they’re calling, and how they collaborate via a live tool-call stream.
- Interactive Q&A in Phase Chat:
  - Phase Chat now supports interactive requirement gathering via multiple-choice prompts.
  - Users can respond either through quick-select options or free-form text, reducing ambiguity and errors.
- Navigation improvements:
  - Added breadcrumbs on Phase Board and Phase Details pages for quick navigation back to the Phase Board or Phase Chat.
  - Introduced a drop-down switcher to jump between phases within the same board while viewing phase details, making comparison and cross-phase navigation smoother.
- Bug fixes and performance improvements.

### 2.12.10

- Added support for temporary files in CLI agents to handle large prompts.
- Bug fixes.

### 2.12.9

- Bug fixes

### 2.12.8

- Bug fixes

### 2.12.7

- Bug fixes.

### 2.12.6

- Bug fixes.

### 2.12.5

- Custom CLI Agents:
  - Introduced support for adding custom CLI agents to execute CLI-based coding agents of your choice.
  - CLI agents are now also compatible with Windows systems.
- Bug fixes.

### 2.12.4

- Added support for exporting the phases proposed by Traycer.
- Added a re-review button to easily trigger incremental reviews on top of the proposed review comments.
- Bug fixes.

### 2.12.3

- Bug fixes.

### 2.12.2

- Bug fixes.

### 2.12.1

- Resolved the issue of YOLO mode failing when plan generation step is skipped.

### 2.12.0

- YOLO Mode:
  - Introduced YOLO Mode to enable continuous task execution without manual intervention.
- Bug fixes and performance improvements.

### 2.11.12

- Resolved the issue of plan generation requests getting stuck forever.
- Bug fixes.

### 2.11.11

- Added support for additional coding agents:
  - Claude Code Extension
  - Codex Extension
  - Amp
  - Zencoder
- Bug fixes.

### 2.11.10

- Resolved the issue where the plan generation button was not available after summary type plans were generated.

### 2.11.9

- Resolved the issue where some previous phases were incorrectly displayed as active.

### 2.11.8

- Resolved an issue where incorrect phases were being marked as active.
- Resolved accessibility issues with the query input box.

### 2.11.7

- Resolved the issue of verification failing due to missing implementation plan error.

### 2.11.6

- AGENTS.md support:
  - Introducing support for [AGENTS.md](https://agents.md) to provide machine-readable, project-specific instructions.
  - Traycer will automatically detect and utilize AGENTS.md files when generating and executing artifacts; no configuration or setup needed.
- Enhanced the readability of proposed plans.
- Bug fixes and performance improvements.

### 2.11.5

- Resolved issue with trial status not updating.
- Bug fixes and UX improvements.

### 2.11.4

- Resolved the issue of Regenerate Plan button not working.

### 2.11.3

- Expanded the number of commits users can select in the git mention.
- Fixed focus issue in plan iteration chat input form.

### 2.11.2

- Fixed the issue of plan generation failing due to missing implementation plan error.

### 2.11.1

- Re-enabled the verification request for completed tasks.

### 2.11.0

- Introduced Review Workflow:
  - Agentic code review with thorough exploration and analysis.
  - Perfect for comprehensive code quality checks where you want deep insights into implementation details, potential issues, and improvement opportunities.
- User Query Handoff:
  - You can now bypass the plan and directly send the generated user query to your agent for fixes.
- Git Mention Support:
  - You can now attach diffs against uncommitted changes, main branch, a specific branch, or a specific commit, while creating a task.
- Pro+ Plan:
  - Introduced Pro+ plan with higher slot capacity and recharge rate for power users.
- Bug fixes and performance improvements.

### 2.10.20

- Resolved the issue of intermittent timed out waiting for a response errors.

### 2.10.19

- Bug fixes.

### 2.10.18

- Bug fixes

### 2.10.17

- Bug fixes

### 2.10.16

- Added a selection option for proposed phases to facilitate easy merging or referencing in chat.
- Bug fixes and performance improvements.

### 2.10.15

- Resolved the issue where the prompt templates directory gets created in workspace folders when the Traycer extension is activated.
- Bug fixes.

### 2.10.14

- Bug fixes.

### 2.10.13

- Added search functionality to the Task history.
- Enabled visibility of all tasks across all workspaces in the Task history.
- Enhanced techniques to overcome context window limitations.
- Bug fixes.

### 2.10.12

- Resolved the plan hand-off failure with the Generic template.

### 2.10.11

- Reduced verification latency to receive comments more quickly.
- Improved the quality of phases generated by Traycer.
- Added support to display the prompt template errors as CodeLens.
- Added beta support for setting the language preference of Artifacts generated by Traycer through IDE settings.
- Bug fixes and performance improvements.

### 2.10.10

- Custom Hand-off Templates:
  - You can now create custom prompt templates to pass personalized instructions for code generation when handing off to any agent.
- Bug fixes.

### 2.10.9

- Resolved the issue of all phases disappearing when deleting a phase.

### 2.10.8

- Bug fixes.

### 2.10.7

- Bug fixes and performance improvements.

### 2.10.6

- Bug fixes.

### 2.10.5

- Bug fixes.

### 2.10.4

- Fixed the issue of verification section not showing up after plan execution.

### 2.10.3

- Fixed the problem causing Traycer to restart unexpectedly during plan creation or verification.
- Bug fixes and performance improvements.

### 2.10.2

- Bug fixes.

### 2.10.1

- Enhanced authentication process.
- Fixed the light theme issue with verification.

### 2.10.0

- Support for MCP servers now available:
  - You can set up remote MCP servers to offer context or execute actions outside the codebase.
- Verification process enhanced:
  - Support for incremental re-verification added to review changes via proposed comments.
  - Re-verification from the scratch can now be triggered.
  - Comments can be marked as applied manually.
- Bug fixes and performance improvements.

### 2.9.17

- Bug fixes.

### 2.9.16

- Bug fixes.

### 2.9.15

- Bug fixes.

### 2.9.14

- Bug fixes.

### 2.9.13

- Added "Fix all" button to fix all the review comments on a file at once.
- Bug fixes and performance improvements.

### 2.9.12

- Introducing post-phase conversation to enable iteration on generated phases.
- Bug fixes and performance improvements.

### 2.9.11

- Improved the verification results by taking the plan chat into consideration.
- Added "Fix all" button to fix all the verification comments at once.
- Bug fixes and performance improvements.

### 2.9.10

- Resolved the issue of plan generation failing due to missing binaries.
- Set the Phases mode as the default for Task.

### 2.9.9

- Bug fixes.

### 2.9.8

- Introducing a filter for verification comments according to severity.
- Bug fixes and performance improvements.

### 2.9.7

- Resolved the problem of auto analysis getting stuck at pending state.
- Added support for exporting the plan as Markdown.

### 2.9.6

- Resolved the issue of errors occurring during plan generation.

### 2.9.5

- Added support for persisting the user query when plan iteration fails.
- UX improvements around plan iteration.
- Added a "Generate Plan" button for cases when Traycer offers a plan without any file change suggestions.
- Bug fixes and performance improvements.

### 2.9.4

- Added a section to the extension UI for tracking rate limits and plan details.

### 2.9.3

- Multi-Agent Planner:
  - At the request of our users, we are re-introducing the multi-agent planner.
- Improved the authentication process.
- Bug fixes and performance improvements.

### 2.9.2

- Bug fixes

### 2.9.1

- Bug fixes

### 2.9.0

- Introduced Phases mode for handling complex tasks in multiple guided steps.
- Added support for interactive interviews to gather additional context before plan generation.
- Implemented phase-by-phase verification to confirm output before progressing.
- Bug fixes and performance improvements.

### 2.8.15

- Bug fixes and performance improvements.

### 2.8.14

- Resolved an issue that prevented the task list from loading.

### 2.8.13

- Bug fixes.

### 2.8.12

- Resolved the issue of plan iteration not working.

### 2.8.11

- Resolved the issue causing plan execution failures in certain cases.

### 2.8.10

- Resolved an issue that prevented the task list from loading.

### 2.8.9

- Bug fixes and performance improvements

### 2.8.8

- Bug fixes and performance improvements

### 2.8.7

- Bug fixes and performance improvements

### 2.8.6

- Display the reasoning used while generating the plan.

### 2.8.5

- Added support for VS Code Server for plan execution.
- Bug fixes.

### 2.8.4

- Added support for Gemini and VS Code Insiders for plan execution.
- Bug fixes.

### 2.8.3

- Bug fixes.

### 2.8.2

- Bug fixes.

### 2.8.1

- Display a notification if the chosen AI Agent is not installed.

### 2.8.0

- Improved the UX for plan iteration.
  - Introduced a new section "Plan Chat" inside the Plan Specification step for clarifications and questions about the plan.
- Support for your favorite AI Agents for plan execution.
  - Introduced a new setting to select the AI Agent of your choice for plan execution.
- Bug fixes and performance improvements.

### 2.7.3

- Bug fixes and performance improvements.

### 2.7.2

- Bug fixes.

### 2.7.1

- Fixed issues observed around plan iteration.
- Resolved the issue of empty plan being sent to the IDE native agent for execution.

### 2.7.0

- One-Click Handoff:
  - Seamlessly execute Traycer’s step-by-step implementation plans in the IDE native agent with a single click.
- Improved Plan Iteration:
  - Speed up plan iteration.
  - Quote a section of the plan to iterate on it.
- Bug fixes.

### 2.6.6

- Improved the code generation logic to generate more accurate and relevant code.
- Bug fixes.

### 2.6.5

- Bug fixes.

### 2.6.4

- Traycer Free Plan:
  - Introducing Traycer Free Plan to allow users to use the extension for free.
- Bug fixes and performance improvements.

### 2.6.3

- Quick Agent Planner:
  - Introducing the quick-agent planner for small, focused tasks demanding quick planning and execution.
- Added a configuration option to turn on/off automatically opening diff view post applying changes.
- Added support to open the diff view post applying changes.
- Bug fixes and performance improvements.

### 2.6.2

- Mermaid Diagram:
  - Introducing Mermaid diagrams to visualize the necessary changes in the codebase for a given task.
- Bug fixes and performance improvements.

### 2.6.1

- Bug fixes and performance improvements.

### 2.6.0

- Multi-Agent Planner:
  - Introducing multi-agent planning that triggers multiple agents to work on a Task in parallel.
  - The agents work on different aspects of the Task to generate a more accurate and efficient plan.
- Bug fixes and performance improvements.

### 2.5.1

- Resolved the occasional failures in plan generation.

### 2.5.0

- Ticket Assist: Bridge the Gap Between Tickets and Code
  - AI-powered implementation planner that transforms tickets into step-by-step engineering blueprints, what to change, where, and why.
  - Breaks down tickets into steps, sequence diagrams, and proposes file changes so that developers can execute confidently without back-and-forth.
  - Traycer maps out dependencies and requirements for each Task, so developers spend less time interpreting tickets and more time coding.
  - Import tickets in your IDE with a single click.
- Support for image attachment: You can now attach images to Tasks to provide more context.
- Bug fixes and performance improvements.

### 2.4.2

- Bug fixes.

### 2.4.1

- Bug fixes.

### 2.4.0

- Enhanced context management for large files—Traycer now summarizes and analyzes them in segments, preventing context window overflows during Task planning.
- Reworked summaries to improve readability, making them easier to scan and act upon.
- Resolved memory-related issues to enhance long-term stability and performance.
- Improved the thinking stream to offer a clearer, more accurate reflection of Traycer’s reasoning process.

### 2.3.24

- Improved readability of the plan.
- Bug fixes.

### 2.3.23

- Resolved an issue where tasks were not being generated for local repositories.

### 2.3.22

- Auto Generate Changes: Introduced a new flag to start auto-generating code changes as soon as a plan is created.
- Bug fixes.

### 2.3.21

- Fixed UI issues related to the rate limit indicator.

### 2.3.20

- Resolved issues observed around reviews.
- Bug fixes.

### 2.3.19

- Resolved an issue in which plan changes and chat content were updated incorrectly.

### 2.3.18

- Fixed the issue of extension not getting activated.

### 2.3.17

- Fixed the issue of extension not getting activated.

### 2.3.16

- Improved keyboard bindings for chat.
- Bug fixes.

### 2.3.15

- Chat Enhancements:
  - File Referencing: You can now mention files directly in the chat, making it easier to reference code and resources.
  - Response Accuracy: Fixed an issue that caused non-applied changes from previous responses to be omitted.
- Bug fixes.

### 2.3.14

- Bug fixes.

### 2.3.13

- Improved the performance of code indexing.
- Bug fixes.

### 2.3.12

- Resolved an issue where some unhandled exceptions from the extension were reported.

### 2.3.11

- Resolved an issue where plan generation would fail if no workspace was open.

### 2.3.10

- Fixed the issue of chat send button not working.

### v2.3.9

- Improved the performance of comment indicators and code lenses.
- Bug fixes.

### v2.3.8

- Fixed review thread view design and layout issues

### v2.3.7

- Bug fixes.

### v2.3.6

- Get a peek into Traycer's thinking while it generates a plan.
- Fixed incorrect line change count display on code changes.
- Misc bug fixes and performance improvements.

### v2.3.5

- Bug fixes.

### v2.3.4

- Bug fixes.

### v2.3.3

- Fixed the issue of diff view not opening on Windows.
- Bug fixes and performance improvements.

### v2.3.2

- Stop Chat Request: Introduced functionality to stop response generation for chat requests.
- Bug fixes and performance improvements.

### v2.3.1

- Fixed the issue of horizontal scrollbar appearing in the chat.
- Fixed the issue of plan generation failing on task chain due to deleted files.

### v2.3.0

- Introducing Task Chain Feature: Create follow-up tasks. Relevant context is automatically gathered into subsequent Tasks.
- Performance Improvements:
  - Lazy loading of objects from persistence layer to reduce memory pressure.
  - Adaptive throttling in indexing layer to alleviate CPU starvation while indexing large codebases.

### v2.2.3

- Plan Generation Hangs Fix: Fixed the issue of plan generation hanging when the connection to the server is lost.
- Code Suggestion Improvements: Improved the quality of code suggestions generated by Traycer.
- Indexing Performance Improvements: Improved the performance of codebase indexing.

### v2.2.2

- Sign in with GitHub Fix: Fixed the issue of Sign in with GitHub notification not getting removed even after successful sign in.

### v2.2.1

- Plan Improvements: Enhanced plan generation logic to prevent infinite loading caused by extended connection times.
- Stop Plan or Code Generation: Introduced functionality to stop plan or code generation.
- File Mention Search: Resolved a problem that previously prevented accurate file reference lookups.
- Changes Revert Fix: Corrected an issue that blocked complete rollback of all changes.

### v2.2.0

- Plan Improvements: More precise, task-focused plans streamline workflows by aligning closely with objectives.
- Code Generation Enhancements: Improved issues in code generation like broken code, repeated code blocks etc.
- UI/UX Enhancements: Shift-enter takes you to newline in text areas, improved change management, and added rate limit time display.
- Codebase Indexing: Fixed bugs in codebase indexing and retrieval.

### v2.1.7

- Bug fixes and performance improvements.

### v2.1.6

- Fixed an issue observed on older versions of VS Code.
- Added support to auto-save files when proposed changes are applied.
- Bug fixes and performance improvements.

### v2.1.5

- Fixed the issues observed on Windows.
- Improved the UX for signing in with GitHub for Traycer.
- Bug fixes and performance improvements.

### v2.1.4

- Fixed the issue of plan generation failing when no folders are open in the workspace.

### v2.1.3

- Bug fixes and performance improvements.

### v2.1.2

- Bug fixes and performance improvements.

### v2.1.1

- Fixed plan editor to correctly render changes when multiple plans exist.
- Fixed quick attach context bug that caused the webview to crash.

### v2.1.0

- Codebase indexing: Traycer now creates a vector index for your codebase. This helps Traycer find files that are relevant to a Task. Additionally it enables the Task agent to explore codebase using semantic search.
- Back to the plan: You can now revisit and refine your Task plans even after generating changes. This gives you the flexibility to fine-tune the plan if the initial changes aren’t quite right, ensuring you get exactly what you need.
- Directory Operations: Traycer Tasks now support operations like renaming and creating directories, expanding what you can accomplish beyond individual file changes.
- Improved Performance: We've resolved bugs and enhanced performance to ensure a faster, smoother coding experience.

### v2.0.10

- Improved user experience on webview.

### v2.0.9

- Bug fixes and performance improvements.

### v2.0.8

- Bug fixes and performance improvements.

### v2.0.7

- Bug fixes and performance improvements.

### v2.0.6

- Bug fixes and performance improvements.

### v2.0.5

- Bug fixes and performance improvements.

### v2.0.4

- Bug fixes and performance improvements.

### v2.0.3

- Bug fixes and performance improvements.

### v2.0.2

- Bug fixes.

### v2.0.1

- Bug fixes.

### v2.0.0

- Introducing Tasks Feature: Simplify the complexity of software development with Traycer Tasks. Describe high-level objectives, and Traycer will generate a customizable plan with actionable changesets, making code modifications feel like an ongoing conversation with your codebase.
- Enhanced Code Review System: Traycer's code review has been completely overhauled, providing more insightful and actionable suggestions.
- UI Improvements: Experience a more seamless and user-friendly interface with our latest enhancements.

### v1.3.2

- Bug fixes and performance improvements.

### v1.3.1

- Bug fixes and performance improvements.

### v1.3.0

- Added support for analyses in all programming languages.
- Improved the quality of comments generated by Traycer.
- Added a new command to analyze all local changes at once.
- Bug fixes and performance improvements.

### v1.2.0

- Added support for learning from user feedback to improve the quality of comments.
- Bug fixes and performance improvements.

### v1.1.1

- Fixed the issue of duplicate notifications being displayed.

### v1.1.0

- Introduced support for retaining Traycer comments and analysis history after restarting VS Code.
- Fixed the issue where comments were not correctly updating when files were modified.
- Fixed login issue in Cursor IDE
- Bug fixes and performance improvements.

### v1.0.0

- Enabled paid plans for Traycer.
- Introduced "Re-Analyze File" command to re-analyze the current file.
- Bug fixes and performance improvements.

### v0.12.1

- Added filter to the "Analysis History" view to filter analyses by status.
- Bug fixes and performance improvements.

### v0.12.0

- Introduced "Analysis History" to view the list of analyses triggered by Traycer and their status.
- Enhanced the comment invalidation logic to ensure comments are updated when the file is modified.
- Bug fixes and performance improvements.

### v0.11.0

- Enhanced README with the latest information.
- Improved UX of the "Traycer Comment" view.
- Improved the quality of the comments generated by Traycer.
- Bug fixes and performance improvements.

### v0.10.1

- Fixed the endpoints of the Traycer services.

### v0.10.0

- Replaced the VS Code native comments UX with Traycer's comments UX:
  - Comments generated by Traycer are now listed in the activity bar under the "Traycer" view.
  - Introduced a separate "Traycer Comment" view to display comment details and facilitate conversations with Traycer.
  - Added support for indicating comments in the editor using gutter icons (based on the comment category) and CodeLens.
  - Added configuration options under settings to choose the comment indicators.
- Enhanced notifications for failed analysis and other errors.
- Improved the quality of the comments generated by Traycer.
- Bug fixes and performance improvements.

### v0.9.1

- Bug fixes and performance improvements.

### v0.9.0

- Improved the quality of the comments generated by Traycer.
- Added "Explanation" with the comments to provide more context.
- Added Traycer icon on the editor toolbar to trigger analysis on the entire file, regardless of recent changes.
- Bug fixes and performance improvements.

### v0.8.0

- Improved the quality of the comments generated by Traycer.
- Bug fixes and performance improvements.

### v0.7.0

- Added support for users to reply to the comments generated by Traycer.
- Bug fixes and performance improvements.

### v0.6.0

- Added support for PHP programming language.
- Bug fixes and performance improvements.

### v0.5.0

- Added support for Rust programming language.
- Bug fixes and performance improvements.

### v0.4.3

- Resolved the issue of comments not getting generated for windows.
- Bug fixes and performance improvements.

### v0.4.2

- Bug fixes.

### v0.4.1

- Bug fixes.

### v0.4.0

- Added support for TypeScript React (TSX) files.
- Added support for JavaScript React (JSX) files.
- Bug fixes and performance improvements.

### v0.3.3

- Bug fixes.

### v0.3.2

- Bug fixes.

### v0.3.1

- Resolved the high CPU utilization by the extension during startup.
- Bug fixes and performance improvements.

### v0.3.0

- Added support for passing variable references to reduce the noise in the comments.
- Fixed the issue which caused high CPU usage when the extension was enabled.
- Bug fixes and performance improvements.

### v0.2.7

- Fixed an issue observed with auto analysis of Golang files.
- Bug fixes and performance improvements.

### v0.2.6

- Fixed an issue observed while analyzing a file not present in the git repository.

### v0.2.5

- Bug fixes and performance improvements.

### v0.2.4

- Bug fixes and performance improvements.

### v0.2.3

- Improve README.

### v0.2.2

- Fixed an issue observed with Golang programming language support.

### v0.2.1

- Fixed issues observed for running Traycer on Windows.

### v0.2.0

- Added support for JavaScript and Golang programming languages.
- Added commands `Traycer: Enable Comments Highlighting` and `Traycer: Disable Comments Highlighting` to enable and disable comments highlighting.
- Improved the UX of the Traycer status bar item.
- Bug fixes and performance improvements.

### v0.1.0

- Initial release.
