# Firebase Studio

This is a NextJS starter in Firebase Studio.

Trying an AI that is entirely web-based workspace for full-stack application development.

My goal is to create the nail studio web appointment schedule for fun.

To get started, take a look at src/app/page.tsx.
# nailStudio

## Project Setup

This Next.js application allows users to book appointments for various nail studio services. It features a calendar view for appointments and a form for scheduling new ones.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn
*   A PostgreSQL database instance

### Environment Variables

Create a `.env.local` file in the root of your project and add your PostgreSQL database connection URL:

```
POSTGRES_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE"
```

Replace the placeholder values with your actual database credentials. Ensure `.env.local` is added to your `.gitignore` file to prevent committing sensitive information.

### Database Schema

Connect to your PostgreSQL database and run the following SQL command to create the necessary `appointments` table:

```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(5) NOT NULL,
    services TEXT[] NOT NULL,
    group_size INTEGER NOT NULL,
    phone_number VARCHAR(20)
);
```

### Running the Application

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will typically be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm run start
```

## Key Features

*   **Appointment Scheduling**: Users can book appointments by selecting services, date, time, and group size.
*   **Dynamic Calendar**: View appointments in a weekly or daily format.
*   **Client-Side Validation**: Ensures data integrity before submission.
*   **Persistent Storage**: Appointment data is stored in a PostgreSQL database.
*   **Responsive Design**: Adapts to various screen sizes.
*   **Theming**: Uses ShadCN UI components and Tailwind CSS with a customizable theme.

## Technology Stack

*   Next.js (App Router)
*   React
*   TypeScript
*   ShadCN UI
*   Tailwind CSS
*   PostgreSQL (with `pg` driver)
*   Zod (for validation)
*   date-fns (for date manipulation)
*   Lucide React (for icons)
*   Genkit (for AI - currently pre-configured)
