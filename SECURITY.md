# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public issue
2. Email security concerns to: [security@example.com](mailto:security@example.com)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- We will acknowledge receipt within 48 hours
- We will provide a more detailed response within 7 days
- We will keep you informed of our progress

## Security Best Practices

For contributors:

- Keep dependencies updated
- Use secure coding practices
- Validate all user inputs
- Follow the principle of least privilege
- Regular security audits

## Dependencies

We regularly update dependencies to address security vulnerabilities:

- Run `pnpm audit` to check for vulnerabilities
- Update dependencies regularly
- Use `pnpm audit --fix` for automatic fixes

## Browser Security

This is a client-side application. Security considerations:

- No server-side data processing
- All data is stored locally
- No external API calls
- Content Security Policy headers included

## Reporting Security Issues

Please do not report security vulnerabilities through public GitHub issues. Instead, please email us directly at [security@example.com](mailto:security@example.com).

Thank you for helping keep our project secure!
