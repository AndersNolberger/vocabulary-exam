# Vocabulary Examination System

## Overview
The Vocabulary Examination System is a web application designed to help users learn and test their vocabulary in different languages. The application features a backend built with .NET 10 C# and an MS SQL LocalDb for data storage, while the frontend is developed using React with Mantine for a modern user interface. The user interface is localized in Swedish, and users authenticate using their Microsoft accounts.

## Features
- **User Authentication**: Users log in using Microsoft accounts.
- **Word Set Management**: Users can create, retrieve, edit, and delete their own sets of words for weekly examinations.
- **German and French word sets**: Each set stores its foreign language and uses the matching bundled spelling dictionary. Existing sets default to German.
- **Quiz Functionality**: Users can take quizzes based on their created word sets, with questions presented in random order.
- **Spell Checking**: The application checks user-entered words against a predefined list of known words to help with spelling accuracy.
- **Multiple Quiz Modes**: Users can choose multiple choice, typed answers, reverse translation, word matching, flashcards, and German article drills for German sets.

## Project Structure
```
vocabulary-exam
├── backend
│   ├── VocabularyExam.Api
│   ├── VocabularyExam.sln
├── frontend
│   ├── public
│   ├── src
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js and npm
- MS SQL LocalDb

### Installation

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd vocabulary-exam
   ```

2. **Setup the backend**:
   - Navigate to the backend directory:
     ```
     cd backend/VocabularyExam.Api
     ```
   - Restore the NuGet packages:
     ```
     dotnet restore
     ```
   - Update the database using migrations:
     ```
     dotnet ef database update
     ```

3. **Run the backend**:
   ```
   dotnet run
   ```

4. **Setup the frontend**:
   - Navigate to the frontend directory:
     ```
     cd ../frontend
     ```
   - Install the dependencies:
     ```
     npm install
     ```

5. **Run the frontend**:
   ```
   npm run dev
   ```

### Usage
- **Mina läxor** now shows personal XP, level progress, achievements, and statistics on every homework card: completed rounds, overall accuracy, best round, and current words needing practice (based on their latest completed-round answer). New and untested words are not counted as mistakes.
- Choose one or more words from a homework set before starting a quiz; all words are selected by default. Complete a round to bank **5 XP per correct answer + 10 XP for finishing**. Successive level-ups cost **100, 150, 225, 338, 507… XP** (each cost is 50% higher, rounded up). Existing XP is preserved; levels are recalculated using this curve. Failed-word retries and difficult-word rounds count too. Incomplete rounds earn no XP and do not affect statistics. Capitalization mistakes count as incorrect.
- Achievements have three tiers, calculated from saved completed-round history: **Första steget** (1/3/9 rounds), **Fullträff!** (1/3/9 perfect rounds, including retries), **Ordmagiker** (50/150/450 correct answers), **Övningshjälte** (10/30/90 rounds), **Tangenttrollkarl** (25/75/225 correct typed answers), and **Revanschmästare** (5/15/45 correct answers immediately following a wrong answer to that same word). **Dina utmärkelser** is collapsed by default, showing a compact unlocked-tier count; expand it to see earned tiers and the next target. The results screen celebrates newly reached tiers.
- On each homework card, **Svåra ord: flerval** and **Svåra ord: skriv själv** appear when current words have been answered incorrectly **at least twice** and on **at least 40%** of their attempts. Both modes use only that user's completed-round history, including retries, and select up to 10 eligible words, highest error rate first (then most mistakes). Untested, deleted, and replaced words are excluded. As accuracy improves, words leave this practice pool; the count refreshes when returning to **Mina läxor**. A failed-word retry still includes exactly the mistakes from its preceding round, regardless of the difficult-word threshold.
- Progress is stored on the backend for each Microsoft user and survives browser/app restarts. Results are graded and XP calculated by the server; resubmitting an answer cannot award XP twice. Recording starts with this feature (older quizzes cannot be reconstructed). Deleting a homework keeps earned personal XP/achievements; its card statistics disappear. Editing/replacing words retains historical accuracy, but removed words no longer count as needing practice.
- Startup applies additive `ProgressDbContext` migrations to the configured database, using `__ProgressMigrationsHistory`, and adds the word-set language column with a German default when upgrading an existing database. Existing homework tables and data are preserved; no database reset is needed. Both SQLite development and SQL Server are supported. Back up the database before deploying schema changes.
- Each homework card has separate **Starta flervalsförhör** and **Starta skrivförhör** buttons. The selected mode stays fixed throughout the quiz. After finishing, select **Öva igen på felaktiga svar** to retry only missed words in the same mode, including capitalization-only mistakes. Each retry has its own score and can be repeated until all remaining words are correct.
- Choose **Tyska** or **Franska** when creating a word set. Spelling checks and imported-list order detection use that language's bundled dictionary, and the set's language is shown on its homework card. Existing sets remain German.
- **Fler övningssätt** offers reverse translation (the selected foreign language to Swedish), matching, and flashcards with self-assessed recall. German sets also offer article drills for entries beginning with **der**, **die**, or **das**. Matching allows another attempt after a wrong pairing; flashcards let users reveal the answer and mark whether they knew it.
- Quiz feedback varies between encouraging Swedish messages. Answers differing only in capitalization get a separate yellow reminder about capital letters, rather than the ordinary incorrect-answer message. They still earn no point; only an exact answer is correct.
- Quiz answers must match the saved foreign-language spelling exactly, including capitalization and any saved article; surrounding whitespace is ignored. In typed-answer mode, press **Enter** or select **Svara** to submit. Empty answers and repeated submissions while checking are ignored. Failed checks show an error and allow retrying without losing the answer.
- Paste a full list into **Ett ordpar per rad**, using tabs, semicolons, equals signs, or spaced dashes between words. Select **Läs in listan**: dictionary matches across all rows determine whether German or Swedish comes first. Lists are appended automatically without an order prompt when at least 80% of decisive rows agree and the winning column has exclusive matches on at least half of all rows. Rows where both or neither entry match are not decisive. Otherwise, choose the order and select **Lägg till … ordpar**. Existing words are preserved.
- Foreign-language entries are checked against the selected bundled dictionary (`german.txt` or `french.txt`), both after importing and while editing. Unknown entries have a light red input background and an advisory warning; they never block saving. German spelling checks remain case-sensitive: `die sonne` is flagged, while `die Sonne` is accepted. Leading German articles **der**, **die**, and **das**, and common French articles, are ignored during dictionary checks.
- Leading German articles **der**, **die**, and **das** and common French articles are preserved in imported and saved words. Spaces also separate pairs when exactly two entries result, keeping an article and its following word together. Ambiguous multiword rows must use an explicit separator, such as `guten Morgen = god morgon`; they are never split by guessing.
- Access the application in your web browser at `http://localhost:3000`.
- Follow the prompts to log in and start creating word sets and quizzes.
- The Swedish interface calls word sets **läxor**. **Mina läxor** and **Skapa läxa** are shown in the menu only after the backend confirms an authenticated session.
- **Mina läxor** lists the newest created homework first. Editing an existing homework does not change its position.
- To edit a word set, select **Redigera ord** on its card under **Mina läxor**. Change its name or add, change, or remove word pairs, then select **Spara ändringar**. **Avbryt** returns without saving.
- Select **Redigera ord**, then **Ta bort ordpar** on a row to remove both words in that pair. Save your changes to persist the removal; at least one complete word pair is required.
- Select **Ta bort läxa** on a card to delete the entire set. A confirmation dialog shows the set name and number of word pairs. Select **Avbryt** to keep it or **Ja, ta bort läxan** to permanently delete it. Failed deletions show an error and can be retried.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

