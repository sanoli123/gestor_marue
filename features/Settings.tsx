
import React, { useState, FormEvent } from 'react';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';

type Credentials = { user: string; pass: string };

interface SettingsProps {
    credentials: Credentials;
    onSave: (newCredentials: Credentials) => void;
}

const Settings: React.FC<SettingsProps> = ({ credentials, onSave }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState(credentials.user);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // 1. Verify current password
        if (currentPassword !== credentials.pass) {
            setError('A senha atual está incorreta.');
            return;
        }

        // 2. Check if new password needs to be updated and if it matches confirmation
        if (newPassword) {
            if (newPassword.length < 4) {
                setError('A nova senha deve ter pelo menos 4 caracteres.');
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('As novas senhas não coincidem.');
                return;
            }
        }
        
        // 3. Prepare new credentials
        const updatedCredentials = {
            user: newUsername.trim() || credentials.user, // Fallback to old username if new one is empty
            pass: newPassword || credentials.pass, // Fallback to old password if new one is empty
        };

        // 4. Save and give feedback
        onSave(updatedCredentials);
        setSuccess('Credenciais atualizadas com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-espresso">Configurações da Conta</h1>
            <div className="bg-lino p-6 sm:p-8 rounded-xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-oliva">
                        Para alterar suas credenciais, primeiro confirme sua senha atual.
                        Deixe os campos de nova senha em branco se não quiser alterá-la.
                    </p>
                    
                    <Input
                        label="Senha Atual"
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <hr className="border-crema" />

                    <h2 className="text-xl font-bold text-espresso pt-4">Novas Credenciais</h2>
                    <Input
                        label="Novo Nome de Usuário"
                        id="new-username"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Nova Senha (mín. 4 caracteres)"
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                        <Input
                            label="Confirmar Nova Senha"
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-3 rounded-md">{error}</p>}
                    {success && <p className="text-green-700 text-sm text-center bg-green-100 p-3 rounded-md">{success}</p>}
                    
                    <div className="flex justify-end">
                        <Button type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
