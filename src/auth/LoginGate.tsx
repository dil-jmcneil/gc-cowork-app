import { Alert, Button, Card, CardContent, Container, FormControl, FormLabel, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, type FormEvent, type ReactNode } from "react";

import { useAuthStore } from "./authStore";

/** Blocks the app behind a simple username/password form. See AuthEnv for what this actually protects against. */
export function LoginGate({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const { tokens } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);

  if (isAuthenticated) return <>{children}</>;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFailed(!login(username, password));
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Card sx={{ width: "100%", bgcolor: tokens.semantic.color.surface.default.value }}>
        <CardContent sx={{ p: 3 }}>
          <Stack component="form" onSubmit={handleSubmit} gap={2}>
            <Stack gap={0.5}>
              <Typography variant="h4" component="h1">
                GC Cowork
              </Typography>
              <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
                Sign in to view this prototype.
              </Typography>
            </Stack>

            {failed ? <Alert severity="error">That username or password isn't right.</Alert> : null}

            <FormControl fullWidth>
              <FormLabel htmlFor="login-username">Username</FormLabel>
              <TextField
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                slotProps={{ input: { id: "login-username", autoComplete: "username" } }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel htmlFor="login-password">Password</FormLabel>
              <TextField
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{ input: { id: "login-password", autoComplete: "current-password" } }}
              />
            </FormControl>

            <Button type="submit" variant="contained" fullWidth>
              Sign in
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
