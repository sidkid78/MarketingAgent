# AI Marketing Agent

## Project Overview

The AI Marketing Agent is a web application designed to assist marketers in generating content ideas, developing marketing strategies, and analyzing campaign performance. It leverages the power of Azure OpenAI to provide intelligent suggestions and insights, streamlined through a user-friendly interface built with Next.js, TypeScript, and Shadcn UI.

For a detailed explanation of the project's architecture, please see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Features

-   **AI-Powered Content Idea Generation**: Dynamically generates creative content ideas tailored to specific marketing goals, target platforms, and audience demographics.
-   **Intelligent Marketing Strategy Creation**: Develops comprehensive marketing strategies based on user inputs like campaign objectives, target audience, and brand details.
-   **Automated Performance Analysis**: (Future) Provides insights into campaign performance by analyzing key metrics and suggesting optimizations.
-   **Interactive Wizard**: Guides users through the process of inputting campaign details.
-   **Modern Tech Stack**: Built with the latest web technologies for a robust and scalable solution.

## Tech Stack

-   **Frontend**: Next.js 15 (App Router), React 19, TypeScript
-   **UI**: Shadcn UI, Radix UI, Tailwind CSS
-   **AI**: Azure OpenAI Service (via `openai` Node.js SDK)
-   **State Management**: React Context, `useActionState`, URL state with `nuqs`
-   **Linting/Formatting**: ESLint, Prettier (assumed)

## Getting Started

### Prerequisites

-   Node.js (version 20.x or later recommended)
-   npm, yarn, or pnpm
-   Access to Azure OpenAI Service with a deployed model (e.g., GPT-4.1)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd marketing_agent
    ```

2.  **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    cd ..
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the `frontend` directory (`frontend/.env.local`). This file should contain your Azure OpenAI credentials and other necessary environment variables.

    ```env
    # frontend/.env.local

    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY="your_azure_openai_api_key"
    AZURE_OPENAI_ENDPOINT="your_azure_openai_endpoint_url" # e.g., https://your-resource-name.openai.azure.com/
    AZURE_OPENAI_DEPLOYMENT_NAME="your_chat_model_deployment_name" # e.g., gpt-4-1

    # Next.js public environment variables (if any)
    # NEXT_PUBLIC_...
    ```
    **Important**: Ensure `.env.local` is added to your `.gitignore` file to prevent committing sensitive credentials.

## Running the Application

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application should now be running, typically at `http://localhost:3000` (or `http://localhost:3001` as per your logs).

## API Endpoints

The backend functionality is served via Next.js API Routes:

-   `POST /api/content-ideas`: Generates content ideas based on user inputs.
-   `POST /api/generate-strategy`: Generates marketing strategies.
-   `POST /api/performance-analysis`: (Future) Analyzes campaign performance.

## Project Structure (Simplified)

```
marketing_agent/
├── frontend/
│   ├── public/                   # Static assets
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── api/              # API route handlers
│   │   │   │   │   ├── content-ideas/
│   │   │   │   │   ├── generate-strategy/
│   │   │   │   │   └── performance-analysis/
│   │   │   │   ├── dashboard/        # Main dashboard page
│   │   │   │   └── ...               # Other pages and layouts
│   │   │   ├── components/           # React components (UI, wizard, etc.)
│   │   │   ├── lib/                  # Utility functions, helpers
│   │   │   └── ...
│   │   ├── .env.local                # Environment variables (GITIGNORED)
│   │   ├── .gitignore                # Frontend specific gitignore
│   │   ├── next.config.js            # Next.js configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── .gitignore                    # Root gitignore (should contain frontend/.env.local or *.env.local)
│   └── README.md                     # This file
```

## Contributing

(Details on how to contribute to the project, if applicable)

## License

MIT
