# Contributing to Godseed: The Withering Garden

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/sempervent/godseed-the-withering-garden.git`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format
```

## Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new functionality

## Pull Request Process

1. Ensure your code passes all tests: `pnpm test`
2. Ensure your code passes linting: `pnpm lint`
3. Format your code: `pnpm format`
4. Update documentation if needed
5. Submit a pull request with a clear description

## Testing

- Write tests for new features
- Ensure all existing tests pass
- Test manually in different browsers
- Test accessibility features

## Commit Convention

We use conventional commits:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for maintenance tasks

## Issues

When reporting issues:

1. Check existing issues first
2. Use the bug report template
3. Provide clear reproduction steps
4. Include environment details

## Feature Requests

When suggesting features:

1. Use the feature request template
2. Describe the problem clearly
3. Explain your proposed solution
4. Consider alternatives

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions?

Feel free to open an issue for any questions or concerns.
