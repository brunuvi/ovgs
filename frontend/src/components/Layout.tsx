import { AppShell, Burger, Group, NavLink, ScrollArea, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBox,
  IconCalendarEvent,
  IconClipboardList,
  IconHistory,
  IconLayoutDashboard,
  IconTruck,
  IconUsers,
} from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom';

const mainLinks = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/orders', label: 'Ordens de Venda', icon: IconClipboardList },
  { to: '/scheduling', label: 'Agendamento', icon: IconCalendarEvent },
  { to: '/audit', label: 'Auditoria', icon: IconHistory },
];

const registerLinks = [
  { to: '/clients', label: 'Clientes', icon: IconUsers },
  { to: '/transport-types', label: 'Transportes', icon: IconTruck },
  { to: '/items', label: 'Itens', icon: IconBox },
];

export function Layout() {
  const [opened, { toggle }] = useDisclosure();
  const { pathname } = useLocation();

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="xs">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={800} size="lg" c="blue">
            OVGS
          </Text>
          <Text c="dimmed" size="sm">
            Gestão de Ordens de Venda
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          {mainLinks.map((l) => (
            <NavLink
              key={l.to}
              component={RouterNavLink}
              to={l.to}
              label={l.label}
              leftSection={<l.icon size={18} stroke={1.6} />}
              active={isActive(l.to, l.end)}
              onClick={toggle}
            />
          ))}

          <Title order={6} c="dimmed" mt="md" mb={4} px="sm">
            Cadastros
          </Title>
          {registerLinks.map((l) => (
            <NavLink
              key={l.to}
              component={RouterNavLink}
              to={l.to}
              label={l.label}
              leftSection={<l.icon size={18} stroke={1.6} />}
              active={isActive(l.to)}
              onClick={toggle}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
