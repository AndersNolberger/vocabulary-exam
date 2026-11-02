import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Group, Modal, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { deleteWordSet, fetchWordSets } from '../api/wordSetsApi';
import { WordSet } from '../types';
import { fetchProgress, UserProgress } from '../api/progressApi';
import ProgressPanel from '../components/ProgressPanel';

const WordSetsPage = () => {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WordSet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const loadProgress = () => {
    setProgressError(null);
    fetchProgress()
      .then(setProgress)
      .catch(() => setProgressError('Kunde inte hämta din statistik och XP.'));
  };

  useEffect(() => {
    fetchWordSets()
      .then(setWordSets)
      .catch(() => setError('Kunde inte hämta läxor. Är du inloggad?'))
      .finally(() => setLoading(false));
    loadProgress();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteWordSet(deleteTarget.id);
      setWordSets((sets) => sets.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError('Kunde inte ta bort läxan. Försök igen.');
    } finally {
      setDeleting(false);
    }
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  if (loading) return <Stack aria-label="Laddar läxor"><Skeleton height={180} radius="xl" /><Skeleton height={220} radius="xl" /></Stack>;
  if (error) return <Alert color="red" title="Det gick inte att hämta dina läxor">
    {error} <Link to="/">Till inloggningen</Link>
  </Alert>;

  return (
    <>
      <Paper className="hero" p={{ base: 'xl', sm: 36 }} mb="xl">
        <Group justify="space-between" align="center">
          <div>
            <Text size="xs" fw={700} opacity={0.75} className="eyebrow" mb="sm">Din ordsamling</Text>
            <Title order={1}>Mina läxor</Title>
            <Text mt="sm" opacity={0.85}>Nästa framsteg börjar med ett litet förhör.</Text>
          </div>
          <Button component={Link} to="/create-word-set" variant="white" color="indigo" size="md">+ Skapa läxa</Button>
        </Group>
      </Paper>
      {progressError ? (
        <Alert color="red" mb="xl">
          {progressError} <Button variant="subtle" size="xs" onClick={loadProgress}>Försök igen</Button>
        </Alert>
      ) : progress ? <ProgressPanel progress={progress} /> : <Skeleton height={220} radius="xl" mb="xl" aria-label="Laddar framsteg" />}
      <Group justify="space-between" mb="lg">
        <Title order={2} size="h3">Dags att öva</Title>
        <Badge variant="light" size="lg">{wordSets.length} {wordSets.length === 1 ? 'läxa' : 'läxor'} · {wordSets.reduce((sum, ws) => sum + ws.wordPairs.length, 0)} ord</Badge>
      </Group>
      {wordSets.length === 0 && <Paper className="surface" p={40} ta="center">
        <Title order={3}>Här börjar din ordsamling</Title>
        <Text c="dimmed" my="md">Skapa din första läxa och fyll den med ord du vill lära dig.</Text>
        <Button component={Link} to="/create-word-set">Skapa min första läxa</Button>
      </Paper>}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {wordSets.map((ws) => {
          const stats = progress?.wordSets.find((s) => s.wordSetId === ws.id);
          return (
          <Card key={ws.id} radius="xl" padding="xl" className="surface wordset-card">
            <Badge variant="light" mb="lg" w="fit-content">{ws.wordPairs.length} ord att upptäcka</Badge>
            <Title order={3} mb="sm" style={{ overflowWrap: 'anywhere' }}>{ws.name}</Title>
            <Text size="sm" c="dimmed" className="word-preview" lineClamp={3} mb="lg">
              {ws.wordPairs.slice(0, 5).map((pair) => pair.swedishWord).join(' · ')}
            </Text>
            {stats && (
              <Stack gap={4} mb="lg" aria-label={`Statistik för ${ws.name}`}>
                <Text size="sm" fw={600}>{stats.completedRounds} avslutade omgångar</Text>
                {stats.completedRounds > 0 ? (
                  <>
                    <Text size="sm" c="dimmed">{stats.accuracyPercent}% rätt totalt · Bästa omgång: {stats.bestAccuracyPercent}%</Text>
                    <Text size="sm" c={stats.wordsToPractice > 0 ? 'orange.8' : 'teal.8'}>
                      {stats.wordsToPractice > 0 ? `${stats.wordsToPractice} ord att öva mer på` : 'Inga missade ord kvar. Snyggt jobbat!'}
                    </Text>
                  </>
                ) : <Text size="sm" c="dimmed">Ditt första förhör väntar!</Text>}
              </Stack>
            )}
            <Stack gap="xs" mt="auto">
              <Button component={Link} to={`/quiz/${ws.id}?mode=choice`} fullWidth>Starta flervalsförhör →</Button>
              <Button component={Link} to={`/quiz/${ws.id}?mode=typed`} variant="light" fullWidth>Starta skrivförhör →</Button>
              {stats && (
                <>
                  <Text size="xs" c="dimmed">{stats.difficultWords} {stats.difficultWords === 1 ? 'svårt ord' : 'svåra ord'}: minst 2 fel och minst 40% fel totalt.</Text>
                  {stats.difficultWords > 0 && (
                    <>
                      <Button component={Link} to={`/quiz/${ws.id}?mode=choice&practice=difficult`} color="orange" variant="light" fullWidth>Svåra ord: flerval</Button>
                      <Button component={Link} to={`/quiz/${ws.id}?mode=typed&practice=difficult`} color="orange" variant="light" fullWidth>Svåra ord: skriv själv</Button>
                    </>
                  )}
                </>
              )}
            </Stack>
            <Group justify="space-between" mt="sm" gap="xs">
              <Button component={Link} to={`/word-sets/${ws.id}/edit`} variant="subtle" size="xs">Redigera ord</Button>
              <Button color="red" variant="subtle" size="xs" onClick={() => {
                setDeleteError(null);
                setDeleteTarget(ws);
              }}>Ta bort läxa</Button>
            </Group>
          </Card>
        );
        })}
      </SimpleGrid>
      <Modal opened={deleteTarget !== null} onClose={closeDelete} title="Ta bort läxa?" centered
        closeOnClickOutside={!deleting} closeOnEscape={!deleting} withCloseButton={!deleting}>
        <Stack>
          <Text>Vill du ta bort <Text component="span" fw={700}>{deleteTarget?.name}</Text> och alla {deleteTarget?.wordPairs.length} ordpar?</Text>
          <Text size="sm" c="dimmed">Det går inte att ångra. Inga andra läxor påverkas.</Text>
          {deleteError && <Alert color="red">{deleteError}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDelete} disabled={deleting} data-autofocus>Avbryt</Button>
            <Button color="red" onClick={handleDelete} loading={deleting}>Ja, ta bort läxan</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default WordSetsPage;
