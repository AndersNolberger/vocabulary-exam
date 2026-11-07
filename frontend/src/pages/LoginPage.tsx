import { Badge, Button, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';

const LoginPage = () => {
  const returnUrl = encodeURIComponent(`${window.location.origin}/word-sets`);

  return (
    <Paper className="surface" style={{ overflow: 'hidden' }}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
        <div className="login-art">
          <Badge variant="white" color="indigo" w="fit-content">Din nästa aha-upplevelse</Badge>
          <Title order={1} mt="lg" size="2.5rem">Nya ord.<br />Nya möjligheter.</Title>
          <div className="vocab-tile">
            <Text size="xs" opacity={0.75} className="eyebrow">Dagens lilla upptäckt</Text>
            <Text size="xl" fw={700} mt="xs">möjlighet → Möglichkeit</Text>
            <Text size="sm" opacity={0.8} mt="xs">Ett ord närmare nästa mål.</Text>
          </div>
          <Text opacity={0.85}>Samla dina glosor, öva i din egen takt och se hur mycket du kan.</Text>
        </div>
        <Stack justify="center" p={{ base: 'xl', sm: 48 }} gap="lg">
          <div>
            <Text size="xs" c="indigo" fw={700} className="eyebrow" mb="sm">Välkommen tillbaka</Text>
            <Title order={2}>Redo att lära dig mer?</Title>
            <Text c="dimmed" mt="sm">Logga in för att skapa dina egna läxor och komma igång med ditt nästa förhör.</Text>
          </div>
          <Button size="lg" component="a" href={`/api/auth/login/microsoft?returnUrl=${returnUrl}`}
            leftSection={<span className="microsoft-mark" aria-hidden="true"><span /><span /><span /><span /></span>}>
            Logga in med Microsoft
          </Button>
          <Text size="xs" c="dimmed" ta="center">Dina läxor sparas på ditt konto.</Text>
        </Stack>
      </SimpleGrid>
    </Paper>
  );
};

export default LoginPage;
