# Youth Alive Backend

Backend API service for Youth Alive check-in system, integrating with Jotform for event registration.

## Features

- **Authentication System**: JWT-based authentication with registration, login, and password reset
- **Event Management**: Integration with Jotform to fetch and display events
- **Ticket System**: Registration confirmation with QR codes for check-in
- **Webhook Handler**: Process form submissions from Jotform automatically
- **Check-in System**: Scan QR codes and search for guests at events

## Tech Stack

- Node.js and Express
- TypeScript
- MongoDB with Mongoose ODM
- JWT Authentication
- MailerSend for email delivery
- QR Code generation

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB instance (local or Atlas)
- Jotform API key
- MailerSend API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Bijin10/youthalive_backend.git
   cd youthalive_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values

### Development

Run the development server:

```bash
npm run dev
```

### Building for Production

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## API Routes

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login
- `POST /api/auth/forgot-password`: Request password reset
- `POST /api/auth/reset-password`: Reset password with token

### Events

- `GET /api/events`: List all events
- `POST /api/webhooks`: Webhook endpoint for Jotform

### Check-in

- `GET /api/checkin/search`: Search for guests
- `POST /api/checkin/scan`: Check in a guest with QR code

## License

This project is licensed under the ISC License.
