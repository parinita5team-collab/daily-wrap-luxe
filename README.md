# Daily Wrap Dashboard

Build a pixel-perfect recreation of a premium Daily Wrap – Team Report web application.

The application should look and behave like a professionally designed SaaS product, not a simple HTML page.

Overall Design

Create a dark luxury interface with a premium modern aesthetic.

Use:

Background: #121218

Cards: #1B1B23

Raised Cards: #232330

Borders: #2E2E3A

Accent Gold: #E8B84B

Green: #4CAF6D

Red: #E1554F

Muted Text: #8E8E9C

Primary Text: #F2F0E8

Typography

Use:

Oswald for all headings

Inter for body text

JetBrains Mono for labels, metadata, statistics and badges

The interface should feel like a combination of:

Linear

Notion

Raycast

Framer

Apple Developer

Use smooth 200ms animations throughout.

Every card should have rounded corners (12-14px).

Buttons should have subtle hover animations.

Cards should slightly elevate on hover.

No bright colors except the gold accent.

Layout

Maximum width:

1180px

Centered.

Padding:

28px top

20px sides

60px bottom

Header Section

Create a hero card.

Inside include:

Small gold label

END OF DAY

Large title

Daily Wrap — Team Report

Subtitle

"What the team worked on today — task, project, client and status, logged throughout the day for a clean end-of-day report."

Right side contains two buttons.

Button 1

+ Log a Task

Gold background

Rounded

Button 2

Copy EOD Report

Gold background

Changes to green and says

Copied ✓

after copying.

Toolbar

Centered toolbar below hero.

Contains:

Previous Day button

Current Date

Next Day button

Today button

The date updates when arrows are pressed.

Stats Section

Display four statistic cards.

Tasks Logged

Completed

In Progress

Blocked

Each statistic card shows:

Large number

Small uppercase mono label

Green numbers for completed.

Gold for progress.

Red for blocked.

Team Section

Three equal columns.

Each column represents a team member.

Use:

Pranita

Osama

Njung

Each member has

Colored avatar square

Name

Completion percentage

Number of tasks

Add Task button

Each task card displays

Task Title

Project

Company

Timeline

Status Badge

Status border on left

Status colours

Grey

Gold

Green

Red

If no tasks exist show

"No updates logged yet today."

Task Cards

Each task card has

Rounded corners

Subtle shadow

Hover animation

Border-left status color

Task title

Project

Company

Timeline

Status pill

Status Pill

Rounded pill.

Uppercase.

JetBrains Mono.

Different background colors.

Statuses

Not Started

In Progress

Completed

Blocked

Task Modal

Clicking Add Task opens a modal.

Modal background is blurred.

Form fields:

Team Member

Task

Project Name

Company Name

Timeline

Date

Status

Buttons

Save

Cancel

Delete

Status selector uses rounded pills.

Team selector also uses pills.

Editing

Clicking an existing task opens the same modal.

Allows editing.

Allows deleting.

Navigation

Users can move between previous and next days.

Store data separately by date.

Copy Report

Generate text like:

Daily Wrap — Thursday, July 30

Pranita

[Completed] Created Social Media Password — Internal (5 Team, Supreme Events)

Osama

No updates logged.

Njung

No updates logged.

Copy to clipboard.

Data

Persist all data in browser local storage.

Data model:

id

teamMember

task

project

company

timeline

date

status

Everything must persist after refresh.

Responsive

Desktop:

Three columns.

Tablet:

Two columns.

Mobile:

Single column.

Interactions

Card hover

Button hover

Modal fade

Smooth transitions

No page reloads

Everything updates instantly.

Code Requirements

Use React.

Use TypeScript.

Use TailwindCSS.

Use component architecture.

Create reusable components.

TeamColumn

TaskCard

StatsCard

Toolbar

Header

Modal

StatusBadge

Avatar

Use clean folder structure.

No inline CSS.

Use modern React hooks.

Animations using Framer Motion.

Design Quality

The final UI should feel identical to a premium SaaS dashboard.

Focus on spacing.

Typography hierarchy.

Visual balance.

Consistency.

The final product should look like a professionally designed internal productivity dashboard suitable for an events, exhibitions and creative marketing company.

Do not simplify anything.

Recreate every interaction, every layout section, every spacing rule and every visual hierarchy as described.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://daily-wrap-luxe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/77ba0f73-6638-463a-af0c-4cb4dd8e217a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