### Validation
- Run `dotnet run --project backend/VocabularyExam.Checks` for isolated in-memory SQLite progress/quiz regressions and SQL Server migration-script generation (no real user data or SQL Server connection is used).
- Run `npm run build` in `frontend` to type-check and build the UI.

## Azure Deployment

The GitHub Actions workflow in `.github/workflows/azure-app-service.yml` builds the React frontend and .NET API, runs the backend checks, packages the frontend into the API, and deploys to Azure App Service after a push to `main`. Pull requests run the build and checks without deploying. The app is served from one origin, so production API requests and Microsoft sign-in use the same host.

One-time Azure setup:

1. Create a Linux Azure App Service using the .NET 10 runtime and an Azure SQL Database. Keep the database in the same region where practical.
2. Register the App Service callback URL as a Web redirect URI in the Microsoft Entra app registration: `https://<app-name>.azurewebsites.net/signin-microsoft`. Use the custom-domain hostname instead if one is configured.
3. Configure these App Service application settings. Store credentials in App Service settings or Key Vault; never commit them to the repository.
  - `Database__Provider`: `SqlServer`
  - `ConnectionStrings__DefaultConnection`: the Azure SQL connection string. For managed identity, include `Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;` and omit SQL credentials.
  - `Authentication__Microsoft__ClientId`: the Entra app client ID used for user sign-in
  - `Authentication__Microsoft__ClientSecret`: the Entra app client secret used for user sign-in
4. Prefer the App Service's system-assigned managed identity for Azure SQL access. Configure the SQL server's Microsoft Entra administrator and grant the app identity the database permissions it needs. The API currently creates/updates its schema during startup, so it requires schema modification permissions; move schema updates to a controlled migration step before reducing those permissions.
5. Configure GitHub Actions variables in the repository: `AZURE_WEBAPP_NAME`, `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`. `AZURE_CLIENT_ID` is the separate GitHub deployment identity, not the Microsoft sign-in client ID above. Create a federated identity credential for this repository's `main` branch with subject `repo:<owner>/<repo>:ref:refs/heads/main`, and grant that identity the Website Contributor role on the App Service.
6. Push to `main`. GitHub Actions runs the checks and deploys only if they pass. `workflow_dispatch` can also deploy the selected `main` branch.

For local development, Vite proxies `/api` requests to `http://localhost:5000`; start the API and frontend as usual. The production API serves the built frontend from `wwwroot`.

## License
This project is licensed under the MIT License. See the LICENSE file for details.