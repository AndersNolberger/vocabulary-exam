import { useState } from 'react';
import { Accordion, Badge, Card, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { UserProgress } from '../api/progressApi';

const ProgressPanel = ({ progress }: { progress: UserProgress }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const unlocked = progress.achievements.filter((a) => a.unlocked).length;
  const categories = [...new Set(progress.achievements.map((a) => a.categoryId))].map((id) =>
    progress.achievements.filter((a) => a.categoryId === id).sort((a, b) => a.tier - b.tier));
  return (
  <Paper className="surface" p={{ base: 'lg', sm: 28 }} mb="xl">
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Text c="indigo" size="xs" fw={700} className="eyebrow">Din kunskapsresa</Text>
          <Title order={2} size="h3">Små steg blir stora framsteg</Title>
        </div>
        <Badge size="xl" variant="light" color="grape">Nivå {progress.level}</Badge>
      </Group>
      <Group justify="space-between">
        <Text fw={700}>{progress.totalXp} XP totalt</Text>
        <Text size="sm" c="dimmed">{progress.xpForNextLevel - progress.xpInLevel} XP till nivå {progress.level + 1}</Text>
      </Group>
      <Progress value={progress.xpInLevel / progress.xpForNextLevel * 100} color="grape" size="lg" radius="xl" aria-label="XP till nästa nivå" />
      <Text size="xs" c="dimmed">{progress.xpInLevel} / {progress.xpForNextLevel} XP på denna nivå. Varje ny nivå kräver 50% mer XP.</Text>
      <Text size="sm" c="dimmed">
        {progress.completedRounds} avslutade omgångar · {progress.correctAnswers} rätta svar.
        {' '}10 XP per rätt svar + 20 XP per avslutad omgång, även när du övar på missade ord.
      </Text>
      <Accordion value={expanded} onChange={setExpanded} order={3} variant="contained" radius="lg">
        <Accordion.Item value="achievements">
          <Accordion.Control>
            <Text component="span" fw={700}>Dina utmärkelser</Text>
            {expanded === null && (
              <Text component="span" display="block" size="xs" c="dimmed">
                {unlocked} / {progress.achievements.length} utmärkelsenivåer upplåsta
              </Text>
            )}
          </Accordion.Control>
          <Accordion.Panel>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {categories.map((tiers) => {
          const achievement = tiers.find((a) => !a.unlocked) ?? tiers[tiers.length - 1];
          const earned = tiers.filter((a) => a.unlocked).length;
          return (
          <Card key={achievement.id} withBorder radius="lg" padding="md" bg={achievement.unlocked ? 'grape.0' : undefined}>
            <Stack gap="xs">
              <Badge color={achievement.unlocked ? 'grape' : 'gray'} variant="light" w="fit-content">
                {earned === tiers.length ? 'Alla nivåer upplåsta!' : earned > 0 ? `Nivå ${earned} upplåst` : 'Nästa mål'}
              </Badge>
              <Text fw={700}>{achievement.title} · Nivå {achievement.tier}</Text>
              <Text size="sm" c="dimmed">{achievement.description}</Text>
              <Text size="xs" c="dimmed">{tiers.map((a) => `Nivå ${a.tier}: ${a.target}`).join(' · ')}</Text>
              <Progress value={achievement.current / achievement.target * 100} color="grape"
                aria-label={`${achievement.title} nivå ${achievement.tier}: ${achievement.current} av ${achievement.target}`} />
              <Text size="xs" c="dimmed">{achievement.current} / {achievement.target}</Text>
            </Stack>
          </Card>
        );
        })}
      </SimpleGrid>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  </Paper>
  );
};

export default ProgressPanel;
