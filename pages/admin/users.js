import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Usuarios Registrados</h1>
      {users.length === 0 ? (
        <p>No hay usuarios registrados.</p>
      ) : (
        <ul className="space-y-4">
          {users.map(user => (
            <li key={user.id} className="p-4 border rounded shadow">
              <p><strong>Nombre:</strong> {user.nombre}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Teléfono:</strong> {user.telefono}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
