import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function fetchOrders() {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const orderList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderList);
    }

    fetchOrders();
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, { estado: newStatus });
    setOrders(prev =>
      prev.map(order =>
        order.id === id ? { ...order, estado: newStatus } : order
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      {orders.length === 0 ? (
        <p>No hay pedidos aún.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="border p-4 mb-4 rounded shadow">
            <p><strong>Cliente:</strong> {order.nombre}</p>
            <p><strong>Email:</strong> {order.email}</p>
            <p><strong>Teléfono:</strong> {order.telefono}</p>
            <p><strong>Dirección:</strong> {order.direccion}</p>
            <p>
              <strong>Total:</strong> $
              {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
            </p>
            <p><strong>Estado:</strong> {order.estado}</p>
            <ul className="mt-2">
              {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                <li key={idx}>
                  - {item.nombre} x {item.quantity} (${item.precio * item.quantity})
                </li>
              ))}
            </ul>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => updateOrderStatus(order.id, 'completado')}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Marcar como Completado
              </button>
              <button
                onClick={() => updateOrderStatus(order.id, 'pendiente')}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Marcar como Pendiente
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
