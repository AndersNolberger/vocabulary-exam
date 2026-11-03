import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Checkbox, Group, Paper, Progress, Stack, Text, Title } from '@mantine/core';
import { startQuizRound, QuizAnswerResult, submitAnswer } from '../api/quizApi';
import { RoundCompletion } from '../api/progressApi';
import { fetchWordSet } from '../api/wordSetsApi';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import MatchingQuestion from '../components/MatchingQuestion';
import TypedAnswerQuestion from '../components/TypedAnswerQuestion';
import { ForeignLanguage, QuizQuestion, WordSet } from '../types';

type QuizMode = 'choice' | 'typed' | 'reverse' | 'matching' | 'article' | 'flashcard';

const quizModes: QuizMode[] = ['choice', 'typed', 'reverse', 'matching', 'article', 'flashcard'];

const hasGermanArticle = (word: string) => /^(der|die|das)\s+\S+/i.test(word.trim());

const feedbackMessages = {
  correct: ['Rätt! Snyggt jobbat!', 'Precis rätt! Du har koll!', 'Fullträff! Bra kämpat!', 'Helt rätt! Ett ord till på plats.'],
  incorrect: ['Inte riktigt rätt den här gången. Fortsätt öva!', 'Det stämde inte riktigt. Nästa ord är en ny chans!', 'Fel den här gången, men varje försök hjälper dig framåt!'],
  capitalization: [
    'Nästan! Kontrollera stora och små bokstäver; svaret måste stämma exakt.',
    'Du kan ordet! Kontrollera stora och små bokstäver.',
    'Så nära! Bara stora och små bokstäver skiljer.',
  ],
};

const chooseInitialQuestionIds = (wordSet: WordSet, mode: QuizMode) => {
  const availableIds = wordSet.wordPairs
    .filter((pair) => mode !== 'article' || hasGermanArticle(pair.foreignWord))
    .flatMap((pair) => pair.id === undefined ? [] : [pair.id]);
  const selectedIds: number[] = [];
  while (availableIds.length > 0 && selectedIds.length < 10) {
    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const [selectedId] = availableIds.splice(randomIndex, 1);
    if (selectedId !== undefined) selectedIds.push(selectedId);
  }
  return selectedIds;
};

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const mode: QuizMode = quizModes.includes(requestedMode as QuizMode) ? requestedMode as QuizMode : 'choice';
  const difficultOnly = searchParams.get('practice') === 'difficult';

  return <QuizSession key={`${id}-${mode}-${difficultOnly}`} wordSetId={Number(id)} mode={mode} difficultOnly={difficultOnly} />;
};

