import { useState } from 'react';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPassword() {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Ingresa tu correo');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Correo de restablecimiento enviado');
      setEmail('');
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Restablecer Contraseña</h1>
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
        >
          Enviar correo
        </button>
      </form>
    </div>
  );
}
