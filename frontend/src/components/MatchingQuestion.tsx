import { useState } from 'react';
import { Button, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ForeignLanguage, QuizQuestion } from '../types';

interface Props {
  questions: QuizQuestion[];
  foreignLanguage: ForeignLanguage;
  disabled: boolean;
  onMatch: (questionId: number, answer: string, hadMistake: boolean) => Promise<boolean>;
  onProgress: (completedCount: number) => void;
  onComplete: () => void;
}

const MatchingQuestion = ({ questions, foreignLanguage, disabled, onMatch, onProgress, onComplete }: Props) => {
  const [germanOrder] = useState(() => {
    const ids = questions.map((question) => question.id);
    for (let index = ids.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [ids[index], ids[randomIndex]] = [ids[randomIndex], ids[index]];
    }
    return ids;
  });
  const [selectedSwedishId, setSelectedSwedishId] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [mistakeIds, setMistakeIds] = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  const chooseGerman = async (germanQuestion: QuizQuestion) => {
    if (disabled || checking || selectedSwedishId === null) return;
    const swedishQuestion = questions.find((question) => question.id === selectedSwedishId);
    if (!swedishQuestion) return;

    if (swedishQuestion.id !== germanQuestion.id) {
      setMistakeIds((ids) => new Set(ids).add(swedishQuestion.id));
      setFeedback('Det paret stämmer inte. Försök igen.');
      return;
    }

    setChecking(true);
    const accepted = await onMatch(
      swedishQuestion.id,
      germanQuestion.foreignOptions[0],
      mistakeIds.has(swedishQuestion.id),
    );
    setChecking(false);
    if (!accepted) return;

    const nextMatchedIds = new Set(matchedIds).add(swedishQuestion.id);
    setMatchedIds(nextMatchedIds);
    setSelectedSwedishId(null);
    setFeedback('Rätt par!');
    onProgress(nextMatchedIds.size);
    if (nextMatchedIds.size === questions.length) onComplete();
  };

  const unmatchedQuestions = questions.filter((question) => !matchedIds.has(question.id));
  const unmatchedGermanQuestions = germanOrder
    .filter((id) => !matchedIds.has(id))
    .map((id) => questions.find((question) => question.id === id)!)
    .filter(Boolean);

  return (
    <Stack>
      <Title order={3} size="h4">Para ihop orden</Title>
      <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="md">
        <Stack gap="xs">
          <Text size="sm" fw={700}>Svenska</Text>
          {unmatchedQuestions.map((question) => (
            <Button key={question.id} variant={selectedSwedishId === question.id ? 'filled' : 'light'}
              disabled={disabled || checking} aria-pressed={selectedSwedishId === question.id}
              onClick={() => {
                setSelectedSwedishId(question.id);
                setFeedback('');
              }}>
              {question.prompt}
            </Button>
          ))}
        </Stack>
        <Stack gap="xs">
          <Text size="sm" fw={700}>{foreignLanguage === 'German' ? 'Tyska' : 'Franska'}</Text>
          {unmatchedGermanQuestions.map((question) => (
            <Button key={question.id} variant="default" disabled={disabled || checking || selectedSwedishId === null}
              loading={checking && selectedSwedishId === question.id}
              onClick={() => { void chooseGerman(question); }}>
              {question.foreignOptions[0]}
            </Button>
          ))}
        </Stack>
      </SimpleGrid>
      {feedback && <Text size="sm" c={feedback === 'Rätt par!' ? 'teal.8' : 'red.7'} role="status">{feedback}</Text>}
    </Stack>
  );
};

export default MatchingQuestion;