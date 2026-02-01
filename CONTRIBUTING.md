# Contributing to CrowdStrike Falcon MCP Server

Thank you for your interest in contributing to the CrowdStrike Falcon MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to foster an inclusive and welcoming community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (Node.js version, OS, etc.)
- Any relevant error messages or logs

### Suggesting Enhancements

We welcome feature requests! Please open an issue with:
- A clear description of the proposed feature
- Use cases and benefits
- Any potential implementation approaches

### Pull Requests

1. **Fork the repository** and create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run build
   # Test the MCP server with Claude
   ```

4. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Reference any related issues

5. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/crowdstrike-falcon-mcp.git
cd crowdstrike-falcon-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev
```

## Code Style

- Use TypeScript for all code
- Follow existing formatting and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and modular

## Adding New Tools

When adding new MCP tools:

1. Define the tool in the `tools` array with:
   - Clear name following the pattern `falcon_*`
   - Descriptive documentation
   - Proper input schema with types

2. Implement the handler in the `CallToolRequestSchema` switch statement

3. Test with the CrowdStrike Falcon API

4. Update the README with:
   - Tool description
   - Parameters
   - Usage examples

## Testing

Currently, testing is manual. When testing changes:

1. Build the project
2. Configure with valid CrowdStrike credentials
3. Test with Claude Desktop or Claude Code
4. Verify API responses are correct
5. Check error handling

## Documentation

- Update README.md for user-facing changes
- Add inline code comments for complex logic
- Update examples if adding new features

## Questions?

Feel free to open an issue for any questions or clarifications needed.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
