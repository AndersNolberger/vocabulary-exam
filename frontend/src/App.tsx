import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import LoginPage from './pages/LoginPage';
import WordSetsPage from './pages/WordSetsPage';
import WordSetEditorPage from './pages/WordSetEditorPage';
import QuizPage from './pages/QuizPage';
import Layout from './components/Layout';

const App = () => {
  return (
    <MantineProvider theme={{
      primaryColor: 'indigo',
      defaultRadius: 'md',
      fontFamily: "'Segoe UI', sans-serif",
      headings: { fontFamily: "'Segoe UI', sans-serif", fontWeight: '800' },
      components: {
        Button: { defaultProps: { radius: 'xl' } },
        Paper: { defaultProps: { radius: 'xl' } },
      },
    }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/word-sets" element={<WordSetsPage />} />
            <Route path="/create-word-set" element={<WordSetEditorPage />} />
            <Route path="/word-sets/:id/edit" element={<WordSetEditorPage />} />
            <Route path="/quiz/:id" element={<QuizPage />} />
          </Routes>
        </Layout>
      </Router>
    </MantineProvider>
  );
};

export default App;