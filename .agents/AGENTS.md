# Project Rules

## Git Workflow for "Push and Deploy" ("PND")

When the user requests to "Push and Deploy", "PND" (or uses equivalent phrasing) after completing a feature or bug:

1. **Commit Changes**: Ensure all outstanding changes for the feature or bug are committed. If there are uncommitted changes, stage them and commit with a clear, descriptive commit message.
2. **Create New Branch**:
   - If currently on `main` or another base branch, create and switch to a new descriptive branch (e.g., `feature/short-description` or `bugfix/short-description`).
   - If already on a feature/bug branch, ensure the branch name is descriptive and all work is committed there.
3. **Push New Branch**: Push the feature/bug branch to the remote repository (e.g., `git push origin <branch-name>`).
4. **Merge into Main**:
   - Switch to the `main` branch (`git checkout main`).
   - Pull the latest changes from the remote main branch (`git pull origin main`) to prevent conflicts.
   - Merge the feature/bug branch into `main` (`git merge <branch-name>`).
5. **Push Main**: Push the merged `main` branch to the remote repository (`git push origin main`).
