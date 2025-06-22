import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { userAgent } from 'next/server';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const router = useRouter();

    //  Nuevo useEffect: protección de ruta
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (!userData || userData.rol !== 'admin') {
          alert('Acceso denegado: no eres administrador');
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);
 





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

  const handleEstadoChange = async (orderId, newEstado) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { estado: newEstado });
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

  const openModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  const pedidosFiltrados = orders.filter(order =>
    (order.nombre?.toLowerCase() || '').includes(busqueda) ||
    (order.email?.toLowerCase() || '').includes(busqueda)
  );

  const downloadCSV = () => {
    if (!pedidosFiltrados.length) {
      alert('No hay pedidos para descargar');
      return;
    }

    const headers = ['Cliente', 'Correo', 'Teléfono', 'Dirección', 'Total', 'Estado'];
    const rows = pedidosFiltrados.map(order => [
      order.nombre || '',
      order.email || '',
      order.telefono || '',
      order.direccion || '',
      order.total ? Number(order.total).toFixed(2) : '',
      order.estado || '',
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(value => `"${value}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = 'pedidos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (!pedidosFiltrados.length) {
      alert('No hay pedidos para descargar');
      return;
    }

    const doc = new jsPDF();
    doc.text('Listado de Pedidos', 14, 15);

    const tableColumn = ['Cliente', 'Correo', 'Teléfono', 'Dirección', 'Total', 'Estado'];
    const tableRows = pedidosFiltrados.map(order => [
      order.nombre || '',
      order.email || '',
      order.telefono || '',
      order.direccion || '',
      order.total ? `$${Number(order.total).toFixed(2)}` : '',
      order.estado || ''
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save('pedidos.pdf');
  };

  if (loading) return <p className="p-4">Cargando pedidos...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <button
          onClick={downloadPDF}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Descargar PDF
        </button>

        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
          className="border p-2 w-full md:w-1/2 rounded"
        />

        <button
          onClick={downloadCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Descargar CSV
        </button>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        <>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Cliente</th>
                <th className="p-2">Correo</th>
                <th className="p-2">Teléfono</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">Total</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Cambiar Estado</th>
                <th className="p-2">Acciones</th>
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
                  <td className="p-2">
                    <select
                      value={order.estado}
                      onChange={(e) => handleEstadoChange(order.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                      <option value="entregado">Entregado</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => openModal(order)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {modalOpen && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded max-w-lg w-full max-h-[80vh] overflow-auto">
                <h2 className="text-xl font-bold mb-4">Detalles del Pedido</h2>
                <p><strong>Nombre:</strong> {selectedOrder.nombre}</p>
                <p><strong>Email:</strong> {selectedOrder.email}</p>
                <p><strong>Teléfono:</strong> {selectedOrder.telefono}</p>
                <p><strong>Dirección:</strong> {selectedOrder.direccion}</p>
                <p><strong>Estado:</strong> {selectedOrder.estado}</p>
                <p><strong>Total:</strong> ${Number(selectedOrder.total).toFixed(2)}</p>

                <h3 className="mt-4 font-semibold">Productos:</h3>
                <ul className="list-disc list-inside max-h-40 overflow-auto">
                  {selectedOrder.items && selectedOrder.items.map((item, i) => (
                    <li key={i}>
                      {item.nombre} x {item.quantity} - ${item.precio * item.quantity}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={closeModal}
                  className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