const QuizSession = ({ wordSetId, mode, difficultOnly }: { wordSetId: number; mode: QuizMode; difficultOnly: boolean }) => {
  const typed = mode === 'typed' || mode === 'reverse';
  const [foreignLanguage, setForeignLanguage] = useState<ForeignLanguage>('German');
  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [failedQuestions, setFailedQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [matchingComplete, setMatchingComplete] = useState(false);
  const [roundId, setRoundId] = useState('');
  const [completion, setCompletion] = useState<RoundCompletion | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const retryPending = useRef(false);

  useEffect(() => {
    let active = true;
    const loadQuiz = async () => {
      try {
        if (difficultOnly) {
          const round = await startQuizRound(wordSetId, typed, undefined, true, undefined, mode);
          if (active) {
            setForeignLanguage(round.foreignLanguage);
            setRoundId(round.roundId);
            setQuestions(round.questions);
            setStarted(true);
          }
        } else {
          const set = await fetchWordSet(wordSetId);
          if (active) {
            setWordSet(set);
            setForeignLanguage(set.foreignLanguage);
            setSelectedQuestionIds(chooseInitialQuestionIds(set, mode));
          }
        }
      } catch {
        if (active) setError(difficultOnly
          ? 'Kunde inte starta förhöret. Det kanske inte finns några svåra ord kvar. Gå tillbaka till Mina läxor.'
          : 'Kunde inte hämta läxans ord. Gå tillbaka till Mina läxor och försök igen.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadQuiz();
    return () => { active = false; };
  }, [wordSetId, difficultOnly, mode, typed]);

  const beginQuiz = async () => {
    if (loading || selectedQuestionIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const round = await startQuizRound(wordSetId, typed, undefined, false, selectedQuestionIds, mode);
      setRoundId(round.roundId);
      setQuestions(round.questions);
      setStarted(true);
    } catch {
      setError('Kunde inte starta förhöret. Läxan kan ha ändrats. Gå tillbaka till Mina läxor och försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const recordAnswer = async (questionId: number, answer: string) => {
    if (submissionPending.current || (mode !== 'matching' && result !== null) || !answer.trim()) return null;
    submissionPending.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const answerResult = await submitAnswer(roundId, questionId, answer);
      if (mode !== 'matching') setResult(answerResult);
      if (answerResult.completion) setCompletion(answerResult.completion);
      const messages = feedbackMessages[answerResult.isCorrect ? 'correct' : answerResult.capitalizationOnly ? 'capitalization' : 'incorrect'];
      setFeedback((previous) => {
        const alternatives = messages.filter((message) => message !== previous);
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      });
      if (answerResult.isCorrect) setScore((s) => s + 1);
      else setFailedQuestions((failed) => failed.some((question) => question.id === questionId)
        ? failed : [...failed, questions.find((question) => question.id === questionId)!]);
      return answerResult;
    } catch {
      setError('Kunde inte kontrollera svaret. Försök igen.');
      return null;
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const question = questions[index];
    if (question) void recordAnswer(question.id, answer);
  };

  const handleMatch = async (questionId: number, answer: string, hadMistake: boolean) => {
    const answerResult = await recordAnswer(questionId, hadMistake ? '__matching_mistake__' : answer);
    return answerResult !== null;
  };

  const next = () => {
    if (result === null) return;
    setResult(null);
    setFlashcardRevealed(false);
    setIndex((i) => i + 1);
  };

  const retryFailed = async () => {
    if (retryPending.current) return;
    retryPending.current = true;
    setLoading(true);
    setError(null);
    try {
      const round = await startQuizRound(wordSetId, typed, roundId, false, undefined, mode);
      setQuestions(round.questions);
      setRoundId(round.roundId);
      setFailedQuestions([]);
      setIndex(0);
      setScore(0);
      setResult(null);
      setCompletion(null);
      setFeedback('');
      setFlashcardRevealed(false);
      setMatchingProgress(0);
      setMatchingComplete(false);
    } catch {
      setError('Kunde inte starta omgången. Läxan kan ha ändrats. Försök igen eller gå tillbaka till Mina läxor.');
    } finally {
      retryPending.current = false;
      setLoading(false);
    }
  };

  const finished = mode === 'matching'
    ? matchingComplete
    : questions.length > 0 && index >= questions.length;
  const question = questions[index];
  const selectablePairs = wordSet?.wordPairs.filter((pair) => mode !== 'article' ||
    (foreignLanguage === 'German' && hasGermanArticle(pair.foreignWord))) ?? [];

  return (
    <Paper className="surface quiz-panel" p={{ base: 'lg', sm: 40 }}>
    <Stack gap="lg">
      <Text c="indigo" size="xs" fw={700} className="eyebrow">Ett ord i taget</Text>
      <Title order={1} size="h2">Ditt nästa framsteg</Title>
      <Text c="dimmed">Ta det i din egen takt. Varje försök räknas.</Text>
      <Text fw={600}>{({ choice: 'Flervalsförhör', typed: 'Skrivförhör', reverse: `Omvänd översättning från ${foreignLanguage === 'French' ? 'franska' : 'tyska'}`, matching: 'Matcha orden', article: 'Tysk artikel', flashcard: 'Gloskort' })[mode]}</Text>
      {difficultOnly && <Text c="orange.8">Svåra ord: öva på upp till 10 ord som ofta blivit fel.</Text>}
      <Text size="sm" c="dimmed">Stora och små bokstäver måste stämma.{typed && ' Tryck Enter eller Svara när du skriver svaret själv.'}</Text>
      {started && <Progress value={questions.length ? (mode === 'matching' ? matchingProgress : index) / questions.length * 100 : 0} radius="xl" size="sm" aria-label="Förhörets framsteg" />}
      {error && <Alert color="red">{error}</Alert>}
      {loading && <Text c="dimmed">{started ? 'Laddar frågor...' : difficultOnly ? 'Laddar svåra ord...' : 'Laddar läxans ord...'}</Text>}
      {!loading && !started && !difficultOnly && wordSet && (
        <Stack>
          <Group justify="space-between" align="center">
            <Text fw={600}>{wordSet.name}: {selectedQuestionIds.length} av {selectablePairs.length} ord valda</Text>
            <Checkbox
              label="Välj alla ord"
              checked={selectedQuestionIds.length === selectablePairs.length && selectablePairs.length > 0}
              indeterminate={selectedQuestionIds.length > 0 && selectedQuestionIds.length < selectablePairs.length}
              onChange={(event) => setSelectedQuestionIds(event.currentTarget.checked
                ? selectablePairs.flatMap((pair) => pair.id === undefined ? [] : [pair.id])
                : [])}
            />
          </Group>
          <Checkbox.Group
            value={selectedQuestionIds.map(String)}
            onChange={(values) => setSelectedQuestionIds(values.map(Number))}
            aria-label="Välj ord till förhöret"
          >
            <Stack gap="xs">
              {selectablePairs.map((pair) => pair.id !== undefined && (
                <Checkbox key={pair.id} value={String(pair.id)} label={
                  <Group gap="xs" wrap="wrap">
                    <Text component="span">{pair.swedishWord}</Text>
                    <Text component="span" c="dimmed">{pair.foreignWord}</Text>
                  </Group>
                } />
              ))}
            </Stack>
          </Checkbox.Group>
          {mode === 'article' && selectablePairs.length === 0 &&
            <Text size="sm" c="dimmed">Läxan saknar tyska ord som börjar med der, die eller das.</Text>}
          <Button onClick={beginQuiz} disabled={selectedQuestionIds.length === 0}>
            Starta förhör med {selectedQuestionIds.length} ord
          </Button>
        </Stack>
      )}
      {!loading && started && !error && questions.length === 0 && <Text>Det finns inga ord att öva på i den här läxan.</Text>}
      {finished && (
        <Stack>
          <Text size="xl">Klart! Resultat: {score} / {questions.length}</Text>
          {completion && (
            <Alert color="grape" title={`+${completion.earnedXp} XP! Bra kämpat!`}>
              <Stack gap="xs">
                <Text>{completion.leveledUp ? `Ny nivå! Du är nu på nivå ${completion.level}. Fortsätt glänsa!` : `Varje övning tar dig framåt. Du är på nivå ${completion.level}.`}</Text>
                {completion.newAchievements.map((achievement) => (
                  <Text key={achievement.id} fw={700}>Ny utmärkelse: {achievement.title} · Nivå {achievement.tier} — {achievement.description}</Text>
                ))}
              </Stack>
            </Alert>
          )}
          {failedQuestions.length > 0 && (
            <Button onClick={retryFailed} loading={loading}>Öva igen på felaktiga svar ({failedQuestions.length})</Button>
          )}
        </Stack>
      )}
      {question && !finished && (
        <>
          {mode !== 'matching' && <Text c="dimmed">Fråga {index + 1} av {questions.length}</Text>}
          {mode === 'matching' ? (
            <MatchingQuestion key={roundId} questions={questions} foreignLanguage={foreignLanguage} disabled={submitting}
              onMatch={handleMatch} onProgress={setMatchingProgress} onComplete={() => setMatchingComplete(true)} />
          ) : mode === 'flashcard' ? (
            <Stack>
              <Text size="xl" fw={500}>{question.prompt}</Text>
              {flashcardRevealed ? (
                <>
                  <Text size="lg" fw={700}>{question.foreignOptions[0]}</Text>
                  {result === null && <Group>
                    <Button onClick={() => handleAnswer(question.foreignOptions[0])}>Kunde det</Button>
                    <Button variant="light" onClick={() => handleAnswer('__flashcard_practice_again__')}>Öva igen</Button>
                  </Group>}
                </>
              ) : <Button onClick={() => setFlashcardRevealed(true)} w="fit-content">Visa svar</Button>}
            </Stack>
          ) : typed ? (
            <TypedAnswerQuestion key={question.id} question={question.prompt || question.swedishWord}
              answerLanguage={mode === 'reverse' ? 'svenska' : foreignLanguage === 'French' ? 'franska' : 'tyska'}
              onAnswer={handleAnswer} disabled={result !== null || submitting} />
          ) : (
            <MultipleChoiceQuestion question={question.prompt || question.swedishWord} options={question.foreignOptions}
              onAnswer={handleAnswer} disabled={result !== null || submitting} />
          )}
          {result !== null && (
            <>
              <Alert role="status" color={result.isCorrect ? 'green' : result.capitalizationOnly ? 'yellow' : 'red'}>
                <Stack gap={4}>
                  <Text>{feedback}</Text>
                  {typed && !result.isCorrect && result.correctAnswer && <Text fw={700}>Rätt svar: {result.correctAnswer}</Text>}
                  {result.exampleAndInflections && <Text>{result.exampleAndInflections}</Text>}
                </Stack>
              </Alert>
              <Button onClick={next}>Nästa</Button>
            </>
          )}
        </>
      )}
      <Button component={Link} to="/word-sets" variant="subtle">Till Mina läxor</Button>
    </Stack>
    </Paper>
  );
};

export default QuizPage;
