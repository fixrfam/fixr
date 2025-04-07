export const apiDescription = `
# Introduction

Authentication and user management API featuring email/password auth with JWT tokens and secure refresh token handling through HTTP-only cookies.

## Features
- Email/password auth with \`JWT\`
- Secure refresh token rotation
- Email verification flow
- Account management
- Password change for authenticated users

## Auth Flow
1. **Register** - Create unverified account, receive verification email
2. **Verify Email** - Click email link with \`oneTimeToken\`
3. **Login** - Receive \`JWT\` and \`refreshToken\` cookie
4. **Use API** - Include \`JWT\` in Authorization header (\`Bearer <token>\`)
5. **Refresh** - Use \`refreshToken\` cookie to get new \`JWT\` when expired

[Authentication Flow Diagram](/public/flux.svg)

## Security
- Strong password requirements (8-128 chars, upper/lower, numbers, special)
- Required email verification
- HTTP-only \`refreshToken\` cookies
- 30-minute expiry for \`oneTimeTokens\`

For authenticating the user, the api can either receive a \`Authorization\` header on the format \`Bearer {token}\` or send it on the "session" cookie (see cookie naming for more info).

## Responses

All API responses follow a consistent format defined by the [Response](/docs/#model/response) model.
Each response object contains:
- **\`status\`**: HTTP status code (e.g., 200, 404, 500)
- **\`error\`**: Error message if one occurred, otherwise \`null\`
- **\`message\`**: A developer-friendly message for debugging or logging
- **\`code\`**: A unique code for frontend feedback
- **\`data\`**: The requested payload or error details

## Cookies

The API uses Cookies besides \`Authorization\` headers for authenticating the user. 
The server sets and removes every cookie needed for authentication and you dont need to bother with that, but all the cookie **keys** follow this format:

\`\`\`
__{cookieName}__{appName}
\`\`\`

So, for example, the **"session"** cookie on an app called **"Acme"** turns into \`__session__acme\` for avoiding conflicts and ensure consistant naming.

- **Note:** This docs refers the the cookies by their **name**, not by their **keys**, so the \`__session__acme\` cookie, for example, will only be referenced as \`session\`
`;
