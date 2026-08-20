# Tenderloom Git Workflow

This repository uses a branch-first workflow to keep progress visible in the commit graph.

## Rules
- Pushes must go only to: https://github.com/DiorWachira/tenderloom-studio
- Never push feature work directly to main first.
- Use one branch per increment or focused task.
- Merge branches into main with merge commits to preserve graph structure.

## Branch Naming
- increment/<number>-<scope>
- feature/<scope>
- fix/<scope>
- chore/<scope>

## Commit Pattern
- Keep commits small and meaningful.
- Recommended message style:
  - Increment X: <feature delivered>
  - fix: <bug fix summary>
  - chore: <maintenance summary>

## Increment Delivery Loop
1. Create branch from main.
2. Implement and commit locally.
3. Run lint, test, and build.
4. Push branch to origin.
5. Merge to main with --no-ff.
6. Push main.

## Current Execution Plan
- Increment 5 branch will be: increment/5-memo-and-audit-trail
- After increment completion, merge branch into main with a merge commit.
