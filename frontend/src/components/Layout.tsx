import { Alert, Container, Group, Text } from '@mantine/core';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import apiClient from '../api/client';

const Layout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setAuthenticated(false);
    setSessionError(false);
    apiClient.get<{ isAuthenticated: boolean }>('/auth/session', { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setAuthenticated(data.isAuthenticated);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSessionError(true);
      });
    return () => controller.abort();
  }, [pathname]);

  return (
  <div className="app-shell">
    <header className="app-header">
      <Container size="lg" className="header-inner">
        <Link to="/" className="brand">
          <Group gap="sm">
            <span className="brand-mark" aria-hidden="true">G</span>
            <div>
              <Text fw={800} size="xl" lh={1.2}>Glosförhör</Text>
              <Text size="xs" c="dimmed">Små steg. Stora framsteg.</Text>
            </div>
          </Group>
        </Link>
        {authenticated && <nav aria-label="Huvudmeny">
          <Group gap={4}>
            <NavLink className="nav-link" to="/word-sets">Mina läxor</NavLink>
            <NavLink className="nav-link" to="/create-word-set">+ Skapa läxa</NavLink>
          </Group>
        </nav>}
      </Container>
    </header>
    <Container component="main" size="lg" className="app-main">
      {sessionError && <Alert color="yellow" mb="lg">Kunde inte kontrollera inloggningen. Ladda om sidan för att försöka igen.</Alert>}
      {children}
    </Container>
    <footer className="app-footer">Lite övning varje dag gör stor skillnad.</footer>
  </div>
  );
};

export default Layout;
