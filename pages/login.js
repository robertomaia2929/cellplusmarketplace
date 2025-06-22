import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
//import {Navbar} from  "@/componentes/Navbar"

// nav bar





export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          nombre,
          email,
          telefono,
        });
        alert("Usuario registrado con éxito");
                router.push('/')
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Inicio de sesión exitoso");
        router.push('/')
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">
        {isRegistering ? 'Registro de Usuario' : 'Iniciar Sesión'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
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
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}{' '}
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-600 underline"
        >
          {isRegistering ? 'Inicia sesión' : 'Regístrate'}
        </button>
      </p>
    </div>
  );
}
