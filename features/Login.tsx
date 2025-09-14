
import React, { useState } from 'react';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';

interface LoginProps {
  onLogin: (user: string, pass: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username, password);
    if (!success) {
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto overflow-hidden bg-lino rounded-lg shadow-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-espresso mb-2">
            Gestor Maruê
          </h1>
          <p className="text-center text-oliva mb-8">
            Faça login para continuar
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Usuário"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Senha"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
