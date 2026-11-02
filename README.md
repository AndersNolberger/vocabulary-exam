# Vocabulary Examination System

## Overview
The Vocabulary Examination System is a web application designed to help users learn and test their vocabulary in different languages. The application features a backend built with .NET 10 C# and an MS SQL LocalDb for data storage, while the frontend is developed using React with Mantine for a modern user interface. The user interface is localized in Swedish, and users authenticate using their Microsoft accounts.

## Features
- **User Authentication**: Users log in using Microsoft accounts.
- **Word Set Management**: Users can create, retrieve, edit, and delete their own sets of words for weekly examinations.
- **Quiz Functionality**: Users can take quizzes based on their created word sets, with questions presented in random order.
- **Spell Checking**: The application checks user-entered words against a predefined list of known words to help with spelling accuracy.
- **Multiple Quiz Modes**: Users can choose between multiple-choice questions or typed answer questions.

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
- Each homework card has separate **Starta flervalsförhör** and **Starta skrivförhör** buttons. The selected mode stays fixed throughout the quiz. After finishing, select **Öva igen på felaktiga svar** to retry only missed words in the same mode, including capitalization-only mistakes. Each retry has its own score and can be repeated until all remaining words are correct.
- Quiz feedback varies between encouraging Swedish messages. Answers differing only in capitalization get a separate yellow reminder about capital letters, rather than the ordinary incorrect-answer message. They still earn no point; only an exact answer is correct.
- Quiz answers must match the saved German spelling exactly, including capitalization and articles; surrounding whitespace is ignored. In typed-answer mode, press **Enter** or select **Svara** to submit. Empty answers and repeated submissions while checking are ignored. Failed checks show an error and allow retrying without losing the answer.
- Paste a full list into **Ett ordpar per rad**, using tabs, semicolons, equals signs, or spaced dashes between words. Select **Läs in listan**: dictionary matches across all rows determine whether German or Swedish comes first. Lists are appended automatically without an order prompt when at least 80% of decisive rows agree and the winning column has exclusive matches on at least half of all rows. Rows where both or neither entry match are not decisive. Otherwise, choose the order and select **Lägg till … ordpar**. Existing words are preserved.
- German entries are checked against the bundled `german.txt` dictionary, both after importing and while editing. Spelling checks are case-sensitive: `die sonne` is flagged, while `die Sonne` is accepted. Unknown entries have a light red input background and an advisory warning; they never block saving. The highlighting clears after correcting the word. Only language-order detection ignores capitalization, so incorrect casing does not prevent identifying the German column. Suggestions preserve dictionary capitalization.
- Leading German articles **der**, **die**, and **das** are ignored during dictionary checks (including language-order detection), but preserved in imported and saved words. Spaces also separate pairs when exactly two entries result, treating an article and its following word as one entry: `das Haus hus` or `hus das Haus`. Ambiguous multiword rows must use an explicit separator, such as `guten Morgen = god morgon`; they are never split by guessing.
- Access the application in your web browser at `http://localhost:3000`.
- Follow the prompts to log in and start creating word sets and quizzes.
- The Swedish interface calls word sets **läxor**. **Mina läxor** and **Skapa läxa** are shown in the menu only after the backend confirms an authenticated session.
- To edit a word set, select **Redigera ord** on its card under **Mina läxor**. Change its name or add, change, or remove word pairs, then select **Spara ändringar**. **Avbryt** returns without saving.
- Select **Redigera ord**, then **Ta bort ordpar** on a row to remove both words in that pair. Save your changes to persist the removal; at least one complete word pair is required.
- Select **Ta bort läxa** on a card to delete the entire set. A confirmation dialog shows the set name and number of word pairs. Select **Avbryt** to keep it or **Ja, ta bort läxan** to permanently delete it. Failed deletions show an error and can be retried.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.