import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {doc, updateDoc} from 'firebase/firestore'

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState(' ');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersList = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersList);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener pedidos:', error);
      }
    };

    fetchOrders();
  }, []);

  //funcion de cambio de orden 

const handleEstadoChange = async (orderId, newEstado) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { estado: newEstado });

    // Opcional: actualiza en el frontend también
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, estado: newEstado } : order
      )
    );
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    alert('No se pudo actualizar el estado.');
  }
};




  if (loading) return <p className="p-4">Cargando pedidos...</p>;
    const pedidosFiltrados = orders.filter(order =>
  (order.nombre?.toLowerCase() || '').includes(busqueda) ||
  (order.email?.toLowerCase() || '').includes(busqueda)
);



 

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>
        <div className="mb-4">
  <input
    type="text"
    placeholder="Buscar por nombre o correo..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
    className="border p-2 w-full md:w-1/2 rounded"/>
    </div>

      {orders.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Cliente</th>
              <th className="p-2">Correo</th>
              <th className="p-2">Teléfono</th>
              <th className="p-2">Dirección</th>
              <th className="p-2">Total</th>
              <th className="p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map(order => (
              <tr key={order.id} className="border-t">
                <td className="p-2">{order.nombre}</td>
                <td className="p-2">{order.email}</td>
                <td className="p-2">{order.telefono}</td>
                <td className="p-2">{order.direccion}</td>
                <td className="p-2">{order.total ? `$${Number(order.total).toFixed(2)}` : 'N/A'}</td>
                <td className="p-2 capitalize">{order.estado}</td>

                //
                <td className="p-2">
        <select
            value={order.estado}
            onChange={(e) => handleEstadoChange(order.id, e.target.value)}
            className="border rounded px-2 py-1" >
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
            <option value="entregado">Entregado</option>
        </select>
        </td>



                //
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
