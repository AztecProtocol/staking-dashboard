# Contributing to Aztec Staking Dashboard

Thank you for your interest in contributing to the Aztec Staking Dashboard! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. **Clear title** describing the bug
2. **Steps to reproduce** the issue
3. **Expected behavior** vs **actual behavior**
4. **Environment details** (browser, OS, Node version)
5. **Screenshots** if applicable

If your report relates to a **security vulnerability or security-sensitive issue**, please **do not** open a public issue and instead follow the private disclosure process described in `SECURITY.md`.

### Suggesting Features

For feature requests, open an issue with:

1. **Clear description** of the proposed feature
2. **Use case** - why is this feature needed?
3. **Proposed implementation** (optional)
4. **Alternatives considered** (optional)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines below
3. **Test your changes** locally
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/staking-dashboard.git
cd staking-dashboard

# Add upstream remote
git remote add upstream https://github.com/AztecProtocol/staking-dashboard.git

# Create a feature branch
git checkout -b feature/your-feature-name
```

## Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code patterns in the repository
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### Formatting

We use Prettier and ESLint for code formatting:

```bash
# Frontend
cd staking-dashboard
yarn lint        # Check for issues
yarn lint --fix  # Auto-fix issues

# Run Prettier
yarn prettier --write .
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(staking): add unstake confirmation modal
fix(governance): correct vote count calculation
docs(readme): update installation instructions
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventions

### PR Description

Include:
- **What** changes were made
- **Why** these changes were necessary
- **How** to test the changes
- **Screenshots** for UI changes

### Review Process

1. PRs require at least one approval from a maintainer
2. All CI checks must pass
3. Address review feedback promptly
4. Squash commits before merging (if requested)

## Testing

### Frontend

```bash
cd staking-dashboard

# Type checking
yarn tsc --noEmit

# Linting
yarn lint

# Build test
yarn build
```

### Backend

```bash
cd atp-indexer

# Generate types
yarn codegen

# Run tests (if available)
yarn test
```

## Project Structure

Understanding the codebase:

```
staking-dashboard/          # Frontend
├── src/
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page-level components
│   ├── contracts/          # Contract ABIs and types
│   ├── lib/                # Utilities and helpers
│   └── App.tsx             # Main application entry

atp-indexer/                # Backend
├── src/
│   ├── handlers/           # Blockchain event handlers
│   └── api/                # REST API endpoints
├── ponder.config.ts        # Indexer configuration
└── ponder.schema.ts        # Database schema
```

## Getting Help

- **Discord**: Join the [Aztec Discord](https://discord.gg/aztec) for community support
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
