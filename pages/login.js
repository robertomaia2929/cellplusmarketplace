import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');

  const validarEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      toast.error('Por favor ingresa un email válido');
      return;
    }
    if (!validarEmail(email)) {
      toast.error('Email no válido');
      return;
    }

    if (isResettingPassword) {
      // Recuperar contraseña
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success('Email de restablecimiento enviado');
        setIsResettingPassword(false);
        setEmail('');
      } catch (err) {
        console.error(err);
        toast.error('Error al enviar email de recuperación');
      }
      return;
    }

    if (isRegistering) {
      if (!password.trim() || password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!nombre.trim() || !telefono.trim()) {
        toast.error('Por favor completa todos los campos');
        return;
      }
    } else {
      if (!password.trim()) {
        toast.error('Por favor ingresa tu contraseña');
        return;
      }
    }

    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          nombre,
          email,
          telefono,
          rol: 'cliente',
          creado: new Date(),
        });
        await sendEmailVerification(userCred.user);
        toast.success('Usuario registrado. Revisa tu correo para verificar tu cuenta.');
        router.push('/login');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          toast.error('Por favor verifica tu correo antes de iniciar sesión');
          return;
        }
        toast.success('Inicio de sesión exitoso');
        router.push('/admin'); // o la ruta que uses
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <Toaster />
      <h1 className="text-xl font-bold mb-4">
        {isResettingPassword
          ? 'Recuperar Contraseña'
          : isRegistering
          ? 'Registro de Usuario'
          : 'Iniciar Sesión'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isResettingPassword && isRegistering && (
          <>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </>
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {!isResettingPassword && (
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required={!isResettingPassword}
          />
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          {isResettingPassword
            ? 'Enviar email para restablecer'
            : isRegistering
            ? 'Registrarse'
            : 'Iniciar Sesión'}
        </button>
      </form>

      {!isResettingPassword ? (
        <p className="mt-4 text-center text-sm">
          {isRegistering
            ? '¿Ya tienes una cuenta? '
            : '¿No tienes una cuenta? '}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-blue-600 underline"
          >
            {isRegistering ? 'Inicia sesión' : 'Regístrate'}
          </button>
          {!isRegistering && (
            <>
              <br />
              <button
                onClick={() => {
                  setIsResettingPassword(true);
                  setError('');
                }}
                className="text-blue-600 underline mt-2"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
        </p>
      ) : (
        <p className="mt-4 text-center text-sm">
          <button
            onClick={() => {
              setIsResettingPassword(false);
              setError('');
            }}
            className="text-blue-600 underline"
          >
            Volver al login
          </button>
        </p>
      )}
    </div>
  );
}
