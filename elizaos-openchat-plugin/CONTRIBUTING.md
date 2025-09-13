# Contributing to @elizaos/plugin-openchat

Thank you for your interest in contributing to the OpenChat plugin for ElizaOS! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Basic understanding of TypeScript
- Familiarity with Internet Computer and OpenChat
- Understanding of ElizaOS plugin architecture

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/elizaos-plugins/plugin-openchat.git
   cd plugin-openchat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
src/
├── actions/          # ElizaOS actions for OpenChat operations
├── evaluators/       # Message and context evaluators
├── providers/        # Context providers for conversation analysis
├── services/         # Core OpenChat service implementations
├── types/           # TypeScript type definitions
├── client.ts        # Main OpenChat client implementation
└── index.ts         # Plugin entry point

examples/            # Usage examples and sample configurations
tests/              # Test files
docs/               # Additional documentation
```

## Development Guidelines

### Code Style

- Use TypeScript for all source code
- Follow the existing code style and formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

### Testing

- Write unit tests for new functionality
- Update existing tests when modifying code
- Ensure all tests pass before submitting PR
- Include integration tests for complex features

### Documentation

- Update README.md for new features
- Add inline code documentation
- Include examples for new functionality
- Update type definitions as needed

## Contributing Process

### 1. Issue Creation

Before starting work:
- Check existing issues to avoid duplication
- Create a new issue describing the feature/bug
- Discuss the approach with maintainers
- Get approval before starting significant work

### 2. Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

### 3. Pull Request

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**
   - Use a clear, descriptive title
   - Include a detailed description
   - Reference related issues
   - Add screenshots/examples if applicable

## Types of Contributions

### Bug Fixes
- Fix issues in existing functionality
- Improve error handling
- Resolve compatibility problems

### New Features
- Add new actions or evaluators
- Implement additional OpenChat integrations
- Enhance client capabilities

### Documentation
- Improve existing documentation
- Add usage examples
- Create tutorials or guides

### Testing
- Add test coverage
- Improve test quality
- Add integration tests

### Performance
- Optimize existing code
- Reduce memory usage
- Improve response times

## Specific Areas for Contribution

### High Priority
- [ ] Real OpenChat Candid interface integration
- [ ] Voice message support
- [ ] File upload/download functionality
- [ ] Advanced group management features
- [ ] Governance proposal integration

### Medium Priority
- [ ] Enhanced message formatting
- [ ] Cross-chain messaging capabilities
- [ ] Analytics and metrics
- [ ] Webhook support
- [ ] Mobile notifications

### Low Priority
- [ ] UI components for configuration
- [ ] Additional reaction types
- [ ] Message scheduling
- [ ] Automated moderation features

## Code Review Process

### For Contributors
- Be responsive to feedback
- Make requested changes promptly
- Ask questions if feedback is unclear
- Test changes thoroughly

### For Reviewers
- Provide constructive feedback
- Focus on code quality and standards
- Consider security implications
- Test functionality when possible

## Release Process

1. **Version Bumping**
   - Follow semantic versioning (semver)
   - Update package.json version
   - Update CHANGELOG.md

2. **Testing**
   - Run full test suite
   - Manual testing of key features
   - Compatibility testing

3. **Documentation**
   - Update README if needed
   - Generate API documentation
   - Update examples

4. **Publishing**
   - Create release notes
   - Tag the release
   - Publish to npm

## Getting Help

### Resources
- [ElizaOS Documentation](https://docs.elizaos.ai)
- [OpenChat Documentation](https://oc.app/docs)
- [Internet Computer Documentation](https://internetcomputer.org/docs)

### Communication
- GitHub Issues: For bugs and feature requests
- GitHub Discussions: For questions and ideas
- Discord: [Join the ElizaOS community]
- Email: [Maintainer contact information]

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain professionalism in all interactions

### Unacceptable Behavior
- Harassment or discrimination
- Spam or off-topic discussions
- Sharing sensitive information
- Disruptive behavior

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation
- Community highlights

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Reach out on Discord

Thank you for contributing to the OpenChat plugin for ElizaOS! 🚀