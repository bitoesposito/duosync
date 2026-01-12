# DuoSync API Postman Collection

This directory contains Postman collections and environment files for testing the DuoSync API.

## Files

- **`duosync-api.postman_collection.json`**: Complete API collection with all endpoints
- **`duosync-env.postman_environment.json`**: Environment variables for local development

## Setup

1. **Import Collection**: Import `duosync-api.postman_collection.json` into Postman
2. **Import Environment**: Import `duosync-env.postman_environment.json` into Postman
3. **Select Environment**: Make sure "DuoSync Environment" is selected in Postman
4. **Update Variables**: Update `baseUrl` if your server runs on a different port

## Authentication

Most endpoints require authentication via `auth_token` cookie. To authenticate:

1. Use **Passkey Register** or **Magic Link Request** to create/login
2. The `auth_token` cookie will be automatically set by the server
3. Postman will automatically include cookies in subsequent requests

Alternatively, you can manually set the cookie:
- Go to the request → Cookies tab
- Add cookie: `auth_token` = `<your-token>`

## Endpoints Overview

### Auth
- **Check Auth**: Verify authentication status
- **Logout**: Clear authentication token
- **Passkey Register**: Generate passkey registration options
- **Passkey Verify Registration**: Complete passkey registration
- **Passkey Discover**: Generate authentication options for discoverable credentials
- **Passkey Verify Discover**: Authenticate with discoverable passkey
- **Magic Link Request**: Request magic link email
- **Magic Link Verify**: Verify magic link token

### Timeline
- **Get Timeline**: Calculate timeline for date and user IDs

### Intervals
- **Get Intervals**: List intervals for a date
- **Create Interval**: Create new interval (with examples for recurrence)
- **Get Interval by ID**: Get specific interval
- **Update Interval**: Update existing interval
- **Delete Interval**: Delete interval

## Example Requests

The collection includes pre-filled example requests:

### Create Simple Interval
```json
{
  "start_ts": "2024-01-15T10:00:00Z",
  "end_ts": "2024-01-15T12:00:00Z",
  "category": "busy",
  "description": "Team meeting",
  "recurrence_rule": null
}
```

### Create Daily Recurring Interval
```json
{
  "start_ts": "2024-01-15T09:00:00Z",
  "end_ts": "2024-01-15T10:00:00Z",
  "category": "sleep",
  "description": "Daily sleep schedule",
  "recurrence_rule": {
    "type": "daily",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "until": "2024-12-31T23:59:59Z"
  }
}
```

### Create Weekly Recurring Interval
```json
{
  "start_ts": "2024-01-15T14:00:00Z",
  "end_ts": "2024-01-15T15:00:00Z",
  "category": "busy",
  "description": "Weekly team standup",
  "recurrence_rule": {
    "type": "weekly",
    "daysOfWeek": [1, 3, 5],
    "until": null
  }
}
```

### Create Monthly Recurring Interval
```json
{
  "start_ts": "2024-01-15T10:00:00Z",
  "end_ts": "2024-01-15T11:00:00Z",
  "category": "busy",
  "description": "Monthly review",
  "recurrence_rule": {
    "type": "monthly",
    "daysOfWeek": [],
    "dayOfMonth": 15,
    "until": null
  }
}
```

## Testing Workflow

1. **Register/Login**: Use Passkey or Magic Link to authenticate
2. **Check Auth**: Verify authentication status and get user ID
3. **Create Interval**: Create a test interval
4. **Get Intervals**: List intervals for a date
5. **Get Timeline**: Calculate timeline with your user ID
6. **Update/Delete**: Modify or remove intervals as needed

## Rate Limiting

Some endpoints have rate limiting. Check response headers:
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Notes

- All timestamps must be in ISO 8601 format (UTC)
- Date parameters must be in `YYYY-MM-DD` format
- User IDs in `userIds` query parameter must be comma-separated
- Recurrence rules support `daily`, `weekly`, and `monthly` types
- Monthly recurrences require either `dayOfMonth` or `byWeekday` (not both)
